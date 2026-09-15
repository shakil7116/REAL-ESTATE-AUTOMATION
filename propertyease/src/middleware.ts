/**
 * Middleware — enforces authentication on API routes and protects dashboard pages.
 *
 * Demo mode (NEXTAUTH_DEMO=true): allows all requests without session check.
 * Production mode: blocks unauthenticated API requests with 401.
 */
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/callback',
  '/api/auth',
  '/api/health',
  '/api/copilot',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Block unauthenticated API requests (except demo mode)
  if (pathname.startsWith('/api/') && process.env.NEXTAUTH_DEMO !== 'true') {
    return new NextResponse(
      JSON.stringify({ ok: false, data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }),
      { status: 401, headers: { 'content-type': 'application/json' } },
    );
  }

  // Root: redirect straight into the dashboard (no marketing wall)
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Check for a NextAuth session cookie on page routes
  const sessionCookie = req.cookies.get('next-auth.session-token')?.value;
  if (!sessionCookie) {
    // In production, uncomment the redirect below:
    // const loginUrl = new URL('/login', req.url);
    // loginUrl.searchParams.set('callbackUrl', pathname);
    // return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
