'use client';
/**
 * Badge — small inline status / count / category label.
 * Pill shape by default. Use for non-status metadata.
 */
import type { ReactNode } from 'react';

export type BadgeTone =
  | 'slate' | 'emerald' | 'sky' | 'amber' | 'rose' | 'violet' | 'coral';

const TONE: Record<BadgeTone, string> = {
  slate:   'bg-slate-100 text-slate-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  sky:     'bg-sky-100 text-sky-700',
  amber:   'bg-amber-100 text-amber-700',
  rose:    'bg-rose-100 text-rose-600',
  violet:  'bg-violet-100 text-violet-700',
  coral:   'bg-orange-100 text-[#D97757]',
};

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

export default function Badge({ children, tone = 'slate', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${TONE[tone]} ${className}`}>
      {children}
    </span>
  );
}
