import { NextRequest, NextResponse } from 'next/server';
import { ZodError, ZodSchema } from 'zod';
import { getSessionFromRequest, type SessionUser, type Role } from './auth';

export function ok(data: any, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400, extra: Record<string, any> = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function requireAuth(req: NextRequest): SessionUser | NextResponse {
  const u = getSessionFromRequest(req);
  if (!u) return fail('unauthorized', 401);
  return u;
}

export function requireRoles(u: SessionUser, roles: Role[]): NextResponse | null {
  if (!roles.includes(u.role)) return fail('forbidden', 403);
  return null;
}

export async function parseBody<T>(req: NextRequest, schema: ZodSchema<T>): Promise<T | NextResponse> {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch (e) {
    if (e instanceof ZodError) return fail('validation_error', 400, { issues: e.issues });
    return fail('invalid_json', 400);
  }
}

export function handleError(e: unknown): NextResponse {
  console.error(e);
  const msg = e instanceof Error ? e.message : 'internal_error';
  return fail(msg, 500);
}
