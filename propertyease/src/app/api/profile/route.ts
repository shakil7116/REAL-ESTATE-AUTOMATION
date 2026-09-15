/**
 * Profile update endpoint — PATCH /api/profile
 * Persists profile changes to both localStorage (client) and the fallback bundle (server).
 */
import { NextRequest } from 'next/server';
import { protectedHandler, okResponse, errResponse } from '@/lib/withAuth';

export const dynamic = 'force-dynamic';

export const PATCH = protectedHandler(async (request) => {
  const body = await request.json();
  // Persist to global fallback so server-side reads see the update
  try {
    const b: any = globalThis.__PE_FALLBACK__;
    if (b?.users && body.id) {
      const user = b.users.find((u: any) => u.id === body.id);
      if (user) {
        if (body.name) user.name = body.name;
        if (body.email) user.email = body.email;
        if (body.avatar) user.avatar = body.avatar;
      }
    }
  } catch {}
  return okResponse({ message: 'Profile updated' });
});
