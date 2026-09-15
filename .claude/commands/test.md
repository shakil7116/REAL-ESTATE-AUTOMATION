# /test — Run the test suite
# ─────────────────────────
# Run all tests, report failures, do NOT auto-fix.

## Procedure

1. Run: `cd propertyease && npm test`
2. Capture stdout and stderr
3. If failures, report:
   - Test file
   - Test name
   - Expected vs actual
   - Error stack
4. Do NOT attempt to fix. Just report.
5. If all pass, output: `✅ All tests passed.`

## Output format

```
## /test results

✅ X passed
❌ Y failed
⏭️ Z skipped

### Failures (if any)
- `path/to/test.ts:42` — expected X, got Y
```

## Environment

- Working dir: `propertyease/`
- Node: 20+
- Jest config: `propertyease/jest.config.js`
