import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireAuth, fail, handleError } from '@/lib/api-helpers';
import { generateCatalogPDF } from '@/lib/pdf-catalog';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  try {
    const { rows } = await q<any>(`SELECT * FROM petita.catalog_templates WHERE id=$1`, [Number(params.id)]);
    const tpl = rows[0];
    if (!tpl) return fail('not_found', 404);
    const opts = {
      product_ids: tpl.product_ids?.length ? tpl.product_ids : undefined,
      template_name: tpl.name,
      ...(tpl.options || {}),
    };
    const pdf = await generateCatalogPDF(opts);
    const safe = String(tpl.name).replace(/[^a-z0-9-_]+/gi, '_').slice(0, 60) || 'catalogo';
    return new NextResponse(new Uint8Array(pdf), {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${safe}.pdf"` },
    });
  } catch (e) { return handleError(e); }
}
