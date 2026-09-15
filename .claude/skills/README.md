# Skills
# ──────
# A skill is a multi-step procedure the LLM can invoke. Skills are
# model-agnostic — they describe the steps, not the prompt.
# Invoke a skill with: "Use the add-entity skill" or "/skill add-entity"

```
skills/
├── README.md             ← you are here
├── add-entity/           ← scaffold a new entity (Property, Unit, etc.)
├── new-feature/          ← spec → code → tests → PR
└── audit-pr/             ← review a PR against contracts + rules
```

## When to use a skill

- The task matches a known, repeatable procedure
- You want the LLM to follow a checklist, not improvise
- Multiple agents need to do the same thing the same way

## When NOT to use a skill

- The task is one-off and creative
- The skill doesn't exist and the cost of creating it is higher than the value
- You're debugging — improvise, don't follow a checklist

## Skill structure

```
skills/<skill-name>/
├── SKILL.md          ← required: the procedure (this is what the LLM reads)
├── checklist.md      ← optional: human-readable checklist
└── examples/         ← optional: example invocations
```

## Adding a new skill

1. Create the folder: `.claude/skills/<skill-name>/`
2. Write `SKILL.md` with a clear procedure
3. Add a row to this README
4. Notify @devops to add it to the relevant agent's "Required reading" list

---

**Last updated:** 2026-08-26
