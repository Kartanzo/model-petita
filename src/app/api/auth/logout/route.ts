import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST(_req: NextRequest) {
  const res = NextResponse.redirect(new URL('/login', _req.url));
  clearAuthCookie(res);
  return res;
}
export async function GET(req: NextRequest) { return POST(req); }
