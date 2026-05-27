import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireAuth, ok, handleError } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  try {
    const { rows } = await q(`SELECT key, value FROM petita.config`);
    const out: Record<string, any> = {};
    rows.forEach((r: any) => { out[r.key] = r.value; });
    return ok(out);
  } catch (e) { return handleError(e); }
}
