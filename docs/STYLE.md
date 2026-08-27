# PropertyEase — Style Guide (Single Source of Truth)

> **This file is the canonical style reference for the PropertyEase codebase.**
> All design decisions — colors, type, layout, RTL rules, motion — must originate here.
> `memory/business.md` and `propertyease/DESIGN_PROMPT.md` are referenced but this file wins on conflicts.

---

## 1. Brand Identity

| Field | Value |
|---|---|
| Product | **PropertyEase** — multi-property + unit + tenant + lease + payment + maintenance + ad-campaign + AI Copilot |
| Market (v1) | **Qatar (QAR)**. GCC expansion is v2. |
| Domains | `propertyease.qa` (web), `api.propertyease.qa` (API) |
| Voice | Professional but warm. Bilingual copy is MSA-grade, not literal translation. |

### Pricing Tiers (QAR)

| Tier | Price | Units | Target user |
|---|---|---|---|
| Starter | Free | 10 | Solo landlord trying us out |
| Growth | 299 / month | 50 | Single property manager, 1–5 buildings |
| Enterprise | 799 / month | Unlimited | Property management company, 5+ buildings |

No annual discount in v1.

---

## 2. Color Tokens

Use these CSS custom properties / Tailwind class names. Never hardcode hex in components.

| Token | Hex | Tailwind class | Use |
|---|---|---|---|
| `--brand-primary` | `#132B25` | `bg-[#132B25]`, `text-[#132B25]` | Dark green — sidebar, primary buttons, brand |
| `--brand-accent` | `#D97757` | `bg-[#D97757]`, `text-[#D97757]` | Coral — CTAs, highlights, active states |
| `--brand-workspace` | `#F6F8F6` | `bg-[#F6F8F6]` | Page background |
| `--text-primary` | `#0D2A24` | `text-[#0D2A24]` | Body text, headings |
| `--text-muted` | `#5A6B66` | `text-slate-500` (closest match) | Subtitle, helper text |
| `--border` | `#E3E8E5` | `border-slate-200/80` (closest match) | Card borders, dividers |
| `--success` | `#22C55E` | `text-emerald-500/600` | Success states, positive deltas |
| `--warning` | `#F59E0B` | `text-amber-500` | Warnings, pending states |
| `--danger` | `#EF4444` | `text-rose-500` | Errors, negative deltas |

**Note:** `#0D2A24` and `#132B25` are similar but distinct — use `#0D2A24` for text on light backgrounds, `#132B25` for surface fills (sidebar, buttons).

---

## 3. Typography

| Use | Font | Weights | Notes |
|---|---|---|---|
| Latin body | **Plus Jakarta Sans** | 400, 500, 600, 700, 800 | Google Fonts |
| Arabic body | **Cairo** | 400, 600, 700, 800 | Google Fonts — must have full Arabic range |
| Display / headings | **Inter** (or Plus Jakarta Sans if no separate display font) | 700, 800 | Tight letter-spacing (-0.01em) |

Both languages must be loaded on every page. Tailwind config must include both in `fontFamily`.

### Scale

| Token | Size | Use |
|---|---|---|
| `text-xs` | 12px | Helper text, badges, captions |
| `text-sm` | 14px | Default UI, table cells |
| `text-base` | 16px | Body paragraphs |
| `text-lg` | 18px | Subheadings |
| `text-xl` | 20px | Section headers (mobile) |
| `text-2xl` | 24px | Stat card values |
| `text-3xl` | 30px | Section headers (desktop) |
| `text-4xl` | 36px | Page H1, hero numbers |

Line height: 1.6 for body, 1.2 for headings.

---

## 4. Layout

### Shell
- **Sidebar width:** 240px (collapsible on mobile)
- **Top bar height:** ~64px
- **Workspace background:** `#F6F8F6` with a subtle dot/grid pattern (`bg-grid-pattern` Tailwind plugin)
- **Content max-width:** `max-w-7xl mx-auto` (1280px)

### Stat cards
- White background, `rounded-2xl` (16px radius), `border border-slate-200/80`, subtle shadow
- 4-up grid on `xl`, 2-up on `sm`, 1-up on mobile
- Icon in colored square (`w-10 h-10 rounded-xl bg-{color}-100`)
- Delta indicator top-right (green up / red down arrow + percentage)

### Buttons
- **Primary (coral):** `bg-[#D97757] hover:bg-[#c66546] text-white`
- **Secondary (white):** `bg-white border border-slate-200 hover:bg-slate-50`
- **Ghost:** `hover:bg-slate-100 text-slate-700`
- Radius: `rounded-full` for pill buttons, `rounded-xl` for rectangular

### Spacing
- Card padding: 20–24px (`p-5` / `p-6`)
- Section gap: 24px (`gap-6`)
- Within cards: 16px (`gap-4`)

---

## 5. Internationalization (i18n) Rules

**Critical:** The app is bilingual. Every user-visible string must work in both languages.

### Currency display
- **English pages:** show the **ISO currency code** (e.g. "QAR 4,500"). Never use the Arabic-Indic symbol.
- **Arabic pages:** show the **local symbol** (e.g. "٤٬٥٠٠ ر.ق"). The symbol is meaningful to Arabic readers.
- All currency formatting must go through `useCountry().formatCurrency(value)` from `src/context/CountryContext.tsx` — do not hand-roll.

### Date / time formatting
- Use `Intl.DateTimeFormat` with a locale derived from the country:
  - English: `en-QA`, `en-AE`, `en-SA`, `en-KW`, `en-BH`, `en-OM` (fallback `en-US`)
  - Arabic: `ar-QA`, `ar-AE`, etc. (NOT hardcoded `ar-AE`)
- Live timestamps (e.g. "Live portfolio pulse · 09:46 GST") must render only client-side — server uses UTC and will disagree with user timezone. See `useClientDate` / `useMounted` in `src/lib/useClientTime.ts`.

### RTL rules
- The root layout sets `dir={lang === 'ar' ? 'rtl' : 'ltr'}`.
- Margins/paddings: use `ms-*` / `me-*` (margin-start / margin-end), never `ml-*` / `mr-*`. Same for `ps-*` / `pe-*`.
- Icons that point in a direction (arrow, chevron) must use the `*-rtl` variant if available, or be wrapped in a CSS flip.
- Locale-specific test cases must run in both directions (see CLAUDE.md Rule #10).

### Country selector
- Header shows the **country name** (e.g. "Qatar"), NOT the ISO code (e.g. "QA") — the regional-indicator flag emoji (🇶🇦) renders as the literal letters "QA" on many systems, which produces "QA QA" when combined with the code.
- The flag emoji should be removed from the button label entirely. Keep the Globe icon.
- The dropdown menu shows: flag + name + currency code. Active country is marked with ✓ and coral text.

---

## 6. Motion

- Card hover: `hover:shadow-md transition-shadow` (subtle)
- Button hover: slight darkening, no scale (we don't use scale 1.02 — it feels janky in dashboards)
- Page transitions: 200–300ms `transition-all`
- Skeleton loaders for data fetches (NOT spinners — spinners feel slow for ≤2s loads)
- Chart entry: 400ms ease-out for the line drawing in (Recharts default)

---

## 7. Voice & Copy

- **Active voice, present tense.** "Rent is due Friday" not "Rent will be due on Friday."
- **Direct.** No "synergy", "leverage", "best-in-class", "revolutionary", "I think maybe we could possibly…"
- **Pronouns:** "we" for the company, "you" for the user.
- **Bilingual is MSA-grade**, not literal Google Translate. Hire a native speaker to review before launch.
- **Empty states are first-class.** A stat card with "—" is fine; a stat card with "0" is wrong (0 implies tracking, — implies "no data yet").

---

## 8. Reference

- **Brand spec:** `memory/business.md` (canonical identity)
- **Original landing page brief (DEPRECATED):** `propertyease/DESIGN_PROMPT.md` — was for a UAE product. Not the active design. Do not implement from it.
- **TypeScript types:** `src/lib/i18n.ts` (string keys)
- **Country config:** `src/context/CountryContext.tsx` (currency, locale, flag, capital)
- **Mockup screenshots:** stored in user's chat, not in repo. Reference for inspiration, not spec.

---

**Last updated:** 2026-08-27
**Maintained by:** @frontend-eng
**Schema version:** 1.0.0
