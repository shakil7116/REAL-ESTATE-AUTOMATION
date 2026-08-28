'use client';
/**
 * ProgressBar — horizontal occupancy / capacity indicator.
 * Color auto-derives from percentage: green ≥90, amber ≥60, rose below.
 */
export interface ProgressBarProps {
  value: number; // 0-100
  tone?: 'auto' | 'emerald' | 'amber' | 'rose' | 'coral' | 'dark';
  height?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

const TONE_AUTO = (v: number) =>
  v >= 90 ? 'bg-emerald-500' : v >= 60 ? 'bg-amber-500' : 'bg-rose-500';

const TONE_FIXED: Record<NonNullable<ProgressBarProps['tone']>, string> = {
  auto:    '', // overridden below
  emerald: 'bg-emerald-500',
  amber:   'bg-amber-500',
  rose:    'bg-rose-500',
  coral:   'bg-[#D97757]',
  dark:    'bg-[#132B25]',
};

const HEIGHT = { sm: 'h-1.5', md: 'h-2', lg: 'h-2.5' } as const;

export default function ProgressBar({
  value,
  tone = 'auto',
  height = 'md',
  className = '',
  showLabel = false,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const fill = tone === 'auto' ? TONE_AUTO(clamped) : TONE_FIXED[tone];
  return (
    <div className={className}>
      <div className={`w-full bg-slate-100 rounded-full ${HEIGHT[height]} overflow-hidden`}>
        <div
          className={`${HEIGHT[height]} rounded-full transition-all duration-500 ${fill}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-[10px] text-slate-500 font-semibold mt-1">
          <span>{clamped}%</span>
        </div>
      )}
    </div>
  );
}
