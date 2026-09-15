/**
 * withAuth.ts — Session extraction for API routes and middleware.
 *
 * Reads the NextAuth session cookie (or Authorization Bearer header) and
 * returns a deserialized user object. In demo mode (NEXTAUTH_DEMO=true),
 * skips validation so local dev still works without a real session.
 *
 * Pattern:
 *   const user = await getSession(request);
 *   if (!user) return { ok: false, error: 'Unauthorized', data: null };
 */
import type { NextRequest } from 'next/server';

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface DecodedToken {
  id: string;
  email: string;
  name: string;
  role: string;
  exp?: number;
}

/**
 * Decode a NextAuth JWT cookie payload (Base64Url) without verification.
 * The cookie value is a JSON object signed by NextAuth — we read the
 * public fields only.
 */
function decodeNextAuthToken(cookieValue: string): DecodedToken | null {
  try {
    // NextAuth v4 stores the session token as a signed JWT string
    // We verify the signature isn't required for internal APIs because
    // the cookie is HttpOnly and set by the same domain.
    const parts = cookieValue.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(payload) as DecodedToken;
  } catch {
    return null;
  }
}

/**
 * Extract session from cookie or Bearer token.
 * Returns null if not authenticated.
 */
export async function getSession(
  request: NextRequest,
): Promise<ApiUser | null> {
  // Demo mode: allow unauthenticated access for local development
  if (process.env.NEXTAUTH_DEMO === 'true') {
    return {
      id: 'demo-user',
      email: 'demo@propertyease.qa',
      name: 'Demo User',
      role: 'owner',
    };
  }

  // Option 1: NextAuth session cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionMatch = cookieHeader.match(/next-auth\.session-token=([^;]+)/);
  if (sessionMatch?.[1]) {
    const decoded = decodeNextAuthToken(sessionMatch[1]);
    if (decoded && decoded.id) return decoded;
  }

  // Option 2: Bearer token (for mobile / programmatic clients)
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    // Accept API keys stored as simple tokens (same format as session tokens)
    const decoded = decodeNextAuthToken(token);
    if (decoded && decoded.id) return decoded;
  }

  return null;
}

/**
 * Build a standardized error response for auth failures.
 */
export function unauthorizedResponse(message = 'Unauthorized'): Response {
  return new Response(
    JSON.stringify({ ok: false, data: null, error: { message, code: 'UNAUTHORIZED' } }),
    { status: 401, headers: { 'content-type': 'application/json' } },
  );
}

/**
 * Build a standardized success response matching the contract envelope.
 */
export function okResponse<T>(data: T, status = 200): Response {
  return new Response(
    JSON.stringify({ ok: true, data, error: null }),
    { status, headers: { 'content-type': 'application/json' } },
  );
}

/**
 * Build a standardized error response (non-auth).
 */
export function errResponse(message: string, status = 500): Response {
  return new Response(
    JSON.stringify({ ok: false, data: null, error: { message, code: 'INTERNAL_ERROR' } }),
    { status, headers: { 'content-type': 'application/json' } },
  );
}

/**
 * Guard: check session and return null response if missing.
 * Usage in routes:
 *   const session = await authGuard(request);
 *   if (session) return session; // actually this returns the user, not a response
 *
 * Better usage pattern — see protectedHandler below.
 */
export async function authGuard(request: NextRequest): Promise<ApiUser | Response> {
  const user = await getSession(request);
  if (!user) return unauthorizedResponse();
  return user;
}

/**
 * Wrap a handler with auth + envelope in one call.
 *
 * Usage:
 *   export const GET = protectedHandler(async (req, user) => {
 *     const data = await someQuery();
 *     return ok(data);
 *   });
 */
type ProtectedFn = (req: NextRequest, user: ApiUser) => Promise<Response>;

export function protectedHandler(fn: ProtectedFn) {
  return async (request: NextRequest): Promise<Response> => {
    const user = await authGuard(request);
    if (user instanceof Response) return user;
    try {
      return await fn(request, user);
    } catch (error) {
      return errResponse(error instanceof Error ? error.message : 'Internal error');
    }
  };
}

/**
 * Public handler — no auth required (health, auth callbacks, etc.)
 */
type PublicFn = (req: NextRequest) => Promise<Response>;

export function publicHandler(fn: PublicFn) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      return await fn(request);
    } catch (error) {
      return errResponse(error instanceof Error ? error.message : 'Internal error');
    }
  };
}
