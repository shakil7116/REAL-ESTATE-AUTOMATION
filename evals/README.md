# PropertyEase — Eval Harness
# ────────────────────────────
# Cross-LLM quality tests. The whole reason this AI-OS survives engine
# swaps: when the proxy swaps `minimax-m3-free` for `kimi` or `deepseek`,
# we run `/eval` and get a regression number. No panic.

## What is an eval?

An eval is a single test case for an AI prompt. Each case has:
- **input** — the variables that get filled into the prompt template
- **expected** — what the output should look like (assertions, not exact strings)
- **weight** — how important is this case (0.0–1.0)

The harness runs every case, scores each 0.0–1.0, and reports:
- Per-prompt aggregate score
- Per-case pass/fail
- Regression vs the last baseline

## Layout

```
evals/
├── README.md                 ← you are here
├── _schema.json              ← JSON Schema for eval case files
├── runner.ts                 ← the harness (engine-agnostic)
├── baseline.json             ← last known-good scores per engine
└── cases/
    ├── copilot-system.json
    ├── ad-copy.json
    └── lead-scoring.json
```

## How scoring works

For each case, the runner:
1. Loads the prompt from `contracts/prompts/<name>.md`
2. Substitutes variables from the case's `input`
3. Calls the active LLM (read from `.claude/settings.json`)
4. Runs the case's `assertions` against the output
5. Computes a per-case score (passed_assertions / total_assertions)
6. Aggregates per-prompt score (weighted average)

A case is "passing" if score ≥ 0.7. A prompt is "passing" if
aggregate ≥ 0.7. A regression is any prompt that drops ≥ 0.05 from
baseline.

## Adding a new eval case

1. Open `evals/cases/<prompt>.json`
2. Add a new entry to the `cases` array
3. Specify `input`, `expected`, `assertions`, `weight`
4. Run `npm run eval` to verify
5. If a new prompt is needed, also add `contracts/prompts/<name>.md`

## Adding a new prompt

You must add at least 3 cases:
- 2 happy path (different scenarios)
- 1 edge case
- (recommended) 1 adversarial — known-bad input that should be rejected/handled

## Engine swap procedure

When the LLM engine changes:

1. Update `.claude/settings.json` — change `ANTHROPIC_DEFAULT_OPUS_MODEL`
2. Run `npm run eval`
3. Compare against `evals/baseline.json` for the new engine
4. If score ≥ 0.7: update `evals/baseline.json`, ship
5. If score < 0.7: roll back, write `memory/incidents/`, investigate

## Why this works on any LLM

- The eval cases test **behavior** (does it return JSON? does it match the schema? does it refuse unsafe input?), not exact strings
- Assertions are structural: regex, JSON shape, length, presence of required fields
- The runner calls the LLM via a single function (`callLLM`) that the engine swap can rewire
- No model-specific assumptions

## CI integration

The eval harness runs in CI on every PR. A failing eval blocks the PR.
See `.github/workflows/ci.yml` (when added).

---

**Last updated:** 2026-08-26
**Maintained by:** @ai-eng
