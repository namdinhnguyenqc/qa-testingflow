import { NextRequest, NextResponse } from 'next/server';

const protectedPrefixes = ['/dashboard', '/projects', '/configs', '/audit-logs'];

const BYPASS_AUTH =
  process.env.NODE_ENV === 'development' &&
  process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';

export function middleware(request: NextRequest) {
  if (BYPASS_AUTH) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const token = request.cookies.get('auth-token')?.value;

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
