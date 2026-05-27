import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { q } from '@/lib/db';
import { requireAuth, requireRoles, parseBody, ok, handleError } from '@/lib/api-helpers';
import { UserSchema } from '@/lib/validators';

export async function GET(req: NextRequest) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  const r = requireRoles(u, ['admin', 'superuser']); if (r) return r;
  try {
    const { rows } = await q(`SELECT id,name,email,phone,role,active,last_login,created_at FROM petita.users ORDER BY name`);
    return ok(rows);
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  const r = requireRoles(u, ['superuser']); if (r) return r;
  const body = await parseBody(req, UserSchema); if (body instanceof NextResponse) return body;
  if (!body.password) return NextResponse.json({ error: 'password_required' }, { status: 400 });
  try {
    const hash = await bcrypt.hash(body.password, 10);
    const { rows } = await q(
      `INSERT INTO petita.users (name,email,password,phone,role,active) VALUES ($1,$2,$3,$4,$5,COALESCE($6,TRUE)) RETURNING id,name,email,role,active`,
      [body.name, body.email, hash, body.phone || null, body.role, body.active],
    );
    return ok(rows[0], { status: 201 });
  } catch (e) { return handleError(e); }
}
