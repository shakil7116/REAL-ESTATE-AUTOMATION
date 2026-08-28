'use client';
/**
 * SegmentedControl — pill-style tab group for period / status filters.
 * Replaces the inline period toggle currently in Reports.
 */
import type { ReactNode } from 'react';

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: SegmentOption<T>[];
  className?: string;
}

export default function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div className={`inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl ${className}`}>
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
              active ? 'bg-white text-[#132B25] shadow-sm' : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
