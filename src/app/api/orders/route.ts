import { NextRequest, NextResponse } from 'next/server';
import { q, withTx } from '@/lib/db';
import { requireAuth, parseBody, ok, handleError } from '@/lib/api-helpers';
import { OrderSchema } from '@/lib/validators';
import { compute, type PricingItem } from '@/lib/pricing';
import { nextNumber } from '@/lib/numbering';

export async function GET(req: NextRequest) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  try {
    const sp = req.nextUrl.searchParams;
    const where: string[] = []; const params: any[] = [];
    const status = sp.get('status');
    if (status) { params.push(status); where.push(`o.status=$${params.length}`); }
    const { rows } = await q(
      `SELECT o.*, c.name AS customer_name FROM petita.orders o JOIN petita.customers c ON c.id=o.customer_id
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY o.created_at DESC LIMIT 200`,
      params,
    );
    return ok(rows);
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  const body = await parseBody(req, OrderSchema); if (body instanceof NextResponse) return body;
  try {
    const order = await withTx(async (client) => {
      const ids = body.items.map((i) => i.product_id);
      const { rows: prods } = await client.query(`SELECT id, family_id, cost::float8 AS cost FROM petita.products WHERE id = ANY($1::int[])`, [ids]);
      const m = new Map(prods.map((p: any) => [p.id, p]));
      const pricingItems: PricingItem[] = body.items.map((it) => {
        const p = m.get(it.product_id);
        return { ...it, unit_cost: p?.cost ?? 0, family_id: p?.family_id ?? null };
      });
      const r = await compute(pricingItems, 'order');
      const number = await nextNumber('order', client);
      const { rows: orow } = await client.query(
        `INSERT INTO petita.orders (number,customer_id,user_id,template_id,status,subtotal,discount_amount,tax_amount,total,payment_terms,delivery_date,notes)
         VALUES ($1,$2,$3,$4,COALESCE($5,'aberto'),$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [number, body.customer_id, u.id, body.template_id || null, body.status, r.subtotal, r.discount_amount, r.tax_amount, r.total, body.payment_terms || null, (body as any).delivery_date || null, body.notes || null],
      );
      const order = orow[0];
      let pos = 0;
      for (const li of r.items) {
        pos++;
        await client.query(
          `INSERT INTO petita.order_items (order_id,product_id,qty,list_price,unit_price,discount_pct,unit_cost,tax_amount,line_total,line_profit,position)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [order.id, li.product_id, li.qty, li.list_price, li.unit_price, li.discount_pct, li.unit_cost, li.tax_amount, li.line_total, li.line_profit, pos],
        );
      }
      return order;
    });
    return ok(order, { status: 201 });
  } catch (e) { return handleError(e); }
}
