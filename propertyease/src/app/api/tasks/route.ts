import { NextRequest } from 'next/server';
import {
  getMaintenanceTasks,
  createMaintenanceTask,
  updateMaintenanceTask,
  deleteMaintenanceTask,
} from '@/lib/database';
import { protectedHandler, okResponse, errResponse } from '@/lib/withAuth';
import { validate, createMaintenanceTaskSchema, updateMaintenanceTaskSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

// GET /api/tasks — list maintenance tasks
export const GET = protectedHandler(async () => {
  const tasks = await getMaintenanceTasks();
  return okResponse(tasks);
});

// POST /api/tasks — create a maintenance task
export const POST = protectedHandler(async (request) => {
  const body = await request.json();
  const v = validate(createMaintenanceTaskSchema, body);
  if (!v.ok) return errResponse(v.error.message, 400);
  const task = await createMaintenanceTask(v.data);
  return okResponse(task, 201);
});

// PUT /api/tasks?id=<id>
export const PUT = protectedHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return errResponse('Task ID required', 400);
  const body = await request.json();
  const v = validate(updateMaintenanceTaskSchema, body);
  if (!v.ok) return errResponse(v.error.message, 400);
  const task = await updateMaintenanceTask(id, v.data);
  return okResponse(task);
});

// DELETE /api/tasks?id=<id>
export const DELETE = protectedHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return errResponse('Task ID required', 400);
  await deleteMaintenanceTask(id);
  return okResponse(null);
});
