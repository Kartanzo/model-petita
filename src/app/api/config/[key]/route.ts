import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireAuth, requireRoles, ok, handleError } from '@/lib/api-helpers';

export async function GET(req: NextRequest, { params }: { params: { key: string } }) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  try {
    const { rows } = await q(`SELECT value FROM petita.config WHERE key=$1`, [params.key]);
    return ok(rows[0]?.value ?? null);
  } catch (e) { return handleError(e); }
}

export async function PUT(req: NextRequest, { params }: { params: { key: string } }) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  const r = requireRoles(u, ['admin', 'superuser']); if (r) return r;
  try {
    const { value } = await req.json();
    const { rows } = await q(
      `INSERT INTO petita.config (key,value,updated_by) VALUES ($1,$2,$3)
       ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_by=EXCLUDED.updated_by, updated_at=now() RETURNING *`,
      [params.key, value, u.id],
    );
    return ok(rows[0]);
  } catch (e) { return handleError(e); }
}
