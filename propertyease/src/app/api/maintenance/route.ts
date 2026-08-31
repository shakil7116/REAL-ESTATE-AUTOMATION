import { NextRequest } from 'next/server';
import {
  getMaintenanceTickets,
  createMaintenanceTicket,
  updateMaintenanceTicket,
  deleteMaintenanceTicket,
} from '@/lib/database';
import { protectedHandler, okResponse, errResponse } from '@/lib/withAuth';
import { validate, createMaintenanceTicketSchema, updateMaintenanceTicketSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

// GET /api/maintenance
export const GET = protectedHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const unitId = searchParams.get('unit_id');
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');

  let tickets = await getMaintenanceTickets();
  if (unitId) tickets = tickets.filter((t: any) => t.unit_id === unitId);
  if (status) tickets = tickets.filter((t: any) => t.status === status);
  if (priority) tickets = tickets.filter((t: any) => t.priority === priority);

  return okResponse(tickets);
});

// POST /api/maintenance
export const POST = protectedHandler(async (request) => {
  const body = await request.json();
  const v = validate(createMaintenanceTicketSchema, body);
  if (!v.ok) return errResponse(v.error.message, 400);
  const ticket = await createMaintenanceTicket(v.data);
  return okResponse(ticket, 201);
});

// PUT /api/maintenance?id=<id>
export const PUT = protectedHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return errResponse('Ticket ID required', 400);
  const body = await request.json();
  const v = validate(updateMaintenanceTicketSchema, body);
  if (!v.ok) return errResponse(v.error.message, 400);
  const ticket = await updateMaintenanceTicket(id, v.data);
  return okResponse(ticket);
});

// DELETE /api/maintenance?id=<id>
export const DELETE = protectedHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return errResponse('Ticket ID required', 400);
  await deleteMaintenanceTicket(id);
  return okResponse(null);
});
