# Incident 2026-09-07: Stale In-Memory Fallback State After Manual Data Edit

## Summary
After manually editing `.data/fallback.json` to remove test properties ("My Test Property", "AL THUMAMA 103 UPDATED") and restore the clean 4-property Qatar seed bundle, the live dev server continued serving stale data containing those removed properties. The `POST /api/debug/reset` endpoint successfully reloaded from disk in its own process, but other Next.js worker processes retained their cached in-memory state.

## Severity
S2 (moderate — affects development accuracy, not production since this is fallback mode only)

## Date Discovered
2026-09-07

## Root Cause
Next.js dev server spawns multiple Node.js worker processes. Each process maintains its own `globalThis.__PE_FALLBACK__` instance. The `debug/reset` endpoint modifies only the calling process's copy. Other worker processes continue serving from their stale cached state until they either:
1. Time out after `DISK_RELOAD_INTERVAL_MS` (5 seconds) and attempt a re-read, OR
2. Are restarted

However, the re-read logic checks `fs.existsSync()` against resolved paths. If the file path resolution fails (e.g., due to Windows path separator issues or wrong CWD), the reload silently skips and retains the stale bundle.

Additionally, the disk file had already been cleaned via direct write, but live API endpoints still returned 3 properties including test data — indicating either:
- The reload path resolution was failing
- Another process was caching the bundle longer than expected
- HMR had not fully cleared the module state

## Resolution
The clean state exists on disk (`properties`: Al Mansura Complex, Asmaco Residence, Al Thumama Villas, The Pearl Residences). To fully apply changes:
1. **Kill all node processes** serving port 3000
2. **Restart `npm run dev`** from the `propertyease/` directory
3. Verify with `curl http://localhost:3000/api/properties` before proceeding

## Prevention
- When modifying `.data/fallback.json` manually during dev, always restart the server
- Consider adding a file-watcher-based hot reload for the fallback bundle
- Document this behavior in `docs/DEPLOY.md` or add a startup warning

## Related
- `memory/incidents/2025-08-15-cache-fallback-bug.md` — previous SW cache issue
- `propertyease/src/lib/database.ts` — `getBundle()` and `persistBundle()` functions
- `propertyease/src/app/api/debug/reset/route.ts` — reset endpoint
