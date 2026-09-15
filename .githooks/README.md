# ─────────────────────────────────────────────────────────────────
# Git hooks directory.
# Symlink the pre-commit hook into .git/hooks/ during setup.
# ─────────────────────────────────────────────────────────────────

# Setup (one-time, per developer):
#   git config core.hooksPath .githooks
#   chmod +x .githooks/pre-commit .githooks/post-eval
#
# After this, `git commit` will automatically run pre-commit
# (blocks secrets, runs smoke tests).
#
# This file is intentionally empty — git won't track empty dirs.

Pre-commit hook: .claude/hooks/pre-commit.sh
Post-eval hook:  .claude/hooks/post-eval.sh
