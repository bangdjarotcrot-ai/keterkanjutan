import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/contacts/map-data - Returns contacts with coordinates for map display
export async function GET() {
  try {
    const contacts = await db.contact.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        fullAddress: true,
        latitude: true,
        longitude: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      count: contacts.length,
      contacts,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Map data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch map data', details: message },
      { status: 500 }
    );
  }
}
