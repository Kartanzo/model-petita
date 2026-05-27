import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireAuth, ok, fail, handleError } from '@/lib/api-helpers';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  try {
    const { rows: hd } = await q(`SELECT o.*, c.name AS customer_name FROM petita.orders o JOIN petita.customers c ON c.id=o.customer_id WHERE o.id=$1`, [params.id]);
    if (!hd[0]) return fail('not_found', 404);
    const { rows: items } = await q(`SELECT oi.*, p.name AS product_name, p.code AS product_code FROM petita.order_items oi JOIN petita.products p ON p.id=oi.product_id WHERE oi.order_id=$1 ORDER BY oi.position`, [params.id]);
    return ok({ ...hd[0], items });
  } catch (e) { return handleError(e); }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  try {
    const body = await req.json();
    const editable = ['status', 'payment_terms', 'delivery_date', 'notes'];
    const cols = editable.filter((k) => k in body);
    if (!cols.length) return fail('no_fields', 400);
    const sets = cols.map((c, i) => `${c}=$${i + 1}`).join(',');
    const values = cols.map((c) => body[c]); values.push(params.id);
    const { rows } = await q(`UPDATE petita.orders SET ${sets} WHERE id=$${values.length} RETURNING *`, values);
    return ok(rows[0]);
  } catch (e) { return handleError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  try {
    await q(`UPDATE petita.orders SET status='cancelado' WHERE id=$1`, [params.id]);
    return ok({ ok: true });
  } catch (e) { return handleError(e); }
}
