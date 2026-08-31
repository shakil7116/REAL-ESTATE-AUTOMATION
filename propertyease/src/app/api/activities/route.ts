import { NextRequest } from 'next/server';
import { getActivityLog, logActivity } from '@/lib/database';
import { protectedHandler, okResponse, errResponse } from '@/lib/withAuth';
import { validate, createActivitySchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

// GET /api/activities — view activity log, optionally filtered by entity
export const GET = protectedHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const entity = searchParams.get('entity');
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const activities = await getActivityLog(entity || undefined, Math.min(limit, 200));
  return okResponse(activities);
});

// POST /api/activities — log an activity event
export const POST = protectedHandler(async (request) => {
  const body = await request.json();
  const v = validate(createActivitySchema, body);
  if (!v.ok) return errResponse(v.error.message, 400);
  const activity = await logActivity(v.data);
  return okResponse(activity, 201);
});
