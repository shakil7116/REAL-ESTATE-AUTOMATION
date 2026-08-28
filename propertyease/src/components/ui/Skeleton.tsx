'use client';
/**
 * Skeleton — placeholder block that pulses while data loads.
 * Use instead of spinners (per STYLE.md §6). Composes into any layout.
 */
export interface SkeletonProps {
  className?: string;
  /** Number of stacked rows (for list placeholders) */
  count?: number;
}

export default function Skeleton({ className = '', count = 1 }: SkeletonProps) {
  if (count > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`bg-slate-100 rounded-xl animate-pulse ${className}`} />
        ))}
      </div>
    );
  }
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className}`} />;
}
