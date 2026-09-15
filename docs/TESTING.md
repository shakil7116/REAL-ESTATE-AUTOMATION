# PropertyEase — Testing Guide

> **How to test.** Every feature ships with a test. Every bug has a repro.
> This file is the canonical reference for QA process.

---

## Test Suites

| Suite | Command | When to run | Pass criterion |
|---|---|---|---|
| Unit tests | `npm run test` (vitest) | Every commit; CI | 9/9 pass |
| Eval harness | `PE_EVAL_STUB=1 npm run eval` (root) | Every AI prompt change | 14/14 pass |
| Build | `npm run build` (propertyease/) | Before any deploy | Exit 0 |
| Mobile smoke | Expo Go → open each screen | Before any mobile PR | No crash, no console error |

---

## Manual QA Checklists

### Login Flow (Mobile)

| # | Step | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Open app (no session) | Redirected to login screen | | ⬜ |
| 2 | Enter valid email/password (`demo@test.com` / `password`) | Login button enabled | | ⬜ |
| 3 | Tap "Sign In" | Redirected to dashboard; bottom tabs visible | | ⬜ |
| 4 | Verify header shows user name | Name from session displayed | | ⬜ |
| 5 | Close app, reopen | Remains logged in (no re-login needed) | | ⬜ |
| 6 | Enter wrong password | Error message shown; stays on login screen | | ⬜ |
| 7 | Tap "Sign Out" in Settings | Returns to login; session cleared | | ⬜ |

**Severity tags:** P0 = blocks release · P1 = major workflow broken · P2 = minor UX gap

### Payment Flow (Mobile)

| # | Step | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Navigate to Payments tab | List of payments loads (16 rows expected) | | ⬜ |
| 2 | Tap "+" FAB to add payment | Create form opens | | ⬜ |
| 3 | Select a tenant from dropdown | Tenant list populates (8 names expected) | | ⬜ |
| 4 | Enter amount `5000`, select date, tap Save | Payment created; row appears in list with QAR prefix | | ⬜ |
| 5 | Verify currency symbol | Shows "QAR", never "AED" | | ⬜ |
| 6 | Tap payment row | Detail view opens with full info | | ⬜ |
| 7 | Switch language to العربية in Settings | All labels flip to Arabic RTL | | ⬜ |
| 8 | Repeat step 4 in Arabic mode | Amount shows with Arabic numerals or consistent QAR label | | ⬜ |

### RTL Check (Mobile)

| # | Step | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Set language to Arabic in Settings | App direction flips to RTL | | ⬜ |
| 2 | Check tab bar | Icons and labels read right-to-left | | ⬜ |
| 3 | Check dashboard cards | Revenue card right-aligned, stats flow RTL | | ⬜ |
| 4 | Check settings page | Profile avatar on right, text flows RTL | | ⬜ |
| 5 | Check copilot chat | Messages bubble left/right swap correctly in RTL | | ⬜ |

### Data Integrity Check (Web)

| # | Step | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Visit `/properties` | Exactly 4 properties listed (Al Mansura, Asmaco, Thumama, Pearl) | | ⬜ |
| 2 | Visit `/dashboard` | Revenue figure is not NaN; occupancy shows a percentage | | ⬜ |
| 3 | Visit `/tenants` | 8 tenants listed, all with valid email/phone | | ⬜ |
| 4 | Visit `/payments` | 16 payment records, all in QAR | | ⬜ |
| 5 | Visit `/maintenance` | 6 tickets, at least one open/in-progress | | ⬜ |
| 6 | Search for "Dubai" or "UAE" anywhere | Zero results | | ⬜ |
| 7 | Open Copilot and ask about rent collection | Real numbers from API, no fabricated figures | | ⬜ |

---

## How to Add a New Checklist Item

1. Identify the flow (login, payment, maintenance, etc.)
2. Add a numbered table row with: step description, expected behavior, actual (fill in after testing), status checkbox
3. Tag severity as P0/P1/P2 in the title or a column
4. Link any related incident in `memory/incidents/` if the item exists because of a past bug

---

## Runbooks

### Server not loading clean data
```bash
# Kill all node processes on port 3000
# Then restart:
cd propertyease
npm run dev
# Verify clean state:
curl http://localhost:3000/api/properties
# Should return exactly 4 Qatar properties
```

### Eval harness failing
```bash
cd ..  # go to project root
PE_EVAL_STUB=1 npx tsx evals/runner.ts
# If real LLM call fails: ensure OPENAI_API_KEY is set
# If stub fails: check contracts/prompts/ for syntax errors
```

---

**Maintained by:** @qa-tester
**Last updated:** 2026-09-08
