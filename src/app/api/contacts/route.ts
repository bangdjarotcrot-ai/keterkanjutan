import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { phone: { contains: search } },
            { address: { contains: search } },
            { kecamatan: { contains: search } },
            { kelurahan: { contains: search } },
            { kota: { contains: search } },
            { provinsi: { contains: search } },
          ],
        }
      : {};

    const [contacts, total] = await Promise.all([
      db.contact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      db.contact.count({ where }),
    ]);

    const hasMore = offset + contacts.length < total;

    return NextResponse.json({
      success: true,
      contacts,
      total,
      hasMore,
      offset,
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (ids && Array.isArray(ids) && ids.length > 0) {
      await db.contact.deleteMany({
        where: { id: { in: ids } },
      });
      return NextResponse.json({ success: true, message: 'Contacts deleted' });
    }

    // Clear all if no ids provided
    await db.contact.deleteMany();
    return NextResponse.json({ success: true, message: 'All contacts cleared' });
  } catch (error) {
    console.error('Delete contacts error:', error);
    return NextResponse.json(
      { error: 'Failed to delete contacts' },
      { status: 500 }
    );
  }
}
