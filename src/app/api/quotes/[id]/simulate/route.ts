import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { q } from '@/lib/db';
import { requireAuth, parseBody, ok, handleError } from '@/lib/api-helpers';
import { compute, type PricingItem } from '@/lib/pricing';

const SimSchema = z.object({
  items: z.array(z.object({
    product_id: z.number().int().positive(),
    qty: z.number().positive(),
    list_price: z.number().nonnegative(),
    unit_price: z.number().nonnegative(),
  })).min(1),
  state: z.string().length(2).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  const body = await parseBody(req, SimSchema); if (body instanceof NextResponse) return body;
  try {
    const ids = body.items.map((i) => i.product_id);
    const { rows } = await q<any>(`SELECT id, family_id, cost::float8 AS cost FROM petita.products WHERE id = ANY($1::int[])`, [ids]);
    const m = new Map(rows.map((r) => [r.id, r]));
    const pricingItems: PricingItem[] = body.items.map((it) => {
      const p = m.get(it.product_id);
      return { ...it, unit_cost: p?.cost ?? 0, family_id: p?.family_id ?? null };
    });
    const r = await compute(pricingItems, 'quote', body.state || null);
    return ok(r);
  } catch (e) { return handleError(e); }
}
