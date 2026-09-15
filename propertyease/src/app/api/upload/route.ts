/**
 * File upload endpoint — POST /api/upload
 * Validates file type (JPG/PNG/WEBP/GIF, max 5MB), writes to public/uploads/,
 * returns the public URL. Uses the contract envelope { ok, data, error }.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { protectedHandler, okResponse, errResponse } from '@/lib/withAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function extFor(mime: string): string {
  switch (mime) {
    case 'image/jpeg': return 'jpg';
    case 'image/png':  return 'png';
    case 'image/webp': return 'webp';
    case 'image/gif':  return 'gif';
    default:           return 'bin';
  }
}

export const POST = protectedHandler(async (request) => {
  const form = await request.formData();
  const file = form.get('file');
  if (!file || !(file instanceof File)) {
    return errResponse('No file provided. Use the "file" field.', 400);
  }
  if (!ALLOWED.has(file.type)) {
    return errResponse(`Unsupported file type: ${file.type || 'unknown'}. Use JPG, PNG, WEBP, or GIF.`, 415);
  }
  if (file.size > MAX_BYTES) {
    return errResponse(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 5 MB.`, 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${crypto.randomUUID()}.${extFor(file.type)}`;
  const dir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), buffer);

  return okResponse({ url: `/uploads/${filename}` });
});
