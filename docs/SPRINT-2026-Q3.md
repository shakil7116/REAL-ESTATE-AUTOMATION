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

## Completed (v1.1)

| # | Item | Status | Notes |
|---|---|---|---|
| 1 | Mobile i18n hardening pass | ✅ done | All 9 screens now use `t()` for every display string; removed hardcoded English strings in tenants/payments/settings/login/properties/maintenance; fixed `t` shadowing bugs in tenants.tsx and maintenance.tsx that would crash at runtime in Arabic; added tenant-status, lead-status, payment-status, maintenance-priority keys |
| 2 | Offline-first cache invalidation strategy | ✅ done | Added `lib/cache.ts` session-scoped in-memory cache with per-endpoint TTL (2–5 min); all 6 data screens (dashboard/properties/tenants/payments/maintenance) wrap ScrollView in RefreshControl + call `useFocusEffect(() => refreshCache())`; `refreshCache()` is the single global invalidation point |

### 3. Publish first CHANGELOG entry (v1.0.0)
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
