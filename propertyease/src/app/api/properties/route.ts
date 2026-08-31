import { NextRequest } from 'next/server';
import { getProperties, createProperty, updateProperty, deleteProperty } from '@/lib/database';
import { protectedHandler, okResponse, errResponse } from '@/lib/withAuth';
import { validate, createPropertySchema, updatePropertySchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

// GET /api/properties
export const GET = protectedHandler(async () => {
  const properties = await getProperties();
  return okResponse(properties);
});

// POST /api/properties
export const POST = protectedHandler(async (request) => {
  const body = await request.json();
  const v = validate(createPropertySchema, body);
  if (!v.ok) return errResponse(v.error.message, 400);
  const property = await createProperty(v.data);
  return okResponse(property, 201);
});

// PUT /api/properties?id=<id>
export const PUT = protectedHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return errResponse('Property ID is required', 400);
  const body = await request.json();
  const v = validate(updatePropertySchema, body);
  if (!v.ok) return errResponse(v.error.message, 400);
  const property = await updateProperty(id, v.data);
  return okResponse(property);
});

// DELETE /api/properties?id=<id>
export const DELETE = protectedHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return errResponse('Property ID is required', 400);
  await deleteProperty(id);
  return okResponse(null);
});
