# PropertyEase — Business Context
# ─────────────────────────────────────────
# Loaded by every agent at session start. Read this to understand the WHY
# behind every code change.

## The Company

**PropertyEase** is a SaaS platform for property managers in Qatar. We help
small-to-mid property managers (10–500 units) run their entire operation
from one dashboard: rent collection, maintenance ticketing, tenant
communication, vacancy marketing, and an AI Copilot.

## Why Qatar First

- **Proven market:** Real estate in Qatar is well-regulated, transactions
  happen on paper + WhatsApp, and property managers complain about the
  same three things: rent tracking, maintenance chaos, and vacancy fill-time.
- **No incumbent SaaS** has bilingual Arabic/English + RTL + QAR currency
  + local payment rails (PDC, bank transfer, Ooredoo Mobile Money).
- **Bilingual is a moat** — every Western SaaS (Buildium, AppFolio, Yardi)
  ignores Arabic. Local tools (Yakeen, Rased) are legacy and ugly.
- **GCC expansion is a v2 problem.** Don't solve it now.

## Pricing Tiers (QAR)

| Tier | Price | Units | Target user |
|---|---|---|---|
| Starter | Free | 10 | Solo landlord trying us out |
| Growth | 299 / month | 50 | Single property manager, 1–5 buildings |
| Enterprise | 799 / month | Unlimited | Property management company, 5+ buildings |

**No annual discount in v1.** Keep it simple. Add annual later.

## Brand Voice

- **Professional but warm.** Not corporate-stiff, not hipster-casual.
- **Bilingual is MSA-grade Arabic**, not literal Google Translate. Hire a
  native speaker to review before launch.
- **Pronouns:** We use "we" for the company and "you" for the user.
- **Never:** "synergy", "leverage", "best-in-class", "revolutionary".
- **Always:** plain English, active voice, present tense.

## Brand Identity

| Asset | Value |
|---|---|
| Primary | `#132B25` (dark green) |
| Accent | `#D97757` (coral) |
| Workspace bg | `#F6F8F6` |
| Text primary | `#0F1A17` |
| Text muted | `#5A6B66` |
| Border | `#E3E8E5` |
| Font (Latin) | Plus Jakarta Sans |
| Font (Arabic) | Cairo |
| Font (display) | Inter (headings only) |

See `propertyease/DESIGN_PROMPT.md` for the full design brief.

## Customer Personas

1. **Solo landlord (Starter):** Owns 1–2 buildings, does everything on
   WhatsApp. Needs: digital rent receipts, tenant contact list.
2. **Property manager (Growth):** Manages 5–20 buildings for 5–10 landlords.
   Needs: dashboard, payment tracking, maintenance tickets, basic reports.
3. **Property management company (Enterprise):** 20+ buildings, 5+ staff,
   500+ units. Needs: multi-user roles, advanced reports, ad campaigns,
   AI Copilot.

## Top 3 Jobs To Be Done

1. **"Stop chasing rent."** Track who paid, who didn't, send reminders
   automatically, generate PDC schedules.
2. **"Stop WhatsApping maintenance."** Tenants submit tickets with photos,
   contractors get assigned, status tracked, no more lost messages.
3. **"Fill vacancies faster."** AI-generated ad copy, multi-channel posting,
   lead tracking from first click to signed lease.

## Competitors We Beat

- **Yakeen** (legacy desktop, ugly, no cloud, no Arabic UX)
- **Rased** (clunky, expensive, no AI)
- **WhatsApp + Excel** (the actual incumbent — chaos, no audit trail)
- **Buildium / AppFolio** (no Arabic, no RTL, no QAR, US-centric)

## What We Don't Do (v1)

- No blockchain, no NFT, no metaverse
- No general CRM — only property + tenant
- No accounting — integrate with QuickBooks in v2
- No tenant credit scoring
- No international payments — Qatar only

## Success Metrics (90 days post-launch)

- 100 paying customers
- 50% MoM growth
- < 5% monthly churn
- 80% trial-to-paid conversion
- NPS > 40

---

**Last updated:** 2026-08-26
**Maintained by:** @product-owner
