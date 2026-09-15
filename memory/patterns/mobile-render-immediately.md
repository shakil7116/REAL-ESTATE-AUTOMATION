---
name: mobile-render-immediately-fetch-background
description: "Pattern for all 6 mobile data screens — render UI instantly, fetch data silently, show spinner only on explicit pull-to-refresh"
metadata:
  type: reference
  category: patterns
  created: 2026-09-12
---

# Mobile Screen Pattern: Render Immediately, Fetch in Background

**Commit:** `13c310c` — perf(mobile): eliminate loading spinners on tab navigation

## Why This Matters

When navigating between tabs, users were waiting ~10 seconds for data to load before seeing any content. The old pattern used `useState(true)` for loading and blocked rendering entirely with `if (loading) return <Spinner>`. This made the app feel sluggish and unresponsive.

The new pattern renders the screen shell immediately (with empty state or placeholder values), then populates data in the background. A spinner appears ONLY during explicit pull-to-refresh gestures.

## The Pattern (copy-paste template)

```tsx
import { useEffect, useState } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { getToken } from '../lib/session';
import { getCached, refreshCache } from '../lib/cache';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function MyScreen() {
  const router = useRouter();
  const [data, setData] = useState<DataType[]>([]);
  // Show spinner only during pull-to-refresh — never on initial load.
  const [refreshing, setRefreshing] = useState(false);
  const [trigger, setTrigger] = useState(0);

  // Clear cache whenever this tab regains foreground.
  useFocusEffect(() => refreshCache());

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const json = await getCached(`${API_BASE}/api/endpoint`, { token }) as { ok: boolean; data?: DataType[] };
        if (json.ok && Array.isArray(json.data)) setData(json.data);
      } catch { /* show empty — don't block UI */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Screen header + content — always rendered, even if data is [] */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              refreshCache();
              setRefreshing(true);
              setTrigger(prev => prev + 1);
            }}
          />
        }
      >
        {data.length === 0 ? (
          <View style={styles.emptyCenter}>
            <Text style={styles.emptyTitle}>No data yet</Text>
          </View>
        ) : (
          data.map(item => <ItemCard key={item.id} item={item} />)
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
```

## Key Rules

1. **Never** use a `loading` state that blocks the entire render tree (`if (loading) return <Spinner>`).
2. **Always** initialize data states to `[]` or `null` — the screen renders its empty state first.
3. **Only** use `refreshing` for the `RefreshControl` indicator (user-initiated only).
4. **Use `trigger` state** (incremented on refresh) to force `useEffect` re-runs.
5. **Wrap API calls** in `getCached()` with appropriate TTL (see cache.ts for policy).
6. **Catch errors gracefully** — show what we have, don't block UI on network failure.
7. **useFocusEffect(() => refreshCache())** clears cache when user returns to the tab.

## Files Using This Pattern

| Screen | File | Data Endpoints | Cache TTL |
|--------|------|----------------|-----------|
| Dashboard | `app/dashboard.tsx` | `/api/dashboard`, `/api/activities` | 2 min |
| Properties | `app/properties.tsx` | `/api/properties` | 5 min |
| Tenants | `app/tenants.tsx` | `/api/tenants`, `/api/leads`, `/api/units`, `/api/leases` | 5 min |
| Payments | `app/payments.tsx` | `/api/payments` | 3 min |
| Maintenance | `app/maintenance.tsx` | `/api/maintenance` | 3 min |
| Settings | `app/settings.tsx` | AsyncStorage only | N/A |
| Copilot | `app/copilot.tsx` | POST /api/copilot (uncached) | No cache |

## What NOT to Change

- `_layout.tsx` — locale init is fire-and-forget (`initLocale().catch(() => {})`)
- `copilot.tsx` — chat UI doesn't need caching; messages are ephemeral
- `settings.tsx` — reads from AsyncStorage, no API calls on mount

## Related Patterns

- [[mobile-i18n-pattern]] — Arabic/English RTL toggle on mobile
- [[cache-layer-guide]] — getCached() / refreshCache() API in lib/cache.ts
