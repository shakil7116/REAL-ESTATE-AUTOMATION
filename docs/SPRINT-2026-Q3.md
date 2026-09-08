# Sprint 2026-Q3 — PropertyEase

## Version scope: v1.0 release + v1.1 planning + v1.2 active
**Owner:** @product-owner
**Last updated:** 2026-09-08

---

## Completed (v1.0 scope)

### Web app (Next.js 14 + Prisma + Supabase)
- [x] Dashboard page with portfolio overview, charts, activity feed
- [x] Properties listing + detail view ([id])
- [x] Units CRUD under each property
- [x] Tenants listing with status badges
- [x] Leases listing with expiry tracking
- [x] Payments ledger
- [x] Maintenance tickets (open/in-progress/resolved)
- [x] Ad Campaigns page
- [x] Leads page
- [x] Reports page with revenue chart
- [x] Settings page (profile, notifications, billing, danger zone)
- [x] Landing/marketing page (`/`) with hero, features, pricing, testimonials
- [x] Onboarding flow (`/onboard`)
- [x] Forgot-password / reset-password flows
- [x] NextAuth configuration with demo mode
- [x] API routes for all 17 entities (`/api/*`)
- [x] Bilingual i18n (English + Arabic) across all web pages
- [x] RTL layout support (`dir="rtl"`)
- [x] Copilot AI chat panel (floating, docked to viewport)
- [x] AI Copilot backend (`/api/copilot`) — real OpenAI call
- [x] Ad copy generation (`/api/ai/ad-copy`)
- [x] Lead scoring (`/api/ai/lead-score`)
- [x] Image upload via Cloudinary (`/api/upload`)
- [x] Brand-consistent Tailwind theme (dark green + coral)
- [x] Supabase RLS policies applied to all tables
- [x] Service worker v5 (with permanent cache-fallback bug fix — see `memory/SW-v5-fix`)
- [x] DB empty-array fallback (`supabaseDataOk()` helper)

### Mobile app (Expo SDK 52 + React Native 0.76)
- [x] Auth flow: login screen wired to `POST /api/auth/login`, session in AsyncStorage
- [x] Bottom-tab navigation (Dashboard, Properties, Tenants, Copilot, Settings)
- [x] Dashboard screen (port layout, stat cards, quick actions, health banner)
- [x] Properties screen with search and type badges
- [x] Tenants + Leads tabbed screen
- [x] AI Copilot chat screen (demo-mode responses)
- [x] Settings screen with plan info and logout
- [x] Shared color token system (`app/colors.ts`) matching web brand

### AI / Eval harness
- [x] Three eval prompts defined and versioned in `contracts/prompts/`
- [x] Eval runner (`evals/runner.ts`) with stub-mode support
- [x] Baseline results committed (`evals/baseline.json`)
- [x] Results JSON with per-case breakdown (`evals/results.json`)
- [x] All eval cases passing except one known placeholder in ad-copy

### Documentation
- [x] Architecture doc (root)
- [x] Style guide (`docs/STYLE.md`)
- [x] Environment variables reference (`docs/ENV.md`)
- [x] ADR-001: Prisma as single source of truth
- [x] ADR-002: Qatar-only for v1
- [x] Agent contracts (`AGENTS.md`)
- [x] Memory index (`memory/MEMORY.md`)
- [x] Business context (`memory/business.md`)

---

## Completed (v1.2)

### Data hygiene round 2
- [x] Removed 3 stale test properties ("My Test Property"/UAE, "AL THUMAMA 103
      UPDATED" typo, "New Test Property") from `.data/fallback.json`
- [x] Fixed corrupted `ad_campaigns` array (malformed entry had activities spliced in)
- [x] Verified clean 4-property Qatar seed bundle via `POST /api/debug/reset`
- [x] Comprehensive audit across all 12 dashboard pages + Copilot confirmed zero
      Dubai/UAE/Palm Jumeirah test-data references on user-facing surfaces
- [x] CHANGELOG [1.2.1] entry documenting the stale in-memory state bug
- [x] Incident documented: `memory/incidents/2026-09-07-stale-fallback-state.md`
- [x] Agent workflow decision recorded: `memory/decisions/2026-09-07-agent-workflow.md`
- [x] Root cause identified: `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` caused all
      API routes to bypass fallback.json and query Supabase directly, serving stale
      test rows from the live database. Diagnostic endpoint `/api/debug/dump` created.
      Stale rows deleted from Supabase; incident recorded.

### Mobile fixes (2026-09-08)
- [x] Currency fix: removed AED/UAE and 4 other GCC countries from `settings.tsx`
      COUNTRIES array; now Qatar-only per ADR-002
- [x] Copilot fabricated numbers removed: DEMO_RESPONSES no longer contains fake
      portfolio figures (e.g. "QAR 228,360", "18 open tickets"); fallback text
      now transparently indicates API unavailability
- [x] Mobile Payments page — confirmed wired to `GET /api/payments` and working
- [x] Mobile Maintenance page — confirmed wired to `GET /api/maintenance` and working

---

## In Progress

---

## Next Sprint (v1.1)

Prioritized by: user-facing value, security, end-to-end completeness, Qatar market fit.

### 1. Fix all mobile currency references from AED to QAR
- **Why:** Qatar is the target market (ADR-002). Displaying AED (UAE dirham) in a
  Qatar-only product damages credibility immediately. Users will notice before
  anything else.
- **Effort:** S (find-and-replace across ~6 mobile screens, update hardcoded strings)
- **Owner:** @frontend-eng (mobile screens), @product-owner (verify correctness)

### 2. Add Arabic RTL support to mobile app
- **Why:** A core value proposition of PropertyEase is bilingual Arabic/English.
  The web is fully RTL; the mobile app is English-only. This creates a jarring
  gap for Arabic-speaking property managers who are the primary market.
- **Effort:** M (add i18n module to mobile, mirror web translation keys, switch
  text direction via `I18nManager`, add language toggle in settings)
- **Owner:** @frontend-eng

### 3. Wire mobile Copilot to real OpenAI API
- **Why:** Current copilot uses a keyword-matching demo response map. It gives
  fake numbers that look real. Users will trust wrong data and make bad decisions.
  The web Copilot already calls the real endpoint; mobile must do the same.
- **Effort:** M (replace `DEMO_RESPONSES` map with `fetch('/api/copilot', {...})`,
  pass AsyncStorage token as Authorization header, handle streaming or
  non-streaming response)
- **Owner:** @backend-eng (auth header passthrough), @frontend-eng (mobile screen)

### 4. Complete Payments + Maintenance pages on mobile
- **Why:** These are two of the three "Jobs To Be Done" from `memory/business.md`
  ("stop chasing rent", "stop WhatsApping maintenance"). A property manager on
  the road cannot record a payment or create a maintenance ticket on mobile.
  The feature is half-there.
- **Effort:** M each (list + detail + create form; both web versions exist as
  reference)
- **Owner:** @frontend-eng

### 5. Add session token validation on all mobile API calls
- **Why:** Currently some screens call the API without any auth header. Anyone
  with the URL can read tenant data. This is a security gap that must close
  before v1.1 ships to any real users.
- **Effort:** S (centralize fetch wrapper in `lib/api.ts`, attach token from
  AsyncStorage, return 401 redirect to login on auth failure)
- **Owner:** @backend-eng

### 6. Write manual QA checklist for mobile login + payment flow
- **Why:** No automated tests exist for the mobile app yet. Before we release
  v1.1 to anyone, we need a regression-safe process. The web has NextAuth
  session tests; the mobile auth path has none.
- **Effort:** S
- **Owner:** @qa-tester

### 7. Add offline-first cache invalidation strategy
- **Why:** Property managers in Qatar often work in basements or areas with weak
  signal. The current mobile app shows stale data indefinitely once loaded.
  A time-based or event-based cache refresh (e.g., pull-to-refresh, on app
  foreground) would prevent embarrassing stale-number scenarios.
- **Effort:** M
- **Owner:** @backend-eng (invalidation policy), @frontend-eng (UI hook)

### 8. Publish first CHANGELOG entry (v1.0.0)
- **Why:** No changelog exists. Stakeholders and future agents have no visible
  record of what shipped. Per CLAUDE.md §8, this is required at definition of done.
- **Effort:** S
- **Owner:** @product-owner

---

## Out of Scope for v1.1 (deferred to v2)

- GCC expansion (multi-country, multi-currency, multiple locale variants)
- In-app subscription/upgrade flow (Stripe or local gateway)
- Tenant-facing self-service portal
- WhatsApp Business API integration
- Accounting integration (QuickBooks)
- Push notification infrastructure
- Real-time Supabase subscriptions on mobile
- Photo upload from mobile camera (for maintenance tickets)

---

## Key Risk

The mobile copilot currently shows fabricated numbers (e.g., "QAR 20.1M revenue",
"18 open tickets"). If any real user acts on these, it damages trust irreparably.
Item #3 (wire to real API) must land before item #4 (payments + maintenance) is
considered complete.

---

**Maintained by:** @product-owner
