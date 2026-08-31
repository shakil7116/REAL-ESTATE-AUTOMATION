import { NextRequest } from 'next/server';
import { getLeads, createLead, updateLead, deleteLead } from '@/lib/database';
import { protectedHandler, okResponse, errResponse } from '@/lib/withAuth';
import { validate, createLeadSchema, updateLeadSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

// GET /api/leads
export const GET = protectedHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const source = searchParams.get('source');

  let leads = await getLeads();
  if (status) leads = leads.filter((l: any) => l.status === status);
  if (source) leads = leads.filter((l: any) => l.source === source);

  return okResponse(leads);
});

// POST /api/leads
export const POST = protectedHandler(async (request) => {
  const body = await request.json();
  const v = validate(createLeadSchema, body);
  if (!v.ok) return errResponse(v.error.message, 400);
  const lead = await createLead(v.data);
  return okResponse(lead, 201);
});

// PUT /api/leads?id=<id>
export const PUT = protectedHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return errResponse('Lead ID required', 400);
  const body = await request.json();
  const v = validate(updateLeadSchema, body);
  if (!v.ok) return errResponse(v.error.message, 400);
  const lead = await updateLead(id, v.data);
  return okResponse(lead);
});

// DELETE /api/leads?id=<id>
export const DELETE = protectedHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return errResponse('Lead ID required', 400);
  await deleteLead(id);
  return okResponse(null);
});
