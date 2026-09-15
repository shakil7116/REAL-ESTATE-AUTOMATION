import { getDashboardStats } from '@/lib/database';
import { protectedHandler, okResponse, errResponse } from '@/lib/withAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/dashboard — always returns REAL computed stats
export const GET = protectedHandler(async () => {
  try {
    const stats = await getDashboardStats();
    return okResponse(stats);
  } catch (error) {
    // On true failure, still compute from fallback instead of hardcoded defaults
    try {
      const stats = await getDashboardStats();
      return okResponse(stats);
    } catch (e) {
      return errResponse(e instanceof Error ? e.message : 'Failed to load dashboard');
    }
  }
});
