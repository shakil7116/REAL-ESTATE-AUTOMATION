/**
 * POST /api/auth/login — Mobile-friendly credential login.
 *
 * Accepts { email, password } and returns:
 *   { ok: true,  data: { id, email, name, token } }
 *   { ok: false, error: { message, code } }
 *
 * Uses the same bcrypt verification as NextAuth but returns an API envelope
 * suitable for mobile clients that cannot read http-only cookies.
 */
import { NextRequest } from 'next/server';
import { getSession, okResponse, errResponse } from '@/lib/withAuth';
import { getUserByEmail } from '@/app/api/auth/[...nextauth]/route';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// POST /api/auth/login
export const POST = async (request: NextRequest): Promise<Response> => {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return errResponse('Email and password are required');
    }

    // Look up user
    const user = await getUserByEmail(email);
    if (!user) {
      return errResponse('Invalid email or password', 401);
    }

    if (!user.isActive) {
      return errResponse('Account is inactive', 403);
    }

    // Check demo mode
    if (process.env.NEXTAUTH_DEMO === 'true' && password === 'demo') {
      return okResponse({
        id: user.id,
        email: user.email,
        name: user.name,
        token: user.id, // simple token for demo mode
      });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return errResponse('Invalid email or password', 401);
    }

    // Return session payload (mobile stores this as the "token")
    return okResponse({
      id: user.id,
      email: user.email,
      name: user.name,
      token: user.id,
    });
  } catch (error) {
    return errResponse(error instanceof Error ? error.message : 'Login failed');
  }
};
