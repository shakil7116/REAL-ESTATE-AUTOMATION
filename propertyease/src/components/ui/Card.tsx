'use client';
/**
 * Card — white surface with standard border, radius, shadow.
 * Use for every elevated surface (stat cards, list rows, panels).
 */
import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Use 'flat' for inline surfaces, 'raised' for primary cards */
  variant?: 'flat' | 'raised';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const PAD = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' } as const;

export default function Card({
  children,
  variant = 'flat',
  padding = 'md',
  hover = false,
  className = '',
  ...rest
}: CardProps) {
  return (
    <div
      className={[
        'bg-white rounded-2xl border border-slate-200/80',
        variant === 'raised' ? 'shadow-sm' : '',
        hover ? 'hover:shadow-md transition-shadow' : '',
        PAD[padding],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}
