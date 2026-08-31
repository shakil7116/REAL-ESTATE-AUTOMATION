import { NextRequest } from 'next/server';
import { getPayments, createPayment, updatePayment, deletePayment } from '@/lib/database';
import { protectedHandler, okResponse, errResponse } from '@/lib/withAuth';
import { validate, createPaymentSchema, updatePaymentSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

// GET /api/payments - List all payments or fetch a single payment by ?id=
export const GET = protectedHandler(async (request) => {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');
  if (!id) {
    const payments = await getPayments();
    return okResponse(payments);
  }
  const payments = await getPayments();
  const payment = payments.find((p: any) => p.id === id);
  if (!payment) return errResponse('Payment not found', 404);
  return okResponse(payment);
});

// POST /api/payments
export const POST = protectedHandler(async (request) => {
  const body = await request.json();
  const v = validate(createPaymentSchema, body);
  if (!v.ok) return errResponse(v.error.message, 400);
  const payment = await createPayment(v.data);
  return okResponse(payment, 201);
});

// PUT /api/payments?id=<id>
export const PUT = protectedHandler(async (request) => {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');
  if (!id) return errResponse('Payment ID is required', 400);
  const body = await request.json();
  const v = validate(updatePaymentSchema, body);
  if (!v.ok) return errResponse(v.error.message, 400);
  const payment = await updatePayment(id, v.data);
  return okResponse(payment);
});

// DELETE /api/payments?id=<id>
export const DELETE = protectedHandler(async (request) => {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');
  if (!id) return errResponse('Payment ID is required', 400);
  await deletePayment(id);
  return okResponse(null);
});
