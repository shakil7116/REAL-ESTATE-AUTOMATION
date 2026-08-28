'use client';
/**
 * KpiRow — responsive 4-up grid wrapper for StatCards / mini-tiles.
 * Use once per page, drop StatCard children in.
 */
import type { ReactNode } from 'react';

export interface KpiRowProps {
  children: ReactNode;
  /** Number of columns at xl breakpoint. 4 default; 2 for tighter pages. */
  cols?: 2 | 3 | 4;
  className?: string;
}

const COLS = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
} as const;

export default function KpiRow({ children, cols = 4, className = '' }: KpiRowProps) {
  return <div className={`grid ${COLS[cols]} gap-4 ${className}`}>{children}</div>;
}
