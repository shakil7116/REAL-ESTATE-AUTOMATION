# ADR-002: v1 Ships Qatar-Only
# ──────────────────────────────

## Status
Accepted

## Date
2026-08-26

## Context
The original product vision targeted "UAE & GCC". The current layout,
metadata, i18n, and currency are all Qatar-specific. Forcing GCC support
into v1 would mean:
- 6 country support matrices
- 6 currency formatting rules
- 6+ locale variants (ar-AE, ar-QA, ar-SA, ar-KW, ar-BH, ar-OM)
- 6 payment-rail integrations
- 6 sets of brand colors per market

This is a 4× larger product surface for v1, and we have no validated
demand in any other GCC market.

## Decision
**v1 is Qatar-only.** The product is branded, marketed, and priced in
QAR for Qatar-based property managers. GCC expansion is a v2 feature
gated on validated demand in at least one other market.

**What this means concretely:**
- Default country: `Qatar`
- Default currency: `QAR` (ر.ق)
- Default locale: `en` or `ar` (no country locale variants in v1)
- Payment rails: PDC, QNB bank transfer, Ooredoo Mobile Money (Qatar only)
- Domain: `propertyease.qa`
- Marketing copy: Qatar-specific examples (Doha, Lusail, Al Rayyan)
- No country selector in v1 UI (it's hard-coded with a "Coming soon: GCC"
  badge in settings)

## Consequences
**Easier:**
- Single currency, single locale set, single payment rail integration
- Clear go-to-market narrative
- Faster to ship

**Harder:**
- Marketing site can't claim "GCC-wide"
- Future v2 migration must support multiple countries without breaking v1

## Alternatives Considered
- **Ship UAE + Qatar in v1:** rejected — doubles complexity, no validated
  UAE demand.
- **Ship GCC-wide (6 countries) in v1:** rejected — 6× the work, no
  validated demand in any non-Qatar market.
- **Make it fully multi-country but ship with only Qatar enabled:**
  considered, rejected — adds significant architecture complexity
  (country columns everywhere, country selectors in UI) for zero v1 value.

## Related
- `memory/business.md` — market focus
- `propertyease/src/app/layout.tsx` — Qatar-specific metadata
- `propertyease/src/lib/i18n.ts` — currency: QAR
- `propertyease/prisma/schema.prisma` — country defaults (update to "Qatar")
