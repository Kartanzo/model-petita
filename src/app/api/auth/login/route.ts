import { NextRequest, NextResponse } from 'next/server';
import { authenticate, setAuthCookie, signToken } from '@/lib/auth';
import { LoginSchema } from '@/lib/validators';
import { parseBody, ok, fail } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  const body = await parseBody(req, LoginSchema);
  if (body instanceof NextResponse) return body;
  const user = await authenticate(body.email, body.password);
  if (!user) return fail('invalid_credentials', 401);
  const res = ok({ user });
  setAuthCookie(res, signToken(user));
  return res;
}
