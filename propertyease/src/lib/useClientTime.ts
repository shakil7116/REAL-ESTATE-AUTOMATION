'use client';

import { useEffect, useState } from 'react';

/**
 * useMounted — returns `false` during SSR and the very first client render,
 * then flips to `true` after the effect runs in the browser.
 *
 * Use this to gate any UI whose value depends on the user's locale or
 * timezone (current time, greeting, Intl-formatted currency/date, etc.)
 * so the server-rendered HTML matches the first client render.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

/**
 * useClientDate — runs `compute` on the client after mount and returns
 * the stable `fallback` during SSR and the first client render.
 */
export function useClientDate<T>(compute: () => T, fallback: T): T {
  const mounted = useMounted();
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => {
    setValue(compute());
    // Intentionally re-run when the dependency changes are the inputs
    // to compute(). Callers pass an inline closure, so we re-run on
    // every mount only — refreshes the value if the user keeps the
    // page open across a time boundary.
    const id = setInterval(() => setValue(compute()), 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return mounted ? value : fallback;
}
