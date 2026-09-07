# Decision 2026-09-07: Agent-Based Automation Workflow for Development

## Decision
Adopt an agent orchestration workflow where each development task is assigned to the appropriate agent based on the contract registry in `AGENTS.md`.

## Context
PropertyEase is a multi-component system (web app, mobile app, AI layer, infrastructure). Rather than one agent handling everything, we assign tasks according to domain expertise:

| Task Type | Agent |
|---|---|
| UI/UX, components, pages, RTL, i18n | @frontend-eng |
| API routes, Prisma, auth, middleware | @backend-eng |
| Copilot prompts, evals, AI features | @ai-eng |
| Tests, QA, bug reports | @qa-tester |
| CI/CD, deploy, env config | @devops |
| Specs, docs, decisions, backlog | @product-owner |

## Decision
When a new development cycle begins, the product owner (this session's orchestrator role) will:
1. Identify the current sprint priorities
2. Create handoff documents for each agent task
3. Execute agent subtasks sequentially or in parallel as appropriate
4. Verify acceptance criteria before marking complete
5. Update `docs/CHANGELOG.md` and `memory/MEMORY.md` upon completion

## Rationale
- Parallelizes work across domains
- Ensures each change follows the correct contract boundaries
- Reduces context-switching overhead
- Creates clear audit trail via handoff notes

## Related
- `AGENTS.md` — full agent contracts
- `docs/SPRINT-2026-Q3.md` — current sprint priorities
- `memory/MEMORY.md` — index of durable facts
