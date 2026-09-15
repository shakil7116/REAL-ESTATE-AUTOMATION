# Handoff: @product-owner → @frontend-eng
# Date: 2026-09-08

# Handoff: Mobile Arabic RTL Support

## Date
2026-09-08

## Context
The web app is fully bilingual (English + Arabic) with complete RTL layout support.
The mobile app is English-only, creating a jarring gap for Arabic-speaking property
managers — the primary market per ADR-002 (Qatar). This sprint item (#2 in
`docs/SPRINT-2026-Q3.md`) must land before v1.1 ships. The settings screen already
has an EN/AR language toggle that calls `saveLanguage(next)` — it just needs the
i18n module and RTL direction switching wired up.

## Acceptance Criteria
- [ ] `propertyease-mobile/lib/i18n.ts` created with `en` and `ar` translations
      for all keys used across the 9 mobile screens (dashboard, properties,
      tenants, copilot, settings, payments, maintenance, login)
- [ ] Language toggle in `settings.tsx` (already exists) saves to AsyncStorage
      and triggers a re-render with correct direction
- [ ] `I18nManager.forceRTL(true)` called when language is Arabic
- [ ] Text direction flips: LTR → RTL and back, verified visually
- [ ] No hardcoded strings remain — every visible label uses `t('key')`
- [ ] Arabic copy is MSA-grade (professional, not literal translation)
- [ ] Works on both iOS and Android Expo Go

## Files to Create/Edit
- `propertyease-mobile/lib/i18n.ts` — NEW; translation module with `t(key, vars?)` function
- `propertyease-mobile/app/settings.tsx` — wire saved language to I18nManager
- `propertyease-mobile/app/_layout.tsx` — call `I18nManager.forceRTL()` on load based on stored language
- All 9 screen files — replace hardcoded strings with `t('key')` calls

## Out of Scope
- Web app i18n changes (already complete)
- Right-to-left icon mirroring beyond what RN I18nManager handles
- Platform-specific RTL quirks beyond basic text flow
- Adding new UI elements (only translate existing ones)

## Linked Issues
- Sprint item #2: `docs/SPRINT-2026-Q3.md` line ~109
- Web i18n reference: `propertyease/src/lib/i18n.ts` (follow same key structure)
- Brand: Cairo font for Arabic, Plus Jakarta Sans for Latin

---

## Completion (filled by receiving agent)

**Completed by:** @frontend-eng
**Date:** YYYY-MM-DD
**Notes:**
**Verified by:** @product-owner
