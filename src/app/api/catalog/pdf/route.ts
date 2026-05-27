import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, parseBody, handleError } from '@/lib/api-helpers';
import { generateCatalogPDF } from '@/lib/pdf-catalog';

export const runtime = 'nodejs';
export const maxDuration = 60;

const Schema = z.object({
  family_ids: z.array(z.number().int().positive()).optional(),
  product_ids: z.array(z.number().int().positive()).optional(),
  include_description: z.boolean().optional(),
  order: z.enum(['family', 'name', 'price']).optional(),
});

export async function POST(req: NextRequest) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  const body = await parseBody(req, Schema); if (body instanceof NextResponse) return body;
  try {
    const pdf = await generateCatalogPDF(body);
    return new NextResponse(new Uint8Array(pdf), {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="catalogo-petita.pdf"` },
    });
  } catch (e) { return handleError(e); }
}
