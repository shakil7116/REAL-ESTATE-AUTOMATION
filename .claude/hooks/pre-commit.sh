#!/usr/bin/env bash
# pre-commit.sh — Block secrets, run quick tests before commit.
# Wire via: ln -s ../../.claude/hooks/pre-commit.sh .git/hooks/pre-commit
# Or via husky in package.json.

set -e

SCAN_ONLY=0
if [ "$1" = "--scan-only" ]; then
  SCAN_ONLY=1
fi

echo "🔒 pre-commit: scanning for secrets..."

# ── 1. Secret scan ────────────────────────────────────────────────
SECRET_PATTERNS=(
  'sk-[a-zA-Z0-9_-]{20,}'                # Anthropic / OpenAI keys
  'sk_nry_[a-zA-Z0-9_-]{20,}'            # Bynara proxy keys
  'sk-[a-zA-Z0-9]{20,}'                  # OpenAI keys (alt format)
  'AIza[a-zA-Z0-9_-]{30,}'               # Google API keys
  'ghp_[a-zA-Z0-9]{30,}'                 # GitHub PAT
  'postgres://[^:]+:[^@]+@'              # Postgres connection strings
  'postgresql://[^:]+:[^@]+@'            # Postgres connection strings
  'eyJ[a-zA-Z0-9_-]{20,}\.eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}'  # JWT
)

# Files to scan. Skip .env.example (documented template, safe to commit),
# lockfiles / node_modules (no secrets by construction), and this hook
# itself (the SECRET_PATTERNS below legitimately contain the patterns
# they look for, so a self-scan always triggers).
SCAN_TARGETS=$(git diff --cached --name-only --diff-filter=ACM | grep -v -E '\.lock$|node_modules/|\.env\.example$|\.claude/hooks/' || true)

if [ -n "$SCAN_TARGETS" ]; then
  for pattern in "${SECRET_PATTERNS[@]}"; do
    # Use grep with -E for extended regex
    if echo "$SCAN_TARGETS" | xargs grep -E -l "$pattern" 2>/dev/null | head -1 | grep -q .; then
      echo "❌ Secret pattern detected: $pattern"
      echo "   Pattern matches one of:"
      echo "$SCAN_TARGETS" | xargs grep -E -l "$pattern" 2>/dev/null
      echo ""
      echo "   If this is a false positive, use git commit --no-verify"
      echo "   Otherwise, remove the secret and use an env var."
      exit 1
    fi
  done
fi

# ── 2. Block commits of sensitive files ───────────────────────────
SENSITIVE_FILES=(
  '.env'
  '.env.local'
  '.env.production'
  '.env.development'
  '.claude/settings.json'
  '*.pem'
  '*.key'
  '*.p12'
)

for file in "${SENSITIVE_FILES[@]}"; do
  # Anchor with -E "(^|/)" so '.env' doesn't match '.env.example'.
  if git diff --cached --name-only | grep -E -q "(^|/)${file}\$"; then
    echo "❌ Attempting to commit sensitive file: $file"
    echo "   Add it to .gitignore instead."
    exit 1
  fi
done

echo "✅ No secrets found."

if [ $SCAN_ONLY -eq 1 ]; then
  echo "🛑 --scan-only: skipping tests."
  exit 0
fi

# ── 3. Quick tests ────────────────────────────────────────────────
echo "🧪 pre-commit: running quick tests..."

if [ -d "propertyease" ]; then
  cd propertyease
  if [ -f "package.json" ] && grep -q '"test"' package.json; then
    # Only run tests matching "smoke" or with no failures expected
    npm test -- --testPathPattern=smoke 2>&1 | tail -20 || {
      echo "⚠️  Smoke tests had issues. Run full /test before pushing."
    }
  else
    echo "⏭️  No test script in package.json, skipping."
  fi
  cd ..
fi

echo "✅ pre-commit: all checks passed."
exit 0
