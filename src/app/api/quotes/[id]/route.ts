import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireAuth, parseBody, ok, fail, handleError } from '@/lib/api-helpers';
import { QuoteSchema } from '@/lib/validators';
import { updateQuote } from '@/lib/quote-service';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  try {
    const { rows: hd } = await q(`SELECT q.*, c.name AS customer_name FROM petita.quotes q JOIN petita.customers c ON c.id=q.customer_id WHERE q.id=$1`, [params.id]);
    if (!hd[0]) return fail('not_found', 404);
    const { rows: items } = await q(`SELECT qi.*, p.name AS product_name, p.code AS product_code, p.photo_url FROM petita.quote_items qi JOIN petita.products p ON p.id=qi.product_id WHERE qi.quote_id=$1 ORDER BY qi.position`, [params.id]);
    return ok({ ...hd[0], items });
  } catch (e) { return handleError(e); }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  const body = await parseBody(req, QuoteSchema); if (body instanceof NextResponse) return body;
  try {
    const updated = await updateQuote(parseInt(params.id, 10), body as any);
    return ok(updated);
  } catch (e) { return handleError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  try {
    await q(`DELETE FROM petita.quotes WHERE id=$1`, [params.id]);
    return ok({ ok: true });
  } catch (e) { return handleError(e); }
}
