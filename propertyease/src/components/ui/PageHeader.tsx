'use client';
/**
 * PageHeader — title + subtitle + action button, used at the top of every page.
 * Replaces the inconsistent ad-hoc headers in each page.
 */
import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional eyebrow tag above the title (e.g. "PORTFOLIO ANALYTICS") */
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
}

export default function PageHeader({ title, subtitle, eyebrow, action, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <div>
        {eyebrow && (
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#D97757] mb-1.5">
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1 font-medium">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
