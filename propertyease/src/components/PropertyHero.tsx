'use client';
// ==========================================
// PropertyHero — full-width hero for the property
// detail page. Cover image with dark gradient
// overlay, name + address + status pill.
// ==========================================

import type { ReactNode } from 'react';
import { Building2, MapPin, ChevronLeft } from 'lucide-react';
import { t, type Locale } from '@/lib/i18n';

export interface PropertyHeroProps {
  name: string;
  address: string;
  city: string;
  country: string;
  status: string;
  coverUrl?: string | null;
  /** Optional right-side action (e.g. Edit button). */
  action?: ReactNode;
  /** RTL? */
  isRtl?: boolean;
  locale?: Locale;
}

export default function PropertyHero({
  name,
  address,
  city,
  country,
  status,
  coverUrl,
  action,
  isRtl = false,
  locale = 'en',
}: PropertyHeroProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm">
      {/* Image or fallback */}
      <div className="relative aspect-[21/9] min-h-[260px] bg-gradient-to-br from-[#1A3830] via-[#132B25] to-[#0D2A24]">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Building2 className="w-24 h-24 text-white/10" />
          </div>
        )}

        {/* Dark gradient overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D2A24]/90 via-[#0D2A24]/40 to-transparent" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.04]" />

        {/* Top: breadcrumb-like back link + status pill */}
        <div className="absolute top-5 inset-x-5 flex items-start justify-between gap-3 z-10">
          <a
            href="/properties"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white/90 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full transition-all"
          >
            <ChevronLeft className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
            {t('backToProperties', locale)}
          </a>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/15 text-white border border-white/25 backdrop-blur-sm">
            {status.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Bottom: name + address + action */}
        <div className="absolute inset-x-0 bottom-0 p-6 z-10 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm truncate">
              {name}
            </h1>
            <p className="text-sm text-white/85 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{address}, {city}, {country}</span>
            </p>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>
    </div>
  );
}
