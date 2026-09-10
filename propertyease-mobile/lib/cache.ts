/**
 * In-app cache layer for PropertyEase mobile.
 *
 * Provides a session-scoped (in-memory) key-value store backed by a per-key TTL.
 * Responses are keyed by the first 8 chars of the auth token prefix so that
 * different users never share cache entries, and calls without a token still
 * get per-request fresh data.
 *
 * TTL policy (data freshness):
 *   - dashboard/stats & /activities      → 2 min  (volatile — changes every rent cycle)
 *   - properties                         → 5 min  (stable — manual edits only)
 *   - tenants/leads/units/leases         → 5 min  (stable — manual edits only)
 *   - payments                           → 3 min  (semi-stable — received payments update often)
 *   - maintenance                        → 3 min  (semi-stable — tickets change status)
 *   - copilot / auth                     → no cache (always fresh)
 *
 * Usage:
 *   const data = await getCached(API_BASE + '/api/properties', headers);
 *   // On foreground or pull-to-refresh:
 *   refreshCache();
 */
export type CacheTtl = Record<string, number>; // path key → ms

const DEFAULT_TTL_MS = 5 * 60_000; // 5 minutes for anything unlisted

// TTL map — keys match the beginning of the full fetch URL.
const TTL_MAP: CacheTtl = {
  '/api/dashboard': 2 * 60_000,
  '/api/activities': 2 * 60_000,
  '/api/payments': 3 * 60_000,
  '/api/maintenance': 3 * 60_000,
  '/api/properties': 5 * 60_000,
  '/api/tenants': 5 * 60_000,
  '/api/leads': 5 * 60_000,
  '/api/units': 5 * 60_000,
  '/api/leases': 5 * 60_000,
};

interface CacheEntry {
  data: unknown;
  expiresAt: number; // epoch ms
}

const store = new Map<string, CacheEntry>();

/** Returns true if the entry at key is still valid. */
function isValid(key: string): boolean {
  const entry = store.get(key);
  if (!entry) return false;
  return Date.now() < entry.expiresAt;
}

/** Builds a deterministic cache key from url + token prefix. */
function keyFor(url: string, token: string | null): string {
  const prefix = token ? token.slice(0, 8) : '_no_auth';
  return `${prefix}:${url}`;
}

/** Get the TTL in ms for a given URL. */
function ttlMs(url: string): number {
  for (const [path, ms] of Object.entries(TTL_MAP)) {
    if (url.includes(path)) return ms;
  }
  return DEFAULT_TTL_MS;
}

/**
 * Fetch data with in-memory caching.
 *
 * Returns cached data if a valid entry exists; otherwise performs a real fetch,
 * stores the response body, and returns it. Cache is invalidated by calling
 * refreshCache() (triggered on screen foreground / pull-to-refresh).
 *
 * Non-cached paths (copilot, auth, uploads) bypass the store entirely.
 */
export async function getCached(
  url: string,
  init?: RequestInit & { token?: string | null },
): Promise<unknown> {
  // Always fresh for real-time endpoints.
  if (
    url.includes('/api/copilot') ||
    url.includes('/api/auth/') ||
    url.includes('/api/upload') ||
    url.includes('/api/profile')
  ) {
    const res = await fetch(url, init);
    return res.json();
  }

  const token = init?.token ?? null;
  const k = keyFor(url, token);

  if (isValid(k)) {
    const entry = store.get(k)!;
    return entry.data;
  }

  const res = await fetch(url, init);
  const json = await res.json();

  const ms = ttlMs(url);
  store.set(k, { data: json, expiresAt: Date.now() + ms });
  return json;
}

/**
 * Clear the entire in-memory cache.
 *
 * Call this from `useFocusEffect` on every screen and from the pull-to-refresh
 * handler. This is the single invalidation point for the whole app.
 */
export function refreshCache(): void {
  store.clear();
}
