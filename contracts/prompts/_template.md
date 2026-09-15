# Prompt: <name>
# ─────────────
# Version: 0.1.0
# Status: Draft | Active | Deprecated
# Last updated: YYYY-MM-DD
# Owner: @ai-eng
# Eval cases: evals/<name>.json
# Model: <engine-agnostic, e.g., "any LLM that supports system messages">

## Purpose
One sentence: what does this prompt do?

## Inputs
- `<input_name>` — type, description, required/optional
- `<input_name>` — type, description, required/optional

## Outputs
- Type (JSON / freeform / etc.)
- Schema (if structured)
- Example output

## System message

```
You are <role>...

<Task>
...
</Task>

<Constraints>
...
</Constraints>

<Output format>
...
</Output format>
```

## User message template

```
<variable 1>: {{input_1}}
<variable 2>: {{input_2}}

Please <do the thing>.
```

## Few-shot examples (if any)

### Example 1
- **Input:** …
- **Output:** …

### Example 2
- **Input:** …
- **Output:** …

## Failure modes
- What goes wrong if the model hallucinates?
- What's the worst-case output?
- How do we detect it?

## Eval cases
- See `evals/<name>.json`
- At minimum: 3 happy path, 2 edge case, 1 adversarial

## Changelog
- **0.1.0** (YYYY-MM-DD) — Initial draft
