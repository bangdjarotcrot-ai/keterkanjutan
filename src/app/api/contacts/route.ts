import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor') || null;

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

    // Cursor-based: fetch items created BEFORE the cursor
    const cursorWhere = cursor
      ? {
          ...where,
          createdAt: { lt: cursor },
        }
      : where;

    const [contacts, total] = await Promise.all([
      db.contact.findMany({
        where: cursorWhere,
        orderBy: { createdAt: 'desc' },
        take: limit + 1, // fetch one extra to detect hasMore
      }),
      db.contact.count({ where }),
    ]);

    // If we got limit+1 items, there are more pages
    const hasMore = contacts.length > limit;
    const pageContacts = hasMore ? contacts.slice(0, limit) : contacts;

    // The cursor for the next page is the createdAt of the last item
    const nextCursor = hasMore && pageContacts.length > 0
      ? pageContacts[pageContacts.length - 1].createdAt.toISOString()
      : null;

    return NextResponse.json({
      success: true,
      contacts: pageContacts,
      total,
      hasMore,
      nextCursor,
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
