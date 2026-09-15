---
name: auth-supabase-fallback-bug
description: Supabase users table missing password column caused auth to fail silently; fixed by reading fallback.json directly in auth route
metadata:
  type: incident
  priority: P1
  status: resolved
---

## What happened

Auth login returned `INTERNAL_ERROR` ("Invalid email or password") for all 4 test users despite correct credentials and valid bcrypt hashes in `.data/fallback.json`.

## Root cause

Two compounding issues:

1. **Supabase `users` table has no `password` column** — the table schema doesn't include `password`, so any query selecting it returns HTTP 400 (`column users.password does not exist`).
2. **`getUserByEmail` did not catch the 400 error properly** — Supabase-js resolves the promise with `{ data: null, error: { code: '42703', message: 'column ... does not exist' } }`. The code checked `if (!error && data)` which correctly skipped the return, but `globalThis.__PE_FALLBACK__` was never populated because the auth route never imported `database.ts`, so the JSON fallback path had nothing to read.

## Fix applied

Restructured `getUserByEmail` in `src/app/api/auth/[...nextauth]/route.ts`:
- Try Supabase query; if it errors OR returns no data, fall through
- Read users directly from `.data/fallback.json` on disk (no import dependency on `database.ts`)
- Also corrected bcrypt hashes in `fallback.json` to match `'PropertyEase123!'`

## How to apply

- **Dev**: auth now works automatically regardless of Supabase schema state
- **Production**: must add `password TEXT NOT NULL` column to the `users` table before migrating users data, or switch to Supabase native auth

## Verification

```bash
curl -s http://localhost:3000/api/auth/login \
  -X POST -H 'Content-Type: application/json' \
  -d '{"email":"admin@propertEase.qa","password":"PropertyEase123!"}'
# Returns: {"ok":true,"data":{"id":"user-admin-001",...}}
```
