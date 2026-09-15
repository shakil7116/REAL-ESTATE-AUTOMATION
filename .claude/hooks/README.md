# Hooks
# ─────
# Automated actions that fire on events. Pre-commit, post-eval, etc.

```
hooks/
├── README.md
├── pre-commit.sh         ← blocks secrets, runs quick tests
└── post-eval.sh          ← records eval results to memory
```

## Hook structure

Hooks are simple shell scripts. They run on:
- `pre-commit` — before git commit
- `post-eval` — after eval harness runs
- `pre-deploy` — before deploy

Add new hooks in this folder, then wire them in the relevant tool
(`.git/hooks/`, package.json scripts, CI workflow, etc).

## Adding a new hook

1. Add a `.sh` file in this folder
2. Make it executable: `chmod +x .claude/hooks/<name>.sh`
3. Add a row to this README
4. Wire it into the relevant tool
