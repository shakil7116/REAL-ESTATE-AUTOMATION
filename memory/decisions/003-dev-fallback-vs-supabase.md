# ADR-003: Dev mode fallback.json vs live Supabase mode
# Date: 2026-09-08

## Status
Proposed — awaiting user confirmation

## Context
During local development, PropertyEase supports two data backends:
1. **Fallback mode** — reads/writes `.data/fallback.json` on disk. Fast, portable,
   no external dependencies. Every developer gets identical seed data automatically.
2. **Supabase mode** — queries a live PostgreSQL database via Supabase. Requires
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
   Data is shared across all developers who connect to the same instance.

In September 2026, a bug was discovered where `NEXT_PUBLIC_SUPABASE_URL` was set
in `.env.local`, causing all API routes to silently bypass `fallback.json` and
serve stale test rows from the live Supabase database. Manual edits to
`.data/fallback.json` appeared to have no effect, wasting hours of debugging.

## Decision
Local development will run in **fallback-only mode** (`NEXT_PUBLIC_SUPABASE_URL`
absent from `.env.local`). Supabase is reserved for production/staging deployments
only, configured via Vercel environment variables at deploy time.

## Consequences

### Positive
- Every developer gets identical clean seed data on first boot
- No risk of stale remote data polluting local testing
- `npm run dev` works offline, no internet required
- `git clone` + `npm install` + `npm run dev` = working app, zero config
- Fallback.json is git-tracked (or at least versioned alongside the seed script),
  so data changes are auditable

### Negative
- Production deployment requires explicit Supabase env var configuration
- Local data mutations are ephemeral (lost on server restart unless persisted to disk)
- Migration testing (Prisma migrations) requires a temporary Supabase connection
- Developers who need to test against real DB data must temporarily add env vars

### Mitigations
- Add a startup log line in `database.ts`: `[PropertyEase] Mode: FALLBACK (local)`
  or `[PropertyEase] Mode: SUPABASE (live)` — makes active backend impossible to miss
- Keep `NEXT_PUBLIC_SUPABASE_URL` in `.env.example` as a comment showing the shape
- Document the two modes in `docs/ENV.md`

## Alternatives Considered
1. **Always use Supabase** — requires every dev to maintain their own DB instance or
   share one. More realistic for production parity but higher friction to start.
2. **Auto-detect and log mode** (what we do now, but buggy) — the bug proved this
   is error-prone; devs won't notice which mode is active without explicit logging.
3. **Dual-mode with explicit toggle** — add a `?mode=fallback|supabase` query param.
   Over-engineered for current scale.

## References
- `memory/incidents/2026-09-08-supabase-masks-fallback.md`
- `propertyease/.env.example`
- `propertyease/src/lib/database.ts` (lines 1–30: `useSupabase` logic)
