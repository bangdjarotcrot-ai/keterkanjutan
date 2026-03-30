import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface NominatimResult {
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: {
    county?: string;
    city_district?: string;
    suburb?: string;
    village?: string;
    residential?: string;
    city?: string;
    town?: string;
    state?: string;
    road?: string;
    postcode?: string;
  };
}

function extractAddressDetails(result: NominatimResult) {
  const addr = result.address || {};
  return {
    kecamatan: addr.county || addr.city_district || null,
    kelurahan: addr.residential || addr.suburb || addr.village || null,
    kota: addr.city || addr.town || null,
    provinsi: addr.state || null,
    fullAddress: result.display_name || null,
    postcode: addr.postcode || null,
    latitude: result.lat ? parseFloat(result.lat) : null,
    longitude: result.lon ? parseFloat(result.lon) : null,
  };
}

// Trim address for better Nominatim search results:
// 1. Strip all commas and dots
// 2. Remove words shorter than 3 characters
// 3. Remove the word "blok" (case-insensitive)
function trimAddress(address: string): string {
  return address
    .replace(/[,.\-:/]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !/^blok$/i.test(word))
    .join(' ')
    .trim()
}

async function fetchFromNominatim(
  address: string,
  keywordSuffix: string
): Promise<{
  kecamatan: string | null;
  kelurahan: string | null;
  kota: string | null;
  provinsi: string | null;
  fullAddress: string | null;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  searchUrl: string;
  trimmedAddress: string;
  fullQuery: string;
}> {
  const trimmed = trimAddress(address)
  const fullQuery = keywordSuffix.trim()
    ? `${trimmed}, ${keywordSuffix.trim()}`
    : trimmed

  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=id&q=${encodeURIComponent(fullQuery)}`

  console.log(`[Nominatim] Searching: "${address}" → trimmed "${trimmed}" → query "${fullQuery}"`)
  console.log(`[Nominatim] URL: ${url}`)

  const response = await fetch(url, {
    headers: { 'User-Agent': 'ContactExtractorApp/1.0' },
  })

  if (!response.ok) {
    throw new Error(`Nominatim API error: ${response.status}`)
  }

  const results = await response.json()
  console.log(`[Nominatim] Results: ${results.length}`)

  if (results.length === 0) {
    return {
      kecamatan: null,
      kelurahan: null,
      kota: null,
      provinsi: null,
      fullAddress: null,
      postcode: null,
      latitude: null,
      longitude: null,
      status: 'NO_RESULTS',
      searchUrl: url,
      trimmedAddress: trimmed,
      fullQuery,
    }
  }

  const firstResult = results[0]
  const details = extractAddressDetails(firstResult)
  console.log(`[Nominatim] Top result: "${firstResult.display_name}" →`, details)

  return {
    ...details,
    status: 'FOUND',
    searchUrl: url,
    trimmedAddress: trimmed,
    fullQuery,
  }
}

// Single contact fetch — called one at a time from frontend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, keywordSuffix = 'KEPRI' } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      )
    }

    const keyword = typeof keywordSuffix === 'string' ? keywordSuffix : 'KEPRI'

    const contact = await db.contact.findUnique({
      where: { id },
    })

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    console.log(`[FetchAddress] Contact: ${contact.name} (${contact.address})`)

    const result = await fetchFromNominatim(contact.address, keyword)

    if (result.status === 'FOUND') {
      const { kecamatan, kelurahan, kota, provinsi, fullAddress, postcode, latitude, longitude } = result

      const updated = await db.contact.update({
        where: { id: contact.id },
        data: { kecamatan, kelurahan, kota, provinsi, fullAddress, postcode, latitude, longitude },
      })

      console.log(`[FetchAddress] Updated ${contact.name}:`, { kecamatan, kelurahan, kota, provinsi, latitude, longitude })

      return NextResponse.json({
        success: true,
        contact: updated,
        searchUrl: result.searchUrl,
        trimmedAddress: result.trimmedAddress,
        fullQuery: result.fullQuery,
      })
    } else {
      console.log(`[FetchAddress] No results for ${contact.name}: "${result.fullQuery}"`)

      return NextResponse.json({
        success: false,
        status: 'NO_RESULTS',
        error: `No address found for "${result.fullQuery}"`,
        searchUrl: result.searchUrl,
        trimmedAddress: result.trimmedAddress,
        fullQuery: result.fullQuery,
        contact: { id: contact.id, kecamatan: null, kelurahan: null, kota: null, provinsi: null, latitude: null, longitude: null, fullAddress: null, postcode: null },
      })
    }
  } catch (error) {
    console.error('[FetchAddress] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch address details', details: String(error) },
      { status: 500 }
    )
  }
}
