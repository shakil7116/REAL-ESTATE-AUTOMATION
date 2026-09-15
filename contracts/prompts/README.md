# PropertyEase — AI Prompts
# ─────────────────────────
# All AI prompts live here, versioned, with eval cases.
# If a prompt is hard-coded in `src/`, that's a bug.

```
contracts/prompts/
├── README.md             ← you are here
├── _template.md          ← standard prompt structure
├── copilot-system.md     ← v1 of the Copilot system prompt
├── ad-copy.md            ← v1 of the ad-copy generator
└── lead-scoring.md       ← v1 of the lead-scoring prompt
```

## Versioning

Each prompt file follows semver:

- **MAJOR** — behavior change (e.g., switch from JSON output to freeform)
- **MINOR** — added field, new example, expanded scope
- **PATCH** — typo fix, no behavior change

When you change a prompt:
1. Bump the version
2. Update the eval cases in `evals/`
3. Run `npm run eval` to compare
4. Update the prompt's "Last updated" + changelog
5. Write a decision note in `memory/decisions/` if MAJOR

## Why prompts live here (not in code)

1. **Testable** — eval cases in `evals/` reference the prompt by ID
2. **Diffable** — PR reviewers can see exactly what changed
3. **Rollbackable** — git revert restores both the prompt and the eval
4. **Engine-independent** — works the same on Claude, GPT, Kimi, etc.
5. **Documented** — the prompt is the spec; the code is the impl

## Loading a prompt at runtime

```typescript
// propertyease/src/lib/prompts.ts
import { readFile } from 'fs/promises';
import path from 'path';

const PROMPTS_DIR = path.join(process.cwd(), 'contracts', 'prompts');

export async function loadPrompt(name: string): Promise<string> {
  const file = path.join(PROMPTS_DIR, `${name}.md`);
  return readFile(file, 'utf-8');
}
```

## Adding a new prompt

1. Copy `_template.md` to `<your-prompt>.md`
2. Fill in the sections
3. Create eval cases in `evals/<your-prompt>.json`
4. Reference it from your code via `loadPrompt('your-prompt')`
5. Add a row to this README

## Changelog

- **2026-08-26** — Initial 3 prompts scaffolded (copilot, ad-copy, lead-scoring)
