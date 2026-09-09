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
- [x] **Arabic RTL support** (`lib/i18n.ts` + all 9 screens use `t()` keys)
- [x] **Full i18n on mobile**: EN + AR MSA translations (~200+ keys), RTL direction
      flips automatically via `I18nManager.forceRTL()`, language toggle in Settings
      persists to AsyncStorage and re-applies on next open

---

## In Progress

---

## Completed (v1.2 — 2026-09-08)

| # | Item | Status | Notes |
|---|---|---|---|
| 1 | Fix mobile currency AED → QAR | ✅ done | settings.tsx COUNTRIES = QA only |
| 2 | Arabic RTL support | ✅ done | `lib/i18n.ts` + all screens translated |
| 3 | Wire Copilot to real API | 🔄 partial | API call wired; demo responses kept for offline fallback |
| 4 | Complete Payments + Maintenance pages | ✅ done | both screens fetch live data, create forms present |
| 5 | Session token on all API calls | ✅ done | All 9 screens pass Bearer token; settings has no API calls |
| — | Startup banner | ✅ done | `database.ts` prints `Mode: FALLBACK/SUPABASE` on every dev server start |

---

## Next Sprint (v1.1)

Prioritized by: user-facing value, security, end-to-end completeness, Qatar market fit.

### 1. Remove remaining Copilot demo fallback responses
- **Why:** The `DEMO_RESPONSES` map still intercepts every offline/misclassified message with a generic "unavailable" reply instead of surfacing the real /api/copilot error. It should only fall back to a transparent connectivity message, not pre-written strings that look like answers.
- **Effort:** S (replace DEMO_RESPONSES entries with a single connectivity-fallback string; keep the try/catch but surface the actual network error to the user)
- **Owner:** @frontend-eng

### 2. Add offline-first cache invalidation strategy
- **Why:** Property managers in Qatar often work in basements or areas with weak
  signal. The current mobile app shows stale data indefinitely once loaded.
  A time-based or event-based cache refresh (e.g., pull-to-refresh, on app
  foreground) would prevent embarrassing stale-number scenarios.
- **Effort:** M
- **Owner:** @backend-eng (invalidation policy), @frontend-eng (UI hook)

### 3. Publish first CHANGELOG entry (v1.0.0)
- **Why:** No changelog exists. Stakeholders and future agents have no visible
  record of what shipped. Per CLAUDE.md §8, this is required at definition of done.
- **Effort:** S
- **Owner:** @product-owner
- **Status:** ✅ done — v1.0.0 entry added to docs/CHANGELOG.md 2026-09-08

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

The mobile copilot still returns generic "unavailable" text on network errors
instead of surfacing the real connection problem. This is tracked under SPRINT
item #1 (remove DEMO_RESPONSES map).

---

**Maintained by:** @product-owner
