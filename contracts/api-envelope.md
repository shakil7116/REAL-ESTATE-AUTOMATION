# Contract: API Response Envelope
# ───────────────────────────────
# Version: 1.0.0
# Status: Accepted
# Last updated: 2026-08-26
# Owner: @backend-eng
# Reviewers: @frontend-eng, @ai-eng

## Purpose

Every JSON response from `propertyease/src/app/api/**/route.ts` MUST
conform to this envelope. This is a hard contract — both producers
(API routes) and consumers (client code, the AI layer) depend on it.

## The shape

```typescript
type ApiResponse<T> =
  | { ok: true;  data: T;    error: null; }
  | { ok: false; data: null;  error: ApiError; };

type ApiError = {
  code: string;         // machine-readable, UPPER_SNAKE_CASE
  message: string;      // human-readable, English
  messageAr?: string;   // human-readable, Arabic (optional but recommended)
  details?: unknown;    // extra context (zod issues, field errors, etc.)
  status: number;       // HTTP status code (mirrors the response status)
};
```

## Error codes (canonical list)

| Code | HTTP | When |
|---|---|---|
| `UNAUTHENTICATED` | 401 | No session / expired token |
| `FORBIDDEN` | 403 | Authenticated but not allowed |
| `NOT_FOUND` | 404 | Resource doesn't exist or user can't see it |
| `VALIDATION_FAILED` | 422 | zod (or other) schema validation failed |
| `CONFLICT` | 409 | Duplicate, race condition, constraint violation |
| `RATE_LIMITED` | 429 | Too many requests |
| `PAYMENT_REQUIRED` | 402 | Quota exceeded, feature gated |
| `UPSTREAM_ERROR` | 502 | External service (Supabase, OpenAI) failed |
| `INTERNAL_ERROR` | 500 | Unhandled server error |
| `MAINTENANCE` | 503 | Planned downtime |

## Examples

### Success (200)

```json
{
  "ok": true,
  "data": {
    "id": "prop_123",
    "name": "Al Mansouri Tower",
    "address": "West Bay, Doha"
  },
  "error": null
}
```

### Validation failure (422)

```json
{
  "ok": false,
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Name is required and must be at least 1 character.",
    "messageAr": "الاسم مطلوب ويجب ألا يقل عن حرف واحد.",
    "details": {
      "issues": [
        { "path": ["name"], "message": "Required" }
      ]
    },
    "status": 422
  }
}
```

### Unauthenticated (401)

```json
{
  "ok": false,
  "data": null,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "You must be signed in to perform this action.",
    "messageAr": "يجب تسجيل الدخول لتنفيذ هذا الإجراء.",
    "status": 401
  }
}
```

## Producer side (API route)

```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';

const Body = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, data: null, error: { code: 'UNAUTHENTICATED', message: '...', status: 401 } },
      { status: 401 }
    );
  }

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        data: null,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid input.',
          details: { issues: parsed.error.issues },
          status: 422,
        },
      },
      { status: 422 }
    );
  }

  const property = await prisma.property.create({ data: { ...parsed.data, ownerId: session.userId } });
  return NextResponse.json({ ok: true, data: property, error: null }, { status: 201 });
}
```

## Consumer side (client)

```typescript
type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

async function postJson<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// Usage
const result = await postJson<Property>('/api/properties', { name: '...', address: '...' });
if (!result.ok) {
  toast.error(result.error.message);
  return;
}
const property = result.data; // typed as Property, not Property | null
```

## Helper: enforce this in a server action

```typescript
// propertyease/src/lib/api.ts
import { NextResponse } from 'next/server';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data, error: null }, { status });
}

export function fail(code: string, message: string, status: number, extra: Partial<ApiError> = {}) {
  return NextResponse.json(
    { ok: false, data: null, error: { code, message, status, ...extra } },
    { status }
  );
}
```

## Migration note

Existing API routes that return raw data (not wrapped in `{ ok, data, error }`)
must be migrated. This is tracked in `memory/decisions/003-api-envelope.md`
(to be written when migration starts).

## Tests required

For every API route:
- ✅ Success case returns `{ ok: true, data, error: null }`
- ✅ Each error case returns the correct `code` and `status`
- ✅ Validation failure includes `details.issues` from zod
- ✅ Authentication check is the first thing in every route

## Changelog

- **1.0.0** (2026-08-26) — Initial contract
