# PropertyEase — Claude Configuration
# ─────────────────────────────────────
# This directory contains skills, commands, and hooks for the
# PropertyEase AI-OS. Every file here is model-agnostic — written
# to work the same way on any LLM.

## Layout

```
.claude/
├── settings.json          ← engine config (managed by @devops only)
├── skills/                ← reusable capabilities
│   ├── README.md
│   ├── add-entity/        ← add a new entity (Property, Unit, etc.)
│   ├── new-feature/       ← feature from spec to PR
│   └── audit-pr/          ← review a PR against contracts
├── commands/              ← slash-style triggers
│   ├── README.md
│   ├── test.md
│   ├── eval.md
│   └── ship.md
└── hooks/                 ← automated pre/post actions
    ├── README.md
    ├── pre-commit.sh      ← blocks secrets + runs tests
    └── post-eval.sh       ← records eval results
```

## Reading order

1. `settings.json` — engine config (don't touch unless swapping engine)
2. `skills/README.md` — what skills exist and when to invoke them
3. `commands/README.md` — slash commands
4. `hooks/README.md` — automation

## Rule of thumb

- **Skill** = "I want to do X, walk me through it" (interactive)
- **Command** = "do X right now" (one-shot)
- **Hook** = "whenever Y happens, do Z" (automated)

If you can describe your task as a skill invocation, prefer that. It's
more reliable than freeform prompt engineering.

---

**Last updated:** 2026-08-26
**Maintained by:** @devops
