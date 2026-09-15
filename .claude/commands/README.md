# Commands
# ────────
# Slash-style commands. One-shot actions, no procedure.
# Invoke: "/test" or "/eval" etc.

```
commands/
├── README.md
├── test.md           ← /test — run the test suite
├── eval.md           ← /eval — run the eval harness
└── ship.md           ← /ship — final pre-deploy checklist
```

## Command format

Each command is a single `.md` file. The LLM reads the file and follows
its instructions exactly. Commands are deterministic and short.

## Adding a new command

1. Add a `.md` file to this folder
2. Name it with a kebab-case verb: `deploy.md`, `rollback.md`, etc.
3. Keep it under 30 lines — if it's longer, it should be a skill
4. Add a row to this README

## Differences from skills

- **Skill** = interactive, multi-step, can ask questions
- **Command** = one-shot, deterministic, no questions

If your "command" needs to ask the user questions, it's a skill.
