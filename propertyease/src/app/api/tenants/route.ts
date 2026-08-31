import { NextRequest } from 'next/server';
import { getTenants, createTenant, updateTenant, deleteTenant } from '@/lib/database';
import { protectedHandler, okResponse, errResponse } from '@/lib/withAuth';
import { validate, createTenantSchema, updateTenantSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

// GET /api/tenants
export const GET = protectedHandler(async () => {
  const tenants = await getTenants();
  return okResponse(tenants);
});

// POST /api/tenants
export const POST = protectedHandler(async (request) => {
  const body = await request.json();
  const v = validate(createTenantSchema, body);
  if (!v.ok) return errResponse(v.error.message, 400);
  const tenant = await createTenant(v.data);
  return okResponse(tenant, 201);
});

// PUT /api/tenants?id=<id>
export const PUT = protectedHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return errResponse('Tenant ID is required', 400);
  const body = await request.json();
  const v = validate(updateTenantSchema, body);
  if (!v.ok) return errResponse(v.error.message, 400);
  const tenant = await updateTenant(id, v.data);
  return okResponse(tenant);
});

// DELETE /api/tenants?id=<id>
export const DELETE = protectedHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return errResponse('Tenant ID is required', 400);
  await deleteTenant(id);
  return okResponse(null);
});
