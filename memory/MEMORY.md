# PropertyEase — Memory Index
# ─────────────────────────────────────────
# THIS IS THE FIRST FILE TO READ after CLAUDE.md and AGENTS.md.
# Every durable fact about this project lives here.
# Update this file whenever you add a new note.

## How memory is organized

```
memory/
├── MEMORY.md               ← you are here (index)
├── business.md             ← full business context
├── sw-v5-cache-fix.md      ← service worker permanent fix (DO NOT REGRESS)
├── decisions/              ← architectural decisions (ADRs)
│   ├── 000-template.md
│   ├── 001-prisma-as-source-of-truth.md
│   ├── 002-qatar-only-v1.md
│   ├── 003-dev-fallback-vs-supabase.md
│   └── 003-mobile-api-wire-and-eval-harness.md
├── incidents/              ← postmortems
│   ├── 000-template.md
│   └── 2025-08-15-cache-fallback-bug.md
├── patterns/               ← reusable patterns
│   ├── 000-template.md
│   └── form-modal.md
└── handoffs/               ← cross-agent handoffs
    └── 000-template.md
```

## Reading order for a new agent session

1. `CLAUDE.md` (always first)
2. `AGENTS.md` (load your role contract)
3. `memory/MEMORY.md` (this file)
4. `memory/business.md` (context)
5. `memory/sw-v5-cache-fix.md` (do not regress)
6. The relevant subfolder for your task

## Index of notes

### Decisions
- [001: Prisma is the single source of truth for DB schema](decisions/001-prisma-as-source-of-truth.md) — `supabase-schema.sql` is deprecated, drop it
- [002: v1 ships Qatar-only](decisions/002-qatar-only-v1.md) — GCC expansion deferred to v2
- [003: Mobile wired to real API + eval harness design](decisions/003-mobile-api-wire-and-eval-harness.md) — Mobile app calls web API via session token in AsyncStorage; 3-prompt eval harness (stub mode); v1.1 scope documented
- [004: Agent-based automation workflow](decisions/2026-09-07-agent-workflow.md) — Tasks assigned to agents per AGENTS.md contracts; product-owner orchestrates parallel handoffs
- [ADR-003: Dev fallback vs Supabase mode](decisions/003-dev-fallback-vs-supabase.md) — Local dev runs in FALLBACK mode (`.data/fallback.json`); startup banner in `database.ts` makes active backend impossible to miss. Status: Accepted

### Incidents
- [2025-08-15: Cache fallback bug](incidents/2025-08-15-cache-fallback-bug.md) — service worker served marketing page from cache to dashboard route; v5 is the permanent fix
- [2026-09-02: Mobile API integration](incidents/2026-09-02-mobile-api-integration.md) — Bearer token auth bridge, payments/maintenance pages, zero TS errors after SLATE_* scale + multiRemove fixes
- [2026-09-07: Stale in-memory fallback state](incidents/2026-09-07-stale-fallback-state.md) — Manual edit of .data/fallback.json not picked up by live Next.js workers; requires full server restart to clear. **Partially superseded**: the real root cause was Supabase env vars (see 2026-09-08 incident).
- [2026-09-08: Supabase env vars mask stale data](incidents/2026-09-08-supabase-masks-fallback.md) — NEXT_PUBLIC_SUPABASE_URL set in .env.local causes all API routes to bypass fallback.json entirely; stale test rows persisted in Supabase despite clean disk state

### Patterns
- [Form Modal](patterns/form-modal.md) — standard pattern for create/edit forms in modals
- [Mobile i18n layer](../propertyease-mobile/lib/i18n.ts) — `t(key, vars?)` function + `setLocale()` / `initLocale()` with `I18nManager.forceRTL()`; all 9 mobile screens use it

### Cross-engine facts
- [SW v5 cache fix](sw-v5-cache-fix.md) — service worker permanently fixed; never falls back to cached `/` for app routes

## Rules for writing to memory

1. **One fact per file.** Don't write essays — write facts.
2. **Filename is the slug.** `decisions/003-use-zod-not-yup.md` not `decision-about-validation.md`.
3. **Every note has a date.** `YYYY-MM-DD` at the top of the file.
4. **Update this index** when you add or remove a note.
5. **Don't store secrets.** Ever. Even redacted ones.
6. **Don't store temporary state.** Use `handoffs/` for that, not `decisions/`.

## Last-updated protocol

When you add a new note, update this index AND the file's "Last updated" line.
This file is the source of truth for "what do I need to know before working on this project."

---

**Last updated:** 2026-09-08
**Maintained by:** @product-owner
