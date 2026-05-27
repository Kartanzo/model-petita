import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireAuth, ok, fail, handleError } from '@/lib/api-helpers';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  try {
    const body = await req.json();
    const cols = ['name', 'body', 'is_default', 'scope'].filter((k) => k in body);
    if (!cols.length) return fail('no_fields', 400);
    const sets = cols.map((c, i) => `${c}=$${i + 1}`).join(',');
    const values = cols.map((c) => body[c]); values.push(params.id);
    const { rows } = await q(`UPDATE petita.templates SET ${sets} WHERE id=$${values.length} RETURNING *`, values);
    return ok(rows[0]);
  } catch (e) { return handleError(e); }
}
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  try { await q(`DELETE FROM petita.templates WHERE id=$1`, [params.id]); return ok({ ok: true }); } catch (e) { return handleError(e); }
}
