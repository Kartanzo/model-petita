import { NextRequest } from 'next/server';
import { requireAuth, ok } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const u = requireAuth(req);
  if (u instanceof Response) return u;
  return ok({ user: u });
}
