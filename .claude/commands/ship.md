# /ship — Pre-deploy checklist
# ────────────────────────────
# Final checks before merging to main / deploying to prod.

## Procedure

Run all of these in order. If ANY fails, do NOT proceed.

1. **`/test`** — all tests pass
2. **`/eval`** — no LLM regressions
3. **Linting** — `cd propertyease && npm run lint`
4. **TypeScript** — `cd propertyease && npx tsc --noEmit`
5. **Build** — `cd propertyease && npm run build` (must succeed)
6. **Secrets scan** — `bash .claude/hooks/pre-commit.sh --scan-only`
7. **CHANGELOG** — entry exists for this version
8. **Version bump** — semver in `package.json` matches `CHANGELOG.md`
9. **Migration** — if Prisma changed, migration committed
10. **Docs** — `docs/CHANGELOG.md` has user-facing notes

## Output format

```
## /ship checklist

1. /test      ✅
2. /eval      ✅
3. lint       ✅
4. tsc        ✅
5. build      ✅
6. secrets    ✅
7. CHANGELOG  ✅
8. version    ✅
9. migration  ✅
10. docs      ✅

🚀 Ship it.
```

If any check fails:

```
## /ship checklist

1. /test      ❌ 3 failing
2. /eval      ✅
3. lint       ⚠️ 2 warnings
...

🛑 Do not ship. Fix failing checks first.
```

## After /ship succeeds

1. Tag the release: `git tag vX.Y.Z`
2. Push the tag: `git push origin vX.Y.Z`
3. Trigger deploy (Vercel auto-deploys on push to main)
4. Notify @devops for the deploy
5. Update `memory/decisions/` if anything significant changed
