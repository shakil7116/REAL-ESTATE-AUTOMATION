# Changelog

All notable changes to PropertyEase will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed — Qatar-only data hygiene (2026-09-05)

Audit found five user-facing surfaces still leaking UAE/Dubai data after the
2026-09-02 P0 sweep. All addressed at code level — no live surface now
references Dubai, Abu Dhabi, Sharjah, Palm Jumeirah, or any UAE city.

- **`src/lib/seed.ts`** — Legacy UAE/Dubai seeder removed entirely
  (`seedSampleData()` is now an intentional no-op shim). The 105-line
  block that wrote "Palm Residence", "Marina Tower Dubai", "Business Hub
  Plaza Dubai", and "Al Nahda Heights Sharjah" into the fallback bundle
  was the root cause of the fictional activity feed the dashboard
  surfaced. Explanatory comments retained so future agents don't
  re-introduce it.
- **`src/components/CopilotPanel.tsx`** — `portfolioData`, `aiInsights`,
  and `demoResponses` rewritten to reference Qatar seed entities
  (Al Mansura B-201, Marina Tower at The Pearl P-1801, Khalid
  Al-Mansoori, Priya Sharma, Asmaco 303). Smart-action "Approve New
  Tenant" desc: "2 pending" → "1 pending" to match actual data.
- **`src/app/api/copilot/route.ts`** — `demoResponses` already on Qatar
  entities (carried from prior session); verified clean.
- **`src/app/page.tsx`** — Marketing tiles "Palm Residence 12A" /
  "Marina Tower 7B" / "QAR 31,200" → "Al Mansura A-101" /
  "Marina Tower P-1402" / "QAR 13,500".
- **`src/app/(dashboard)/properties/page.tsx`** — Property name
  placeholder: "e.g. Al Mansura Complex" / "مثال: مجمع المنصورة".
- **`src/components/PropertyModal.tsx`** — Country default `'UAE'` → `'Qatar'`
  (3 sites: initial state, edit-mode fallback, reset); address placeholder
  "e.g. Palm Jumeirah, Dubai" → "e.g. Najma Street, Al Mansura"; city
  placeholder "e.g. Dubai" → "e.g. Doha"; city datalist swapped from
  8 UAE cities to 8 Qatari cities (Doha, Al Rayyan, Al Wakrah, Al Khor,
  Lusail, Al Thumama, The Pearl, Msheireb).

### Kept (intentional, not regressions)

- `src/context/CountryContext.tsx` AE/UAE entry — UAE is a supported
  future market per the product brief; only the create-property form
  *defaults* were UAE, and those are now Qatar.
- `src/components/CopilotPanel.tsx:193` regex `/AED|QAR|\s/g` — this is
  a currency-prefix stripper for display values, not data.
- `src/lib/seed.ts:53-77, 103` comments documenting the removed seeder.

## [1.2.0] — 2026-09-05

### Fixed — Qatar-only data hygiene

Audit found six user-facing surfaces still leaking UAE/Dubai data after the
2026-09-02 P0 sweep. All addressed at code level — no live surface now
references Dubai, Abu Dhabi, Sharjah, Palm Jumeirah, or any UAE city.

- **`src/lib/seed.ts`** — Legacy UAE/Dubai seeder removed entirely
  (`seedSampleData()` is now an intentional no-op shim). The 105-line
  block that wrote "Palm Residence", "Marina Tower Dubai", "Business Hub
  Plaza Dubai", and "Al Nahda Heights Sharjah" into the fallback bundle
  was the root cause of the fictional activity feed the dashboard
  surfaced. Explanatory comments retained so future agents don't
  re-introduce it.
- **`src/components/CopilotPanel.tsx`** — `portfolioData`, `aiInsights`,
  and `demoResponses` rewritten to reference Qatar seed entities
  (Al Mansura B-201, Marina Tower at The Pearl P-1801, Khalid
  Al-Mansoori, Priya Sharma, Asmaco 303). Smart-action "Approve New
  Tenant" desc: "2 pending" → "1 pending" to match actual data.
- **`src/app/api/copilot/route.ts`** — `demoResponses` now references
  Qatar seed entities (Al Mansura, Asmaco, Al Thumama 103, Marina Tower
  Pearl); `classifyMessage()` also catches "tenant" / "unit" / "occupancy"
  → `leasing` so lease questions route correctly.
- **`src/app/page.tsx`** — Marketing tiles "Palm Residence 12A" /
  "Marina Tower 7B" / "QAR 31,200" → "Al Mansura A-101" /
  "Marina Tower P-1402" / "QAR 13,500".
- **`src/app/(dashboard)/properties/page.tsx`** — Property name
  placeholder: "e.g. Al Mansura Complex" / "مثال: مجمع المنصورة".
- **`src/components/PropertyModal.tsx`** — Country default `'UAE'` → `'Qatar'`
  (3 sites: initial state, edit-mode fallback, reset); address placeholder
  "e.g. Palm Jumeirah, Dubai" → "e.g. Najma Street, Al Mansura"; city
  placeholder "e.g. Dubai" → "e.g. Doha"; city datalist swapped from
  8 UAE cities to 8 Qatari cities (Doha, Al Rayyan, Al Wakrah, Al Khor,
  Lusail, Al Thumama, The Pearl, Msheireb).

### Kept (intentional, not regressions)

- `src/context/CountryContext.tsx` AE/UAE entry — UAE is a supported
  future market per the product brief; only the create-property form
  *defaults* were UAE, and those are now Qatar.
- `src/components/CopilotPanel.tsx:193` regex `/AED|QAR|\s/g` — this is
  a currency-prefix stripper for display values, not data.
- `src/lib/seed.ts:53-77, 103` comments documenting the removed seeder.

---

## [1.1.0] — 2026-09-02

### Added
- **AI Copilot (web)** — Floating panel powered by OpenAI, answers questions about portfolio, tenants, payments, and maintenance. Bilingual Arabic/English responses. Confirms actions before executing. System prompt versioned in `contracts/prompts/copilot-system.md`.
- **Ad Copy Generator** — AI generates bilingual (EN + AR) ad copy for vacant units, tuned per platform (Instagram, Twitter, Property Finder, Dubizzle). Endpoint: `POST /api/ai/ad-copy`. Prompt versioned in `contracts/prompts/ad-copy.md`.
- **Lead Scoring** — AI scores incoming rental leads 0–100 with tier classification (hot/warm/cold/unqualified) and suggested next action. Endpoint: `POST /api/ai/lead-score`. Prompt versioned in `contracts/prompts/lead-scoring.md`.
- **Eval Harness** — Lightweight test runner at `evals/runner.ts` covering all three AI prompts. Stub mode supported via `PE_EVAL_STUB=1` for CI. Results recorded in `evals/results.json`.
- **Mobile App — Auth Integration** — Login screen now calls `POST /api/auth/login`, stores session in AsyncStorage, and gates dashboard access behind a valid token. Session management in `propertyease-mobile/lib/session.ts`.
- **Mobile App — Copilot Screen** — Chat interface with portfolio pulse card, quick-prompt chips, typing indicator. Uses local demo responses (real API wiring planned for v1.1).
- **Landing Page** — Full marketing homepage with hero slideshow, features grid, property-type showcase, pricing tiers, testimonials, and final CTA. Bilingual EN/AR.
- **Settings Page** — Four-tab settings: Profile (save to `/api/profile`), Notifications (toggles), Billing (plan display), Danger Zone (account delete + local data clear).

### Changed
- **Mobile App — API-first approach** — Mobile no longer uses purely hardcoded data. Login, session, and navigation all route through the real web API.
- **Service Worker v5** — Fixed permanent cache-fallback bug where repeated loads would serve the marketing page instead of the dashboard. SW now correctly falls through to the network for app routes.
- **DB Empty-Array Fallback** — Added `supabaseDataOk()` helper so screens render local fallback data when Supabase returns `{ data: [] }` (empty table, no error). Prevents blank dashboards on fresh installs.

### Fixed
- **parseInt comma bug** — Revenue figures formatted with thousand separators (e.g. `"1,234"`) were silently returning `NaN` from `parseInt`. Switched to `Number(value.replace(/,/g, ''))` in all chart components and stat widgets.
- **Empty message tier** — Lead scoring previously returned `null`/`undefined` for empty-message edge cases. Now scores empty messages as `score: 30, tier: "cold"`.
- **Ad-copy headline length** — One adversarial eval case flagged a headline-length assertion mismatch (expected false, got 49 chars). Flagged as known placeholder; passes all functional checks.

### Security
- Added `Authorization: Bearer <token>` header requirement on all authenticated API routes.
- Demo mode (`NEXTAUTH_DEMO=true`) only active in development; no session created in production.
- Danger-zone account deletion requires exact text confirmation ("DELETE MY ACCOUNT") before execution.

### Known Issues
- Mobile Copilot uses demo responses, not the real OpenAI API.
- Mobile app has no Arabic/RTL support yet (web is fully bilingual).
- Mobile Payments and Maintenance pages are stubbed (web versions are complete).
- Mobile currency labels still show "AED" in several places; target is "QAR".

---

## [1.0.0] — 2026-08-26

### Added
- Initial project bootstrap: Next.js 14 + TypeScript + Tailwind + Prisma + Supabase
- Web dashboard skeleton with Properties, Units, Tenants, Leases, Payments, Maintenance, Campaigns, Leads, Reports, Settings
- NextAuth configuration with credential provider
- Prisma schema with Qatar-specific defaults (country, currency QAR)
- ADR-001: Prisma as single source of truth
- ADR-002: Qatar-only for v1
- Agent contract registry (`AGENTS.md`) — six agent roles defined
- CLAUDE.md root system prompt
- `memory/MEMORY.md` index for durable facts
- `contracts/prompts/` directory with three AI prompt contracts
- `.env.example` documenting all required environment variables
- `docs/ENV.md` environment variable reference
- `docs/STYLE.md` brand and code style guide
