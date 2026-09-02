# Mobile API Integration — Auth Bridge & New Pages

**Date:** 2026-09-02
**Agent:** @frontend-eng
**Status:** Complete, committed (`1695c3e`)

## What was done

The PropertyEase React Native mobile app (`propertyease-mobile/`) was connected to the real web API backend instead of using hardcoded demo data across all screens.

## Key decisions

### Bearer token auth for mobile
Web uses NextAuth cookie-based JWT; mobile cannot read http-only cookies. Solved by creating `POST /api/auth/login` on the web server that returns a JSON envelope `{ ok: true, data: { id, email, name, token } }`. The mobile app stores this opaque token as `pe_token` in AsyncStorage and sends it as `Authorization: Bearer <token>` on every API call. The existing `protectedHandler` already accepts Bearer tokens so no web-side auth changes were needed.

Demo mode works out of the box: when `NEXTAUTH_DEMO=true`, password `demo` auto-authenticates any email.

### Session module
`lib/session.ts` centralizes all AsyncStorage reads/writes. Keys:
- `propertyease_user` — serialized `SessionUser { id, email, name }`
- `pe_token` — bearer string
- `pe_lang` — `'en' | 'ar'`
- `pe_country` — ISO country code (default `'QA'`)

`clearSession` uses two `removeItem` calls (not `multiRemove`, which is not available in the version of `@react-native-async-storage/async-storage` bundled with the project).

### TypeScript strictness fix
React Native's style type definitions require literal types for properties like `justifyContent`, `alignItems`, `fontWeight`. All inline style objects that caused TS errors use `as const` or direct literal values.

### SLATE_* color scale
Added missing color tokens to `app/colors.ts` so all screens can reference them consistently:
- `SLATE_100 = '#F1F5F9'`
- `SLATE_200 = '#E2E8F0'`
- `SLATE_300 = '#CBD5E1'`
- `SLATE_400 = '#94A3B8'` (added previously)
- `SLATE_500 = '#64748B'`
- `SLATE_600 = '#475569'`

All importing screens were updated to pull the full slate palette they need.

## Files created
- `propertyease/src/app/api/auth/login/route.ts` — web credential login returning JSON
- `propertyease-mobile/lib/session.ts` — session + language + country persistence
- `propertyease-mobile/app/payments.tsx` — new payments page
- `propertyease-mobile/app/maintenance.tsx` — new maintenance page

## Files modified
- `propertyease-mobile/app/_layout.tsx` — session check, 7-tab navigator
- `propertyease-mobile/app/login.tsx` — real API login
- `propertyease-mobile/app/dashboard.tsx` — real stats + activity feed
- `propertyease-mobile/app/properties.tsx` — real property list
- `propertyease-mobile/app/tenants.tsx` — enriched tenants + leads merge
- `propertyease-mobile/app/copilot.tsx` — wire to POST /api/copilot
- `propertyease-mobile/app/settings.tsx` — language/country/logout
- `propertyease-mobile/app/colors.ts` — added SLATE_100 through SLATE_600

## Brand compliance
All colors sourced from `colors.ts` matching the web brand spec:
- PRIMARY `#132B25`
- CORAL `#D97757`
- WORKSPACE_BG `#F6F8F6`

## Verification
`npx tsc --noEmit` reports zero errors after all fixes applied.
