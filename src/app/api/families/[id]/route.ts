import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireAuth, requireRoles, ok, fail, handleError } from '@/lib/api-helpers';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { rows } = await q(`SELECT * FROM petita.product_families WHERE id=$1`, [params.id]);
    if (!rows[0]) return fail('not_found', 404);
    return ok(rows[0]);
  } catch (e) { return handleError(e); }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  const r = requireRoles(u, ['admin', 'superuser']); if (r) return r;
  try {
    const body = await req.json();
    const fields = ['name', 'description', 'display_order', 'active'].filter((k) => k in body);
    if (!fields.length) return fail('no_fields', 400);
    const sets = fields.map((f, i) => `${f}=$${i + 1}`).join(',');
    const values = fields.map((f) => body[f]);
    values.push(params.id);
    const { rows } = await q(`UPDATE petita.product_families SET ${sets} WHERE id=$${values.length} RETURNING *`, values);
    return ok(rows[0]);
  } catch (e) { return handleError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  const r = requireRoles(u, ['admin', 'superuser']); if (r) return r;
  try {
    await q(`UPDATE petita.product_families SET active=FALSE WHERE id=$1`, [params.id]);
    return ok({ ok: true });
  } catch (e) { return handleError(e); }
}
