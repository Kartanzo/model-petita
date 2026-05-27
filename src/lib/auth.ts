import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { q } from './db';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const COOKIE = 'petita_token';

export type Role = 'user' | 'admin' | 'superuser';
export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export function signToken(u: SessionUser): string {
  return jwt.sign(u, SECRET, { expiresIn: '7d' });
}

export function verifyToken(t: string): SessionUser | null {
  try {
    const d = jwt.verify(t, SECRET) as any;
    return { id: d.id, name: d.name, email: d.email, role: d.role };
  } catch {
    return null;
  }
}

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set(COOKIE, '', { httpOnly: true, maxAge: 0, path: '/' });
}

export async function getSessionFromCookies(): Promise<SessionUser | null> {
  const t = cookies().get(COOKIE)?.value;
  if (!t) return null;
  return verifyToken(t);
}

export function getSessionFromRequest(req: NextRequest): SessionUser | null {
  const t = req.cookies.get(COOKIE)?.value;
  if (!t) return null;
  return verifyToken(t);
}

export async function requireSession(req: NextRequest): Promise<SessionUser | NextResponse> {
  const u = getSessionFromRequest(req);
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return u;
}

export function requireRole(u: SessionUser, roles: Role[]): NextResponse | null {
  if (!roles.includes(u.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return null;
}

export async function authenticate(email: string, password: string): Promise<SessionUser | null> {
  const { rows } = await q<{ id: number; name: string; email: string; password: string; role: Role; active: boolean }>(
    'SELECT id,name,email,password,role,active FROM petita.users WHERE email=$1 LIMIT 1',
    [email],
  );
  const u = rows[0];
  if (!u || !u.active) return null;
  const ok = await bcrypt.compare(password, u.password);
  if (!ok) return null;
  await q('UPDATE petita.users SET last_login=now() WHERE id=$1', [u.id]);
  return { id: u.id, name: u.name, email: u.email, role: u.role };
}
