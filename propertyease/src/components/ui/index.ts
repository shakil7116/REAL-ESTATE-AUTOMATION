'use client';
/**
 * PropertyEase UI Primitives — single source of truth for all design tokens.
 * Every page MUST import from here, never hand-roll colors/spacing/typography.
 *
 * Color tokens come from `tailwind.config.js` (primary / coral / workspace).
 * Layout tokens come from `docs/STYLE.md` (canonical style guide).
 */
export { default as Button } from './Button';
export { default as Card } from './Card';
export { default as StatCard } from './StatCard';
export { default as Badge } from './Badge';
export { default as StatusPill } from './StatusPill';
export { default as ProgressBar } from './ProgressBar';
export { default as Avatar } from './Avatar';
export { default as EmptyState } from './EmptyState';
export { default as Skeleton } from './Skeleton';
export { default as KpiRow } from './KpiRow';
export { default as PageHeader } from './PageHeader';
export { default as SearchInput } from './SearchInput';
export { default as SlideOver } from './SlideOver';
export { default as SegmentedControl } from './SegmentedControl';
