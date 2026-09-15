# Handoff: @product-owner → @devops + @frontend-eng + @backend-eng
# Date: 2026-09-07
# From: @product-owner (orchestrator)
# To: @devops, @frontend-eng, @backend-eng (parallel execution)

## Context
PropertyEase v1.2 data hygiene is complete. Server is running on port 3000
but serving stale in-memory state (3 properties including test data).
Disk fallback.json is clean with 4 Qatar seed properties.

## Known Issue — Stale In-Memory State
The dev server's `globalThis.__PE_FALLBACK__` was populated during an earlier
session when test properties existed. Manual edits to `.data/fallback.json`
and `POST /api/debug/reset` only affect the calling process; other Next.js
worker processes retain their cached copies. The 5-second auto-reload in
`getBundle()` should pick up disk changes, but appears to be silently failing
on path resolution in this Windows environment.

**Fix required before any agent work:** Restart the dev server so the clean
4-property bundle loads fresh into all worker processes.

## Sprint Priorities (v1.2 — Current)
Based on `docs/SPRINT-2026-Q3.md` and recent audit:

### P0: Fix mobile currency labels (AED → QAR)
- **Owner:** @frontend-eng
- **Scope:** `propertyease-mobile/app/settings.tsx` has `AED` in COUNTRIES array
- All other mobile screens already use `QAR` in formatting functions
- **Acceptance:** No `AED` string anywhere in `propertyease-mobile/app/` except the country selector list item (which is informational)

### P1: Wire mobile Copilot to real OpenAI API
- **Owner:** @backend-eng (auth header), @frontend-eng (mobile screen)
- **Current state:** `propertyease-mobile/app/copilot.tsx` has `DEMO_RESPONSES`
  map with fabricated numbers ("QAR 228,360", "18 open tickets") that do not
  match live data. This is the highest-risk item per the sprint doc.
- **Acceptance:** Mobile Copilot calls `POST /api/copilot` with Bearer token;
  falls back to demo only on network error.

### P2: Complete mobile Payments + Maintenance pages
- **Owner:** @frontend-eng
- **Current state:** Both screens exist but are stubbed/incomplete
- **Acceptance:** Full CRUD matching web versions; uses real API endpoints

### P3: Add session token validation on all mobile API calls
- **Owner:** @backend-eng
- **Scope:** Centralize fetch wrapper in `lib/api.ts`, attach token from
  AsyncStorage, return 401 redirect to login

## Files to Create/Edit

### @devops
- [ ] Restart dev server to clear stale in-memory state
- [ ] Verify `GET /api/properties` returns exactly 4 Qatar properties

### @frontend-eng (mobile)
- [ ] Replace `AED` with `QAR` in `settings.tsx` country selector if needed
- [ ] Wire mobile copilot to real API (`copilot.tsx`)
- [ ] Complete mobile payments page (`payments.tsx`)
- [ ] Complete mobile maintenance page (`maintenance.tsx`)

### @backend-eng
- [ ] Review mobile auth header passthrough for copilot endpoint
- [ ] Consider centralized API client in mobile `lib/api.ts`

## Linked Issue
- Incident: `memory/incidents/2026-09-07-stale-fallback-state.md`
- Sprint: `docs/SPRINT-2026-Q3.md` (items #1–#7)
