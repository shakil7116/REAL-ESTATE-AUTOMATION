# /eval — Run the eval harness
# ───────────────────────────
# Run all LLM eval cases, compare against baseline, report regressions.

## Procedure

1. Read `.claude/settings.json` to determine the active engine
2. Run: `cd propertyease && npm run eval`
3. For each prompt in `contracts/prompts/`:
   - Load the prompt
   - Load the eval cases from `evals/<prompt>.json`
   - Run each case
   - Compare against expected output
   - Score 0.0–1.0
4. Aggregate scores, report regressions vs the last baseline
5. If score < 0.7 on any prompt, flag it as a regression

## Output format

```
## /eval results

Engine: minimax-m3-free (via router.bynara.id)
Date: 2026-08-26

| Prompt | Score | Δ vs baseline |
|---|---|---|
| copilot-system | 0.92 | +0.02 |
| ad-copy | 0.88 | -0.04 ⚠️ |
| lead-scoring | 0.85 | 0.00 |

✅ No regressions
⚠️ ad-copy dropped 0.04 — investigate before shipping
```

## When score drops

If a prompt score drops ≥ 0.05 from baseline:
1. Do NOT auto-fix
2. Report the regression to @ai-eng
3. Suggest: prompt tweak, model upgrade, or revert
