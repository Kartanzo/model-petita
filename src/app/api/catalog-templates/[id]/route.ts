import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { q } from '@/lib/db';
import { requireAuth, parseBody, ok, fail, handleError } from '@/lib/api-helpers';

export const runtime = 'nodejs';

const PatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().nullable().optional(),
  product_ids: z.array(z.number().int().positive()).optional(),
  options: z.record(z.any()).optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  try {
    const { rows } = await q(`SELECT * FROM petita.catalog_templates WHERE id=$1`, [Number(params.id)]);
    if (!rows[0]) return fail('not_found', 404);
    return ok(rows[0]);
  } catch (e) { return handleError(e); }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  const body = await parseBody(req, PatchSchema); if (body instanceof NextResponse) return body;
  try {
    const sets: string[] = []; const vals: any[] = [];
    if (body.name !== undefined) { vals.push(body.name); sets.push(`name=$${vals.length}`); }
    if (body.description !== undefined) { vals.push(body.description); sets.push(`description=$${vals.length}`); }
    if (body.product_ids !== undefined) { vals.push(body.product_ids); sets.push(`product_ids=$${vals.length}::int[]`); }
    if (body.options !== undefined) { vals.push(JSON.stringify(body.options)); sets.push(`options=$${vals.length}::jsonb`); }
    if (!sets.length) return fail('no_fields', 400);
    sets.push(`updated_at=now()`);
    vals.push(Number(params.id));
    const { rows } = await q(`UPDATE petita.catalog_templates SET ${sets.join(',')} WHERE id=$${vals.length} RETURNING *`, vals);
    if (!rows[0]) return fail('not_found', 404);
    return ok(rows[0]);
  } catch (e) { return handleError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  try {
    const { rowCount } = await q(`DELETE FROM petita.catalog_templates WHERE id=$1`, [Number(params.id)]);
    if (!rowCount) return fail('not_found', 404);
    return ok({ ok: true });
  } catch (e) { return handleError(e); }
}
