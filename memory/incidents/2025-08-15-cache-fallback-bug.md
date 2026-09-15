# Incident 2025-08-15: Cache Fallback Bug — Service Worker Served Marketing Page on Dashboard Routes
# ─────────────────────────────────────────────────────────────────────────────────────────────────────

## Summary
Service worker (v4 and earlier) was serving the cached marketing landing
page (`/`) as a fallback for app routes (`/dashboard`, `/properties`, etc.)
when the user was offline or on a slow connection. This caused the
dashboard layout, navigation, and auth state to break — the marketing
hero would inject into the app shell.

## Severity
S1 (major feature broken — affected all users in offline/slow scenarios)

## Date Discovered
2025-08-15

## Date Resolved
2025-08-15

## Impact
- 100% of users who went offline or experienced slow connections saw a
  broken dashboard for the duration of the offline state.
- Auth state would appear restored but was actually a cached page state,
  leading to data leakage in shared-computer scenarios.
- Dashboard navigation links did not work because the marketing page had
  no app routing.

## Root Cause
The SW v4 cache strategy was: "if the network fails for a navigation
request, return the cached `/`." This was intended for first-time
visitors on flaky networks but broke the app shell assumption. The SW
did not distinguish between marketing routes (`/`, `/pricing`, `/blog`)
and app routes (`/dashboard`, `/properties`, `/units`).

## Resolution
Deployed SW v5 with the following changes:
1. **No fallback to cached `/` for app routes.** App routes return a
   dedicated offline page or the app shell, never the marketing page.
2. **Force re-registration on every load** in `layout.tsx`, with
   `?v=5` query string to bust the SW cache.
3. **Cache key namespace** — marketing routes cache under `marketing-v5`,
   app routes cache under `app-v5`, no cross-pollination.

## Prevention
- Memory note written: `memory/sw-v5-cache-fix.md`
- Manual regression test added to release checklist
- `@devops` contract now lists `public/sw.js` as REQUIRES USER CONFIRMATION
  before any change
- `@frontend-eng` is forbidden from editing `public/sw.js`

## Related
- `memory/sw-v5-cache-fix.md` — the permanent fix
- `propertyease/public/sw.js` (v5)
- `propertyease/src/app/layout.tsx` (registration script)
