import { NextRequest } from 'next/server';
import { getOwnerPayouts, createOwnerPayout, updateOwnerPayout, deleteOwnerPayout } from '@/lib/database';
import { protectedHandler, okResponse, errResponse } from '@/lib/withAuth';
import { validate, createOwnerPayoutSchema, updateOwnerPayoutSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

// GET /api/payouts — list owner payouts, optionally filtered by property_id
export const GET = protectedHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get('property_id');
  const payouts = await getOwnerPayouts(propertyId || undefined);
  return okResponse(payouts);
});

// POST /api/payouts — create a new payout record
export const POST = protectedHandler(async (request) => {
  const body = await request.json();
  const v = validate(createOwnerPayoutSchema, body);
  if (!v.ok) return errResponse(v.error.message, 400);
  const payout = await createOwnerPayout(v.data);
  return okResponse(payout, 201);
});

// PUT /api/payouts?id=<id>
export const PUT = protectedHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return errResponse('Payout ID required', 400);
  const body = await request.json();
  const v = validate(updateOwnerPayoutSchema, body);
  if (!v.ok) return errResponse(v.error.message, 400);
  const payout = await updateOwnerPayout(id, v.data);
  return okResponse(payout);
});

// DELETE /api/payouts?id=<id>
export const DELETE = protectedHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return errResponse('Payout ID required', 400);
  await deleteOwnerPayout(id);
  return okResponse(null);
});
