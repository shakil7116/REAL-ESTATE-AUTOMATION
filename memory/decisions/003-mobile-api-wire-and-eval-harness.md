# ADR-003: Mobile-to-API Wire, Auth Approach, and Eval Harness Design
# ─────────────────────────────────────────────────────────────────────

## Status
Accepted

## Date
2026-09-02

## Context

PropertyEase shipped its web app with full Supabase-backed API routes in August
2026. The parallel mobile app (`propertyease-mobile/`) was scaffolded with
Expo SDK 52 + expo-router 4, but all screens were displaying hardcoded demo
data — no real API calls, no session persistence, no language switching.

Two questions needed answering before mobile could be production-ready:

1. **Should mobile call the real web API or keep a local stub?**
   Keeping a stub-only mobile doubles the maintenance surface (two data stores,
   two sets of bugs) and prevents real end-to-end testing of the auth flow.
   The web already has typed Zod-validated API routes; mobile should consume them.

2. **How should the mobile app authenticate?**
   NextAuth sessions live in HTTP cookies scoped to `propertyease.qa`. Mobile
   apps cannot use browser cookies. The app needs a bearer-token mechanism so
   every mobile request carries authentication to the same API endpoints.

3. **How do we ensure the AI features (Copilot, ad-copy, lead-scoring) keep
   producing correct output as the model/engine changes?**
   The project runs evaluation runs against three prompts (`ad-copy`,
   `copilot-system`, `lead-scoring`). A lightweight harness was needed to catch
   regressions before they reach production.

## Decision

### Mobile wire: real API, not stubs

The mobile app now calls the same REST API the web app uses:
- Login: `POST /api/auth/login` (returns `{ ok, data: { id, email, name, token } }`)
- Session stored in `@react-native-async-storage/async-storage` under the key
  `propertyease_session` (via `lib/session.ts`)
- Auth header injected via `Authorization: Bearer <token>` on every fetch
- All data screens (properties, tenants, payments, maintenance) are wired to
  their respective `GET /api/{entity}` routes when a valid session exists

A fallback to AsyncStorage-local data is retained for offline-first resilience:
if the API call fails, the screen falls back to cached records already stored
locally (see `memory/decisions/002-qatar-only-v1.md` for the rationale on local
first).

### Authentication: session token in AsyncStorage

The chosen approach:
- Mobile login calls `/api/auth/login` with email + password
- On success, the server returns a JWT-like session token in the response body
- Token is stored in AsyncStorage alongside the user profile object
- Every subsequent API request includes `Authorization: Bearer <token>`
- Root layout checks for a valid session on mount; if absent, redirects to `/login`

This mirrors the web app's session model without requiring cookie infrastructure.
The token carries the user ID, email, and an expiry timestamp. No refresh flow
is implemented in v1 — the user must re-login if the token expires.

### Eval harness design

The eval harness at `evals/runner.ts` runs each prompt against a JSON cases
file and scores pass/fail per assertion:

- **Three prompts covered:** `ad-copy`, `copilot-system`, `lead-scoring`
- **Assertion types:** `field_present`, `score_range`, `tier_match`,
  `contains_text`, `not_contains_text`, `json_parseable`
- **Stub mode:** When `PE_EVAL_STUB=1`, the runner returns pre-canned results
  from `evals/baseline.json` — used in CI so LLM costs don't accrue on every PR
- **Output format:** JSON report with aggregate score (0–1) per prompt and
  per-case breakdown with duration_ms and failure detail array

Results from the current run (2026-09-02):
- `ad-copy`: 0.833 (one known placeholder assertion fails intentionally)
- `copilot-system`: 1.0 (all 13 cases pass)
- `lead-scoring`: 1.0 (all 16 cases pass)

### What was cut for v1 vs deferred to v2

**Cut (v1.0 shipped):**
- Payments page (mobile) — web is done, mobile is stubbed
- Maintenance page (mobile) — web is done, mobile is stubbed
- Real-time Copilot (mobile) — uses local demo responses; real OpenAI call deferred
- Push notifications — infra not ready
- Multi-language (Arabic) mobile UI — English only on mobile at launch
- Payments + Maintenance deep-links from push notification

**Deferred to v1.1 (next sprint):**
- Mobile Payments and Maintenance pages wired to real API
- Mobile Copilot calling real `POST /api/copilot` endpoint
- Currency fix: all mobile screens currently hardcode "AED" — must switch to QAR
- Offline cache sync strategy (when device reconnects)
- Deep linking from push notifications

**Deferred to v2:**
- GCC expansion (multi-country, multi-currency)
- In-app purchase / subscription management
- Tenant-facing self-service portal
- Accounting integration (QuickBooks)
- WhatsApp Business API integration

## Consequences

**Easier:**
- Single source of truth for business logic (API routes)
- Mobile and web share the same data layer
- Auth tested end-to-end across both surfaces
- Eval harness catches AI regression before deployment

**Harder:**
- Mobile requires web API to be running (localhost during dev, Vercel in prod)
- Token expiry is a manual re-login flow (no silent refresh in v1)
- Eval runner requires OpenAI API key for non-stub mode (cost concern in CI)

**Trade-off acknowledged:** We prioritized a working mobile auth + data flow over
beautiful offline-first UX. The fallback-to-local-cache path means the app never
crashes, but it may show stale data after an API change until the user pulls again.

## Alternatives Considered

- **SQLite on-device database (expo-sqlite):** rejected — doubles sync complexity,
  harder to keep in sync with Supabase, no benefit for v1 scale (under 500 units)
- **Supabase client directly from mobile:** rejected — exposes anon key in bundle,
  bypasses our auth layer and rate-limiting logic
- **Pass-through proxy (mobile → web backend → Supabase):** over-engineered —
  adds latency and a middle hop with no security benefit since we're already
  calling the same API
- **Keep mobile stub-only indefinitely:** rejected — blocks real QA testing and
  makes the product feel half-baked at launch

## Related
- `propertyease-mobile/app/login.tsx` — real API auth call
- `propertyease-mobile/lib/session.ts` — AsyncStorage session storage
- `contracts/prompts/ad-copy.md`
- `contracts/prompts/lead-scoring.md`
- `contracts/prompts/copilot-system.md`
- `memory/decisions/001-prisma-as-source-of-truth.md`
- `memory/decisions/002-qatar-only-v1.md`
- `evals/runner.ts` — eval harness entry point
