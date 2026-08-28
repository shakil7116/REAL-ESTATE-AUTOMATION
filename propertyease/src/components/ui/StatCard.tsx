'use client';
/**
 * StatCard — KPI tile for dashboard-style 4-up grids.
 * Icon top-left, delta top-right, big value, label below.
 */
import type { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export type StatTone = 'emerald' | 'sky' | 'orange' | 'purple' | 'rose' | 'slate' | 'amber';

const ICON_BG: Record<StatTone, string> = {
  emerald: 'bg-emerald-100 text-emerald-600',
  sky:     'bg-sky-100 text-sky-600',
  orange:  'bg-orange-100 text-orange-600',
  purple:  'bg-purple-100 text-purple-600',
  rose:    'bg-rose-100 text-rose-600',
  slate:   'bg-slate-100 text-slate-600',
  amber:   'bg-amber-100 text-amber-600',
};

export interface StatCardProps {
  icon: ReactNode;
  /** Big value, e.g. "QAR 4,500" or "93%" or "—" when empty */
  value: ReactNode;
  label: string;
  /** Delta string, e.g. "+8.4%" or "-12.6%" or "—" for no-data */
  delta?: string;
  /** Direction of delta. 'flat' renders no arrow (use for "—" empty). */
  trend?: 'up' | 'down' | 'flat';
  tone?: StatTone;
}

export default function StatCard({
  icon,
  value,
  label,
  delta,
  trend = 'flat',
  tone = 'slate',
}: StatCardProps) {
  const trendColor =
    trend === 'up'   ? 'text-emerald-600' :
    trend === 'down' ? 'text-rose-500' :
                       'text-slate-400';
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ICON_BG[tone]}`}>
          {icon}
        </div>
        {delta !== undefined && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            {delta}
          </span>
        )}
      </div>
      <div className="text-2xl font-extrabold text-[#0D2A24] mb-1 tracking-tight">{value}</div>
      <div className="text-xs text-slate-500 font-semibold">{label}</div>
    </div>
  );
}
