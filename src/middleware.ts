import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Allow login + api + static
  if (pathname === '/login' || pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.startsWith('/icons/') || pathname.startsWith('/produtos/') || pathname === '/logo-petita.png' || pathname === '/manifest.json' || pathname === '/service-worker.js' || pathname === '/favicon.ico') {
    return NextResponse.next();
  }
  const token = req.cookies.get('petita_token')?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
