'use client';

import { useEffect } from 'react';
import { seedSampleData } from './seed';

/**
 * Seeds the in-memory store with realistic demo data on first load.
 * Called once in the root layout so every page has live data immediately.
 * If Supabase is available, data is written there too via the DB layer.
 */
export function useSeedOnMount() {
  useEffect(() => {
    // Seed only once per session — idempotent inside seedSampleData
    seedSampleData();
  }, []);
}
