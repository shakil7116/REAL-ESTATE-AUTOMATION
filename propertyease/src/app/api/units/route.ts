import { NextRequest } from 'next/server';
import { getUnits, createUnit, updateUnit, deleteUnit } from '@/lib/database';
import { protectedHandler, okResponse, errResponse } from '@/lib/withAuth';
import { validate, createUnitSchema, updateUnitSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

// GET /api/units - List all units, optionally filtered by property_id
export const GET = protectedHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get('property_id');
  const units = await getUnits(propertyId || undefined);
  return okResponse(units);
});

// POST /api/units
export const POST = protectedHandler(async (request) => {
  const body = await request.json();
  const v = validate(createUnitSchema, body);
  if (!v.ok) return errResponse(v.error.message, 400);
  const unit = await createUnit(v.data);
  return okResponse(unit, 201);
});

// PUT /api/units?id=<id>
export const PUT = protectedHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return errResponse('Unit ID is required', 400);
  const body = await request.json();
  const v = validate(updateUnitSchema, body);
  if (!v.ok) return errResponse(v.error.message, 400);
  const unit = await updateUnit(id, v.data);
  return okResponse(unit);
});

// DELETE /api/units?id=<id>
export const DELETE = protectedHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return errResponse('Unit ID is required', 400);
  await deleteUnit(id);
  return okResponse(null);
});
