# Incident 2026-09-08: Supabase Env Vars Mask Stale Data — Debugged via /api/debug/dump

## Summary
After cleaning `.data/fallback.json` on disk to contain only the 4-property Qatar seed bundle, the live dev server continued serving stale test data from Supabase. Direct inspection of the disk file showed clean data, but API responses still contained test properties ("My Test Property", "AL THUMAMA 103 UPDATED"). The root cause was not a path-resolution bug as previously diagnosed — it was that `NEXT_PUBLIC_SUPABASE_URL` was set in `.env.local`, causing all API routes to bypass fallback.json entirely and query Supabase directly.

## Severity
S1 (high — silently serves wrong data to users without any error or warning)

## Date Discovered
2026-09-08

## Root Cause
`database.ts` uses `hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'))`. When true, `getProperties()` skips fallback.json and queries Supabase directly. Since `NEXT_PUBLIC_SUPABASE_URL` was present in `.env.local`, every API route used the live database — which still held stale test rows from previous manual edits.

This is more dangerous than the previous incident because:
1. There is **no visible indicator** that Supabase is active vs fallback
2. Disk state and API state are **decoupled** — editing `.data/fallback.json` appears to do nothing
3. The `database.ts` dispatch logic exists but is never surfaced in diagnostics

The previous incident (2026-09-07) was incorrectly attributed to in-memory caching across workers. In reality, the stale data was being served from Supabase the entire time.

## Resolution
Created diagnostic endpoint `GET /api/debug/dump` that reveals:
- Current CWD, `__dirname`, env var status (`SUPABASE_URL` set/unset)
- All candidate fallback.json paths with existence and size
- In-memory property count vs disk property count

Ran `DELETE /api/properties?id=<id>` for each stale Supabase row. Verified clean state: 4 Qatar properties + 8 tenants.

## Decision Point (Unresolved)
The project currently has Supabase env vars set but has **never been tested against the live database**. Two options exist going forward:

**Option A — Keep Supabase:** Maintain data in PostgreSQL via Prisma migrations. Requires:
- Regular `prisma db push` when schema changes
- Careful data hygiene on Supabase side
- Accepts that `fallback.json` is dev-only and ignored when Supabase is present

**Option B — Remove Supabase for local dev:** Delete `NEXT_PUBLIC_SUPABASE_URL` and `NEXTAUTH_DEMO=true` from `.env.local`. The server will use pure fallback mode. Requires:
- Seeding Supabase separately if/when going live
- Every developer gets identical data from disk automatically

No decision has been made. This should be documented as a decision record before the next sprint.

## Prevention
- Add a startup banner/log line in `database.ts` that explicitly states which backend is active (`[PropertyEase] Using SUPABASE` or `[PropertyEase] Using FALLBACK`)
- Add the same banner to `/api/debug/dump` output
- Consider a CI check that validates `hasSupabaseEnv` matches expected mode

## Related
- `memory/incidents/2026-09-07-stale-fallback-state.md` — superseded by this incident (previous root cause diagnosis was wrong)
- `propertyease/src/lib/database.ts` — `useSupabase` branch
- `propertyease/src/app/api/debug/dump/route.ts` — created during this investigation
