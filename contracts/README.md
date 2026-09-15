# PropertyEase — Contracts Index
# ──────────────────────────────
# Contracts define the SHAPES of things that cross boundaries.
# If a value crosses an HTTP boundary, an LLM boundary, a language
# boundary, or a package boundary, it must conform to a contract here.

```
contracts/
├── README.md                 ← you are here
├── api-envelope.md           ← standard API response shape
├── i18n-keys.md              ← how to add a translation key
└── prompts/
    ├── README.md             ← how prompts are versioned
    ├── _template.md          ← standard prompt structure
    ├── copilot-system.md     ← v1 of the Copilot system prompt
    ├── ad-copy.md            ← v1 of the ad-copy generator
    └── lead-scoring.md       ← v1 of the lead-scoring prompt
```

## Why contracts exist

When the LLM engine changes (and it will), the only stable things are the
interfaces between systems. Contracts make those interfaces explicit,
documented, and testable.

## Rule: if you change a contract, you must

1. Update this file
2. Update the version number in the contract file
3. Run `npm run eval` (if AI-related)
4. Notify all consumers (in their agent contract "Required reading" list)
5. Write a decision note in `memory/decisions/` if the change is non-trivial

## Adding a new contract

1. Pick the right folder: `contracts/` (top-level for non-AI) or
   `contracts/prompts/` (for AI prompts).
2. Use a kebab-case filename: `my-new-contract.md`
3. Start with the template-style header (see existing files)
4. Add a row to the index above

---

**Last updated:** 2026-08-26
**Maintained by:** @product-owner
