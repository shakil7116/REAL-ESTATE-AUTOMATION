# SW v5 — Cache Fallback Fix
# ─────────────────────────────
# THIS IS A PERMANENT FIX. DO NOT REGRESS.
# Source-of-truth duplicate of the user's auto-memory note.
# If the SW bug ever resurfaces, the regression test in this file MUST pass.

## Status
**FIXED — 2025-08-15. Permanent. Do not change `public/sw.js` without
explicit user confirmation.**

## The bug
Service worker was serving the cached root `/` (the marketing landing page)
to dashboard routes (`/dashboard`, `/properties`, etc.) when offline or on
slow connections. This injected the marketing hero into the app shell,
breaking the dashboard layout, navigation, and auth state.

## The fix
SW v5 was deployed with the following changes:

1. **No fallback to cached `/` for app routes.** If a navigation request
   matches an app route and the network is unreachable, return the app
   shell (or a 503-style offline page), NEVER the marketing page.
2. **Force re-registration on every load.** The SW registration script
   in `propertyease/src/app/layout.tsx` calls `.unregister()` on all
   existing registrations, then registers `/sw.js?v=5` fresh.
3. **Cache-only for static assets.** The SW caches `/static/*`, `/_next/static/*`,
   and explicit user-saved pages. Nothing else.

## Files this fix touches
- `propertyease/public/sw.js` (the SW itself)
- `propertyease/src/app/layout.tsx` (registration script with `?v=5`)

## Regression test (manual, run before every release)
1. Visit `/` (marketing) — should load.
2. Log in and visit `/dashboard` — should load.
3. Open DevTools → Application → Service Workers. Confirm `sw.js?v=5` is active.
4. Go offline (DevTools → Network → Offline).
5. Refresh `/dashboard` — should show offline state, NOT marketing hero.
6. Go back online, refresh `/dashboard` — should work normally.

## What NOT to do
- Do NOT change the SW to use a more aggressive caching strategy without
  testing the regression above.
- Do NOT remove the `?v=5` query string from the registration.
- Do NOT remove the force-unregister code.
- Do NOT add `Cache-Control: no-store` on `/_next/static/*` — see ADR
  on cache headers in `memory/decisions/`.

## How to bump the SW version
1. Edit `propertyease/public/sw.js`, increment the version constant.
2. Edit `propertyease/src/app/layout.tsx`, change `?v=N` to match.
3. Run the regression test above.
4. Update this file with the new version and date.
5. Add an incident note in `memory/incidents/` summarizing the change.

---

**Last updated:** 2026-08-26
**Maintained by:** @devops
