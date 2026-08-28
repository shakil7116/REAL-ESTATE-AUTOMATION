'use client';
/**
 * Avatar — circular initials in coral/dark-green tones.
 * Use anywhere we render a person (tenant, lead, owner).
 */
export type AvatarTone = 'coral' | 'dark' | 'sky' | 'emerald' | 'amber' | 'rose' | 'violet';

const TONE: Record<AvatarTone, string> = {
  coral:   'bg-[#D97757] text-white',
  dark:    'bg-[#132B25] text-white',
  sky:     'bg-sky-100 text-sky-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber:   'bg-amber-100 text-amber-700',
  rose:    'bg-rose-100 text-rose-700',
  violet:  'bg-violet-100 text-violet-700',
};

export interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  tone?: AvatarTone;
  className?: string;
}

const SIZE = {
  xs: 'w-7 h-7 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
} as const;

/** Stable tone derivation from name string (so the same person always gets the same color). */
export function toneForName(name: string): AvatarTone {
  const tones: AvatarTone[] = ['coral', 'dark', 'sky', 'emerald', 'amber', 'violet'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return tones[h % tones.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export default function Avatar({ name, size = 'md', tone, className = '' }: AvatarProps) {
  const t = tone ?? toneForName(name);
  return (
    <div
      className={`rounded-full flex items-center justify-center font-extrabold shrink-0 ${SIZE[size]} ${TONE[t]} ${className}`}
      aria-label={name}
      title={name}
    >
      {initials(name)}
    </div>
  );
}
