#!/usr/bin/env bash
# post-eval.sh — Record eval results to memory/evals-history.md
# Wire via: package.json script "eval:post" or CI post-step

set -e

EVALS_DIR="${1:-evals}"
HISTORY_FILE="memory/evals-history.md"
DATE=$(date -u +"%Y-%m-%d %H:%M UTC")
ENGINE=$(grep -E 'ANTHROPIC_DEFAULT_OPUS_MODEL' .claude/settings.json 2>/dev/null | head -1 | cut -d'"' -f4 || echo "unknown")

mkdir -p memory

# Append a new entry
if [ ! -f "$HISTORY_FILE" ]; then
  cat > "$HISTORY_FILE" <<'EOF'
# Eval History
# ────────────
# Auto-populated by `.claude/hooks/post-eval.sh` after each `/eval` run.
# Do not edit by hand — append-only.

EOF
fi

cat >> "$HISTORY_FILE" <<EOF

## $DATE

**Engine:** $ENGINE
**Source:** $EVALS_DIR

EOF

# If eval results JSON exists, append summary
if [ -f "$EVALS_DIR/results.json" ]; then
  echo '```json' >> "$HISTORY_FILE"
  cat "$EVALS_DIR/results.json" >> "$HISTORY_FILE"
  echo '' >> "$HISTORY_FILE"
  echo '```' >> "$HISTORY_FILE"
fi

echo "✅ Eval results recorded to $HISTORY_FILE"
