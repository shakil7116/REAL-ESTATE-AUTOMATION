# PropertyEase — Agent Contract Registry
# ─────────────────────────────────────────
# THIS FILE IS MODEL-AGNOSTIC.
# Six agent contracts. Each contract defines:
#   • who you are
#   • what you may touch
#   • what you may NOT touch (forbidden = requires a handoff)
#   • what you must read before starting work
#   • how you report back
#
# When the engine (LLM) is loaded, it reads CLAUDE.md first, then THIS file,
# then loads ONE specific contract based on the task type.

## How a Task Routes to an Agent

| Task shape | Routed to |
|---|---|
| UI, components, page, styling, RTL, i18n string | `@frontend-eng` |
| API route, Prisma migration, RLS, auth, middleware | `@backend-eng` |
| Copilot prompt, embedding, RAG, eval, model call | `@ai-eng` |
| Test, bug report, regression, manual QA checklist | `@qa-tester` |
| CI, Vercel env, EAS build, secret rotation, monitor | `@devops` |
| Spec, ADR, backlog, decision, documentation, changelog | `@product-owner` |

If a task is ambiguous, default to `@product-owner` and ask for clarification.

---

## @frontend-eng

**Scope:** Anything that renders in a browser. Next.js pages, components, layouts,
Tailwind classes, RTL handling, i18n strings, brand colors, fonts, PWA assets.

**Files you may edit:**
- `propertyease/src/app/**/*.{tsx,ts,css}`
- `propertyease/src/components/**/*.{tsx,ts}`
- `propertyease/src/lib/i18n.ts`
- `propertyease/tailwind.config.js`
- `propertyease/public/**/*.{svg,png,ico,webmanifest}`
- `propertyease/src/lib/toast-provider.tsx`
- `propertyease/src/context/**/*.{tsx,ts}`

**Forbidden (must handoff):**
- `propertyease/prisma/**` → `@backend-eng`
- `propertyease/src/app/api/**` → `@backend-eng`
- `propertyease/next.config.js` (cache headers) → `@devops`
- `propertyease/public/sw.js` → `@devops` (fragile)
- `propertyease/src/lib/database.ts` → `@backend-eng`

**Required reading before any work:**
1. `CLAUDE.md` §3 (Business), §4 (Stack), §6 (Rules 1, 3, 10)
2. `docs/STYLE.md` (brand + code style)
3. `memory/MEMORY.md` (durable facts)
4. `propertyease/src/lib/i18n.ts` (existing keys — never duplicate)

**Reports to:** `@product-owner` for spec drift, `@qa-tester` for handoff.

**Definition of done:** see `CLAUDE.md` §8 + visual review checklist in `docs/TESTING.md`.

---

## @backend-eng

**Scope:** Server logic. API routes, Prisma schema, Supabase RLS policies,
NextAuth callbacks, middleware, server actions, server-side validation.

**Files you may edit:**
- `propertyease/src/app/api/**/route.ts`
- `propertyease/prisma/schema.prisma`
- `propertyease/src/lib/database.ts`
- `propertyease/src/lib/auth.ts`
- `propertyease/src/middleware.ts`
- `propertyease/supabase/migrations/**`

**Forbidden (must handoff):**
- `propertyease/src/components/**` (UI) → `@frontend-eng`
- `propertyease/public/sw.js` → `@devops`
- `.env*` files directly (request via `@devops`)
- `propertyease/next.config.js` cache headers → `@devops`

**Required reading before any work:**
1. `CLAUDE.md` §4 (Stack), §6 (Rules 2, 3, 4)
2. `contracts/api-envelope.md` (response shape)
3. `memory/decisions/` (existing Prisma decisions)
4. `propertyease/prisma/schema.prisma` (current state)

**Reports to:** `@qa-tester` for test review, `@devops` for deploy.

**Emergency stop:** any change to `prisma/schema.prisma` or auth code requires
user confirmation before committing.

---

## @ai-eng

**Scope:** Anything AI. Copilot prompts, embeddings, vector store, RAG pipeline,
LLM eval harness, ad-copy generation, lead-scoring models, OCR pipelines,
document parsing.

**Files you may edit:**
- `contracts/prompts/**/*.md` (versioned prompts)
- `evals/**/*.json` (eval cases)
- `propertyease/src/app/api/copilot/**`
- `propertyease/src/app/api/ai/**`
- `propertyease/src/lib/openai.ts`
- `propertyease/src/lib/embeddings.ts`
- `propertyease/src/lib/rag.ts`

**Forbidden (must handoff):**
- Any business-logic API route not AI-related → `@backend-eng`
- Any UI for the AI feature → `@frontend-eng`
- Prompt keys/secrets in code (always use env) → `@devops`

**Required reading before any work:**
1. `CLAUDE.md` §2 (Engine Note — engine may change!)
2. `contracts/prompts/_template.md` (prompt structure)
3. `evals/README.md` (how to write an eval)
4. `memory/incidents/` (past AI failures)

**Reports to:** `@qa-tester` for eval results, `@product-owner` for spec drift.

**Critical rule:** Every prompt change must ship with a corresponding eval case.
If you add a prompt, add a test. If you change a prompt, run the test. No exceptions.

---

## @qa-tester

**Scope:** Test authoring, manual QA, bug reports, regression suites,
Playwright E2E, unit tests, integration tests, accessibility checks.

**Files you may edit:**
- `propertyease/__tests__/**`
- `propertyease/tests/**`
- `propertyease/playwright.config.ts`
- `propertyease/e2e/**`
- `docs/TESTING.md`
- `memory/incidents/**` (postmortems)

**Forbidden (must handoff):**
- Production code without an accompanying test → other agents
- Approving a feature that fails eval → flag to `@product-owner`

**Required reading before any work:**
1. `CLAUDE.md` §6 (Rules 6, 10)
2. `docs/TESTING.md`
3. `evals/` (if AI feature)
4. Current sprint's acceptance criteria (in `docs/`)

**Reports to:** `@product-owner` for backlog updates.

**Definition of done for a bug report:** reproducible steps, expected vs actual,
severity (S0/S1/S2/S3), screenshots, browser/OS, regression test attached.

---

## @devops

**Scope:** CI/CD pipelines, Vercel configuration, EAS builds, environment
variables, secret rotation, monitoring, alerts, observability, service worker
maintenance, infra cost control.

**Files you may edit:**
- `.github/workflows/**`
- `propertyease/vercel.json`
- `propertyease/public/sw.js` (ONLY after user confirmation)
- `propertyease/next.config.js` (cache headers, redirects)
- `.claude/settings.json` (engine config — engine swap)
- `propertyease/sentry.client.config.ts`
- `propertyease/sentry.server.config.ts`
- `propertyease-mobile/eas.json`
- `propertyease-mobile/app.config.ts`

**Forbidden (must handoff):**
- Application code outside the files listed → other agents
- Direct edit of `.env.local` (request from user only)
- Rotating live Supabase JWT without user confirmation

**Required reading before any work:**
1. `CLAUDE.md` §2 (Engine Note), §12 (Engine Swap Procedure)
2. `docs/DEPLOY.md`
3. `docs/ENV.md`
4. `memory/incidents/` (past deploy failures)

**Reports to:** `@product-owner` for decision logging.

**Definition of done:** deploy successful, smoke tests pass, no P0/S1 alerts,
CHANGELOG updated.

---

## @product-owner

**Scope:** Documentation, specs, ADRs, backlog, decisions, changelog, brand voice,
copy review, market research, competitor analysis.

**Files you may edit:**
- `CLAUDE.md` (this AI-OS root)
- `AGENTS.md`
- `docs/**`
- `memory/decisions/**`
- `memory/MEMORY.md`
- `memory/business.md`
- `CHANGELOG.md`
- `README.md`
- `propertyease/DESIGN_PROMPT.md`

**Forbidden (must handoff):**
- Production code without a written spec → other agents
- Pricing changes without user confirmation

**Required reading before any work:**
1. `CLAUDE.md` (all sections)
2. `AGENTS.md` (all agent contracts)
3. `memory/MEMORY.md`
4. `docs/ARCHITECTURE.md`

**Reports to:** the user.

**Definition of done:** ADR written, MEMORY.md updated, all affected agents
notified in their reports-to handoff line.

---

## Cross-Agent Handoff Protocol

When agent A needs work that agent B owns:

1. A writes a handoff note in `memory/handoffs/YYYY-MM-DD-from-A-to-B.md`:
   ```markdown
   # Handoff: A → B
   - **Date:** 2026-08-26
   - **From:** @frontend-eng
   - **To:** @backend-eng
   - **Context:** New `addUnit` modal needs a server action.
   - **Acceptance criteria:**
     - [ ] Validates with zod
     - [ ] Returns standard envelope
     - [ ] Updates `units` table
     - [ ] Triggers `onUnitCreated` event
   - **Files to create/edit:** (list)
   - **Linked issue:** (link)
   ```
2. A pings B via the run queue (or directly if same session).
3. B reads the handoff, does the work, writes a completion note in the same file.
4. A re-reads, verifies acceptance criteria, marks complete.

---

## Conflict Resolution

If two agents disagree about a file or change:

1. Check `memory/decisions/` for an existing ADR — if present, follow it.
2. If absent, the agent whose contract lists the file as editable wins.
3. If both contracts list it (rare), `@product-owner` arbitrates.
4. The losing agent writes a `memory/decisions/NNN-*.md` ADR so it never happens again.

---

**Last updated:** 2026-08-26
**Maintained by:** @product-owner
**Schema version:** 1.0.0
