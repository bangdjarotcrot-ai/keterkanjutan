import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const contacts = await db.contact.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['Name', 'Phone', 'Address', 'Kecamatan', 'Kelurahan', 'Kota', 'Provinsi', 'Full Address', 'Latitude', 'Longitude', 'Postcode'];
    const rows = contacts.map((c) =>
      [
        c.name,
        c.phone,
        c.address,
        c.kecamatan ?? '',
        c.kelurahan ?? '',
        c.kota ?? '',
        c.provinsi ?? '',
        c.fullAddress ?? '',
        c.latitude ?? '',
        c.longitude ?? '',
        c.postcode ?? '',
      ]
        .map((field) => `"${String(field).replace(/"/g, '""')}"`)
        .join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');

    return new NextResponse('\uFEFF' + csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="contacts-all-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export all error:', error);
    return NextResponse.json({ error: 'Failed to export contacts' }, { status: 500 });
  }
}
