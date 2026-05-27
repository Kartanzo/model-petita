import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { q } from '@/lib/db';
import { requireAuth, requireRoles, ok, fail, handleError } from '@/lib/api-helpers';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  const r = requireRoles(u, ['superuser']); if (r) return r;
  try {
    const body = await req.json();
    const cols: string[] = []; const values: any[] = [];
    for (const k of ['name', 'email', 'phone', 'role', 'active']) {
      if (k in body) { cols.push(k); values.push(body[k]); }
    }
    if (body.password) { cols.push('password'); values.push(await bcrypt.hash(body.password, 10)); }
    if (!cols.length) return fail('no_fields', 400);
    const sets = cols.map((c, i) => `${c}=$${i + 1}`).join(',');
    values.push(params.id);
    const { rows } = await q(`UPDATE petita.users SET ${sets} WHERE id=$${values.length} RETURNING id,name,email,role,active`, values);
    return ok(rows[0]);
  } catch (e) { return handleError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  const r = requireRoles(u, ['superuser']); if (r) return r;
  try { await q(`UPDATE petita.users SET active=FALSE WHERE id=$1`, [params.id]); return ok({ ok: true }); } catch (e) { return handleError(e); }
}
