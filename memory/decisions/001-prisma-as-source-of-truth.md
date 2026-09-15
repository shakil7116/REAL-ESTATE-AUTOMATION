# ADR-001: Prisma is the Single Source of Truth for DB Schema
# ────────────────────────────────────────────────────────────

## Status
Accepted

## Date
2026-08-26

## Context
The repo contains both `propertyease/prisma/schema.prisma` (Prisma's source
of truth) and `propertyease/supabase-schema.sql` (a hand-written Postgres
schema for direct Supabase setup). The two have drifted:
- `schema.prisma` declares the default country as `UAE` for tenants.
- `supabase-schema.sql` declares the default country as `Qatar`.

`schema.prisma` is what the app actually uses at runtime (Prisma Client
reads it). `supabase-schema.sql` is only used when bootstrapping a fresh
Supabase project via the SQL editor. When the two drift, fresh installs
get the wrong country default and tenants in fresh Supabase instances
break the i18n currency selector.

## Decision
**`propertyease/prisma/schema.prisma` is the single source of truth.**
- All schema changes happen in `schema.prisma`.
- Migrations are generated via `npx prisma migrate dev` and stored in
  `propertyease/prisma/migrations/`.
- `supabase-schema.sql` is **deprecated and will be deleted** in the
  next cleanup PR.
- For fresh Supabase setup, we will instead use `prisma db push` against
  the Supabase Postgres URL (see `docs/ENV.md`).

## Consequences
**Easier:**
- One place to look for the schema.
- No drift between local dev and production.
- `prisma generate` always reflects the current state.

**Harder:**
- Fresh Supabase setup requires `prisma db push` (not SQL paste).
- Anyone who copy-pasted the old SQL into Supabase needs to re-bootstrap.

## Alternatives Considered
- **Make `supabase-schema.sql` the source of truth:** rejected — Prisma
  Client reads `schema.prisma` at runtime, so this would require
  abandoning Prisma Client entirely. Not worth it.
- **Keep both, document the drift:** rejected — drift is the bug we're
  trying to prevent.

## Related
- `propertyease/prisma/schema.prisma`
- `propertyease/supabase-schema.sql` (to be deleted)
- `docs/ENV.md` — Supabase bootstrap procedure
