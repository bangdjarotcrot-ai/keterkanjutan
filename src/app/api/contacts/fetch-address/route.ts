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

// Strategy 1: Current behavior
// Strip punctuation, remove words < 3 chars, remove "blok"
function trimStrategy1(address: string): string {
  return address
    .replace(/[,.\-:/]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !/^blok$/i.test(word))
    .join(' ')
    .trim();
}

// Strategy 2: More aggressive keyword stripping
// Also removes: VILLA, PERUMAHAN, PERUM, TAMAN, RESIDENCE, COMPLEX, GRAND, GREEN,
// JL, JI, JALAN, NO, NOMOR, RT, RW, BLOK, GANG, GG, block codes (A5, B8), single letters
function trimStrategy2(address: string): string {
  const addressKeywords =
    /^(villa|perumahan|perum|taman|residence|complex|grand|green|jl|ji|jalan|no|nomor|rt|rw|blok|gang|gg)$/i;
  const blockCode = /^[A-Za-z]\d+$/;
  const singleLetter = /^[A-Za-z]$/;

  return address
    .replace(/[,.\-:/]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(
      (word) =>
        word.length >= 3 &&
        !addressKeywords.test(word) &&
        !blockCode.test(word) &&
        !singleLetter.test(word)
    )
    .join(' ')
    .trim();
}

// Strategy 3: First 2 meaningful words only
function trimStrategy3(address: string): string {
  const meaningful = address
    .replace(/[,.\-:/]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((word) => word.length >= 3);

  return meaningful.slice(0, 2).join(' ').trim();
}

// Strategy 4: Individual words — returns array of single words to try
function trimStrategy4(address: string): string[] {
  return [
    ...new Set(
      address
        .replace(/[,.\-:/]+/g, ' ')
        .trim()
        .split(/\s+/)
        .filter((word) => word.length >= 3)
        .map((word) => word.trim())
        .filter((word) => word.length > 0)
    ),
  ];
}

// Get trimmed queries for a given strategy
function getQueriesForStrategy(address: string, strategy: number): string[] {
  switch (strategy) {
    case 1: {
      const t = trimStrategy1(address);
      return t ? [t] : [];
    }
    case 2: {
      const t = trimStrategy2(address);
      return t ? [t] : [];
    }
    case 3: {
      const t = trimStrategy3(address);
      return t ? [t] : [];
    }
    case 4: {
      return trimStrategy4(address);
    }
    default: {
      const t = trimStrategy1(address);
      return t ? [t] : [];
    }
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Single Nominatim query
async function queryNominatim(query: string, keywordSuffix: string) {
  const suffix = keywordSuffix.trim();
  const fullQuery = suffix ? `${query}, ${suffix}` : query;
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=id&q=${encodeURIComponent(fullQuery)}`;

  console.log(`[Nominatim] Strategy query: "${fullQuery}"`);

  const response = await fetch(url, {
    headers: { 'User-Agent': 'ContactExtractorApp/1.0' },
  });

  if (!response.ok) {
    throw new Error(`Nominatim API error: ${response.status}`);
  }

  const results = await response.json();

  if (results.length === 0) {
    console.log(`[Nominatim] No results for: "${fullQuery}"`);
    return null;
  }

  const first = results[0];
  const details = extractAddressDetails(first);
  console.log(`[Nominatim] Found: "${first.display_name}"`, details);
  return details;
}

// POST /api/contacts/fetch-address
// Body: { id, keywordSuffix?, strategies?: number[] }
// Default strategies: [1] (current behavior)
// Pass [2,3,4] for fallback retry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, keywordSuffix = 'KEPRI', strategies = [1] } = body;

    if (!id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    }

    const keyword = typeof keywordSuffix === 'string' ? keywordSuffix : 'KEPRI';

    const contact = await db.contact.findUnique({ where: { id } });
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    console.log(`[FetchAddress] Contact: ${contact.name} (${contact.address}) | Strategies: [${strategies.join(',')}]`);

    // Try each strategy in order
    for (let si = 0; si < strategies.length; si++) {
      const strategy = strategies[si];
      const queries = getQueriesForStrategy(contact.address, strategy);

      for (const query of queries) {
        const details = await queryNominatim(query, keyword);

        if (details) {
          const { kecamatan, kelurahan, kota, provinsi, fullAddress, postcode, latitude, longitude } = details;

          const updated = await db.contact.update({
            where: { id: contact.id },
            data: { kecamatan, kelurahan, kota, provinsi, fullAddress, postcode, latitude, longitude },
          });

          console.log(`[FetchAddress] ✅ ${contact.name} found on strategy ${strategy}:`, {
            kecamatan, kelurahan, kota, provinsi, latitude, longitude,
          });

          return NextResponse.json({
            success: true,
            contact: updated,
            strategyUsed: strategy,
          });
        }
      }

      // Delay between strategies (respect Nominatim rate limit)
      if (si < strategies.length - 1) {
        await delay(1100);
      }
    }

    // All strategies exhausted
    console.log(`[FetchAddress] ❌ ${contact.name}: all ${strategies.length} strategy(ies) failed`);

    return NextResponse.json({
      success: false,
      status: 'ALL_STRATEGIES_FAILED',
      error: `No address found after trying ${strategies.length} strategy(ies)`,
      contact: {
        id: contact.id,
        kecamatan: null,
        kelurahan: null,
        kota: null,
        provinsi: null,
        latitude: null,
        longitude: null,
        fullAddress: null,
        postcode: null,
      },
    });
  } catch (error) {
    console.error('[FetchAddress] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch address details', details: String(error) },
      { status: 500 }
    );
  }
}
