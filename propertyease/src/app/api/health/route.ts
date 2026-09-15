/**
 * Health check endpoint — verifies service readiness.
 *
 * GET /api/health
 * Returns service status with uptime, timestamp, and env info.
 * Excluded from Sentry transactions per monitoring contract.
 */
import { NextResponse } from 'next/server';

export async function GET() {
  const status = {
    ok: true,
    data: {
      service: 'PropertyEase',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
      version: '0.1.0',
    },
    error: null,
  };

  return NextResponse.json(status, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
  });
}
