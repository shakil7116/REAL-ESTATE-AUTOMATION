# Handoff: @product-owner → @qa-tester
# Date: 2026-09-08

# Handoff: Mobile QA Checklist — Login + Payment Flow

## Date
2026-09-08

## Context
The mobile app (Expo SDK 52) has no automated or manual test coverage yet.
Before v1.1 ships to any real users, we need a regression-safe QA checklist
covering the two highest-value user journeys: **login** and **recording a
payment**. These are the flows a property manager in Qatar actually uses on
the road. The web has NextAuth session tests; the mobile auth path has none.

## Acceptance Criteria
- [ ] Checklist written to `docs/TESTING.md` (create file if absent)
- [ ] Login flow: 5 steps minimum (open app → see login → enter credentials → submit → verify dashboard loads)
- [ ] Payment flow: 5 steps minimum (navigate to payments → select tenant → enter amount → confirm → verify ledger update)
- [ ] Each step has expected vs actual column structure (for human fill-in)
- [ ] Includes RTL check: verify text direction flips when language is set to Arabic
- [ ] Includes QAR-only check: no AED appears anywhere in the flow
- [ ] Format: markdown table per flow, numbered steps, severity tags (P0/P1/P2)
- [ ] File is readable and follows project style from `docs/STYLE.md`

## Files to Create/Edit
- `docs/TESTING.md` — create new; add Mobile Login + Payment sections

## Out of Scope
- Web app test coverage (handled separately by vitest)
- Playwright E2E (deferred to v1.2)
- Copilot flow testing (separate checklist needed later)
- Any automated test code (that's a different deliverable)

## Linked Issues
- Sprint item #6: `docs/SPRINT-2026-Q3.md` line ~144
- Incident: `memory/incidents/2026-09-08-supabase-masks-fallback.md` (data hygiene prerequisite)

---

## Completion (filled by receiving agent)

**Completed by:** @qa-tester
**Date:** YYYY-MM-DD
**Notes:**
**Verified by:** @product-owner
