import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

interface ExtractedContact {
  name: string;
  phone: string;
  address: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // Initialize VLM
    const zai = await ZAI.create();

    const prompt = `You are an OCR data extraction assistant. This image contains a table with contact information.

The table has 2 columns:
- Column 1: Person's NAME
- Column 2: Contains PHONE NUMBER followed by ADDRESS (separated by a space)

Your task:
1. Read ALL rows in the table
2. For each row, extract:
   - name: The person's full name
   - phone: The phone number (typically 10-13 digits)
   - address: The address text that comes AFTER the phone number

IMPORTANT:
- Extract ALL rows visible in the image
- Do not skip any rows
- Clean up the address text (remove extra spaces, fix OCR errors)
- If a phone number starts with 0, keep it as is

Return ONLY a valid JSON array with this exact format. No markdown, no explanation:
[
  {"name": "...", "phone": "...", "address": "..."},
  {"name": "...", "phone": "...", "address": "..."}
]`;

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}` }
            }
          ]
        }
      ],
      thinking: { type: 'disabled' }
    });

    let content = response.choices[0]?.message?.content || '';

    // Clean up response - extract JSON from potential markdown
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let contacts: ExtractedContact[];
    try {
      contacts = JSON.parse(content);
    } catch {
      // Try to extract JSON array from the content
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        contacts = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          { error: 'Failed to parse extracted data. Please try with a clearer image.' },
          { status: 422 }
        );
      }
    }

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { error: 'No contacts found in the image' },
        { status: 422 }
      );
    }

    // Auto-save all contacts to database
    const savedContacts = await db.contact.createMany({
      data: contacts.map((c) => ({
        name: c.name || 'Unknown',
        phone: c.phone || '',
        address: c.address || '',
      })),
    });

    // Fetch the saved contacts to return with IDs
    const allContacts = await db.contact.findMany({
      orderBy: { createdAt: 'desc' },
      take: savedContacts.count,
    });

    return NextResponse.json({
      success: true,
      count: savedContacts.count,
      contacts: allContacts.reverse(),
    });
  } catch (error) {
    console.error('Extract API error:', error);
    return NextResponse.json(
      { error: 'Failed to extract contacts from image. Please try again.' },
      { status: 500 }
    );
  }
}
