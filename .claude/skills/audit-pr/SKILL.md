# Skill: audit-pr
# ─────────────
# Invoke: "Use the audit-pr skill" or "/skill audit-pr"
# Owner: @qa-tester
# Use when: reviewing a PR before merge

## Purpose
A consistent, contract-based PR review that catches the most common
PropertyEase regressions. Use this on every PR.

## Pre-flight

1. Read the PR description and linked spec/ADR
2. Read `CLAUDE.md` §6 (the 10 rules)
3. Read the contracts (`contracts/`)
4. Read `memory/MEMORY.md` for context

## Audit checklist

### 1. Contract compliance

- [ ] Every new API route returns the standard envelope (`{ ok, data, error }`)
- [ ] Every API route validates input with zod
- [ ] Every error response uses a canonical error code
- [ ] Every new i18n string is in BOTH `en` and `ar` blocks

### 2. The 10 rules

- [ ] **Rule 1:** JSDoc header on new components
- [ ] **Rule 2:** zod input validation, standard error envelope
- [ ] **Rule 3:** All UI strings via `t()` from i18n.ts
- [ ] **Rule 4:** New env vars in `.env.example` AND `docs/ENV.md`
- [ ] **Rule 5:** Conventional commit message
- [ ] **Rule 6:** Tests for auth, payments, lease, tickets
- [ ] **Rule 7:** `reactStrictMode` still ON
- [ ] **Rule 8:** No `no-store` on `/_next/static/*`
- [ ] **Rule 9:** No secrets committed
- [ ] **Rule 10:** RTL works on new components

### 3. Cross-cutting concerns

- [ ] **Auth:** Every protected route checks session
- [ ] **Authorization:** Users can only access their own data
- [ ] **Rate limiting:** Public routes are rate-limited
- [ ] **SQL injection:** No raw SQL, Prisma only
- [ ] **XSS:** No `dangerouslySetInnerHTML` with user content
- [ ] **i18n:** Tested in both `en` and `ar` directions

### 4. Specific to PR type

**For UI PRs:**
- [ ] Mobile-responsive (tested at 375px width)
- [ ] Dark mode works
- [ ] RTL works
- [ ] All interactive elements have hover/focus states
- [ ] No console errors

**For API PRs:**
- [ ] Tests cover happy path + 2+ error cases
- [ ] Auth check is FIRST in every route
- [ ] Database queries are indexed
- [ ] No N+1 queries (use `include` / `select` in Prisma)

**For AI PRs:**
- [ ] Prompt version bumped
- [ ] Eval cases added/updated
- [ ] Eval passes locally
- [ ] Prompt file in `contracts/prompts/`, not in code

**For DevOps PRs:**
- [ ] No secret in code
- [ ] No new env var without `.env.example` + `docs/ENV.md`
- [ ] CI workflow tested
- [ ] Rollback plan documented

### 5. Documentation

- [ ] `CHANGELOG.md` updated
- [ ] New patterns written to `memory/patterns/`
- [ ] New decisions written to `memory/decisions/`
- [ ] New incidents written to `memory/incidents/`

## Verdict

- ✅ **Approve** — all checks pass
- 💬 **Comment** — minor issues, address in follow-up
- 🔄 **Request changes** — must address before merge
- 🚫 **Block** — contract violation or security issue

## Output format

Write your review as:

```markdown
## audit-pr: <PR title>

**Verdict:** ✅ / 💬 / 🔄 / 🚫

**Contract compliance:** X/4
**10 rules:** X/10
**Cross-cutting:** X/6
**Doc:** X/4

**Blocking issues:**
- …

**Non-blocking suggestions:**
- …

**Praise:**
- …
```

## Reference

- `CLAUDE.md` §6 — the 10 rules
- `contracts/api-envelope.md` — API contract
- `contracts/i18n-keys.md` — i18n contract
- `memory/MEMORY.md` — durable facts
