import { NextRequest } from 'next/server';
import { getLeases, createLease, updateLease, deleteLease } from '@/lib/database';
import { protectedHandler, okResponse, errResponse } from '@/lib/withAuth';
import { validate, createLeaseSchema, updateLeaseSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

// GET /api/leases
export const GET = protectedHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');
  const unitId = searchParams.get('unit_id');
  const status = searchParams.get('status');

  let leases = await getLeases();
  if (tenantId) leases = leases.filter((l: any) => l.tenant_id === tenantId);
  if (unitId) leases = leases.filter((l: any) => l.unit_id === unitId);
  if (status) leases = leases.filter((l: any) => l.status === status);

  return okResponse(leases);
});

// POST /api/leases
export const POST = protectedHandler(async (request) => {
  const body = await request.json();
  const v = validate(createLeaseSchema, body);
  if (!v.ok) return errResponse(v.error.message, 400);
  const lease = await createLease(v.data);
  return okResponse(lease, 201);
});

// PUT /api/leases?id=<id>
export const PUT = protectedHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return errResponse('Lease ID required', 400);
  const body = await request.json();
  const v = validate(updateLeaseSchema, body);
  if (!v.ok) return errResponse(v.error.message, 400);
  const lease = await updateLease(id, v.data);
  return okResponse(lease);
});

// DELETE /api/leases?id=<id>
export const DELETE = protectedHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return errResponse('Lease ID required', 400);
  await deleteLease(id);
  return okResponse(null);
});
