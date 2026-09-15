# Skill: new-feature
# ────────────────
# Invoke: "Use the new-feature skill" or "/skill new-feature"
# Owner: @product-owner (spec), @backend-eng + @frontend-eng (impl), @qa-tester (verify)
# Use when: shipping a new user-facing feature from spec to PR

## Purpose
End-to-end procedure for taking a feature from a written spec to a
merged PR. Ensures every feature is specced, contracted, tested, and
documented before merge.

## Pre-flight

1. Read `CLAUDE.md` (full)
2. Read `AGENTS.md` for your role
3. Read `memory/business.md` (why this feature exists)
4. Confirm the spec exists in `docs/features/<feature-name>.md`

## Procedure

### Step 1: Spec review (@product-owner)

- Read the spec
- Confirm it answers: Who? What? Why? Success metric? Out of scope?
- If anything is ambiguous, ASK THE USER before coding
- Add the spec to `docs/features/` (if not already there)

### Step 2: ADR if architectural (@product-owner)

If the feature changes:
- Data model
- API contract
- Auth model
- i18n structure
- Pricing

Then write an ADR in `memory/decisions/` BEFORE coding.

### Step 3: Implementation (@backend-eng + @frontend-eng)

Backend:
- Prisma migration (if needed) — request user approval
- API routes (zod + envelope)
- Database helpers
- Auth checks

Frontend:
- i18n strings (en + ar)
- Page + components
- RTL handling
- Form modal (use `memory/patterns/form-modal.md`)

### Step 4: Eval if AI-facing (@ai-eng)

If the feature calls an LLM, write eval cases in `evals/<feature>.json`
and ensure they pass.

### Step 5: Tests (@qa-tester)

- Unit tests for helpers
- API tests for routes
- Component tests for UI
- E2E test for the user flow
- Manual QA checklist

### Step 6: Documentation (@product-owner)

- `CHANGELOG.md` entry
- `docs/CHANGELOG.md` (if user-facing)
- Update relevant skill/pattern docs

### Step 7: PR (@product-owner opens, all agents review)

PR template:

```markdown
## What
<one paragraph>

## Why
<links to spec, ADR, or user story>

## How to test
<step-by-step>

## Screenshots
<if UI>

## Checklist
- [ ] Spec reviewed
- [ ] ADR written (if applicable)
- [ ] i18n strings added (en + ar)
- [ ] RTL tested
- [ ] Tests pass
- [ ] CHANGELOG updated
- [ ] Conventional commit message
```

## Definition of done

- [ ] All 7 steps complete
- [ ] PR reviewed by ≥ 1 agent from a different role
- [ ] All CI checks green
- [ ] User approved the PR

## Common pitfalls

- ❌ Coding before spec is approved
- ❌ Forgetting i18n (only adding English)
- ❌ Skipping RTL test
- ❌ PR without screenshots (for UI)
- ❌ "I'll add tests later" — no, add them now
