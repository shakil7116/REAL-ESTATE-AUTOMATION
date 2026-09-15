'use client';
// ==========================================
// UnitCardCompact — compact card for a single
// unit in the property detail page grid.
// Shows cover image, unit number, specs,
// rent, and status. Clickable to /units.
// ==========================================

import { Bed, Bath, Maximize2, Home, ChevronRight, Sofa, Car, Warehouse } from 'lucide-react';
import { t, type Locale } from '@/lib/i18n';

export interface UnitCardCompactProps {
  id: string;
  unitNumber: string;
  floor?: number | null;
  floorLabel?: string | null;
  bedrooms: number;
  bathrooms: number;
  livingRooms?: number | null;
  kitchens?: number | null;
  hasMaidRoom?: boolean | null;
  hasDriverRoom?: boolean | null;
  balconies?: number | null;
  parkingSpaces?: number | null;
  hasStorage?: boolean | null;
  areaSqft?: number | null;
  monthlyRent: number;
  furnishing: 'unfurnished' | 'semi_furnished' | 'fully_furnished';
  status: 'vacant' | 'occupied' | 'maintenance' | 'reserved';
  images?: string[] | null;
  currencySymbol: string;
  isRtl?: boolean;
  locale?: Locale;
}

const STATUS_BADGE: Record<string, { class: string; en: string; ar: string }> = {
  occupied:    { class: 'bg-emerald-100 text-emerald-700 border-emerald-200', en: 'Occupied',  ar: 'مشغول' },
  vacant:      { class: 'bg-blue-100 text-blue-700 border-blue-200',         en: 'Vacant',    ar: 'فارغ' },
  reserved:    { class: 'bg-amber-100 text-amber-700 border-amber-200',       en: 'Reserved',  ar: 'محجوز' },
  maintenance: { class: 'bg-rose-100 text-rose-700 border-rose-200',         en: 'Maintenance', ar: 'صيانة' },
};

const FURNISH_LABEL: Record<string, { en: string; ar: string }> = {
  unfurnished:     { en: 'Unfurnished',     ar: 'غير مفروش' },
  semi_furnished:  { en: 'Semi-Furnished',  ar: 'نصف مفروش' },
  fully_furnished: { en: 'Fully Furnished', ar: 'مفروش بالكامل' },
};

export default function UnitCardCompact({
  id,
  unitNumber,
  floor,
  floorLabel,
  bedrooms,
  bathrooms,
  livingRooms,
  kitchens,
  hasMaidRoom,
  hasDriverRoom,
  balconies,
  parkingSpaces,
  hasStorage,
  areaSqft,
  monthlyRent,
  furnishing,
  status,
  images,
  currencySymbol,
  isRtl = false,
  locale = 'en',
}: UnitCardCompactProps) {
  const badge = STATUS_BADGE[status] || STATUS_BADGE.vacant;
  const furnishLabel = FURNISH_LABEL[furnishing] || FURNISH_LABEL.unfurnished;
  const cover = images?.[0];

  // Prefer the named label we wrote from the dropdown; fall back
  // to a synthesized label from the int for legacy rows.
  const isEn = t('bedrooms', locale) === 'Bedrooms';
  const renderedFloor = floorLabel
    ? floorLabel
    : floor == null
      ? null
      : floor === 0
        ? (isEn ? 'Ground' : 'الأرضي')
        : floor === -1
          ? (isEn ? 'Basement' : 'القبو')
          : floor === 99
            ? (isEn ? 'Penthouse' : 'البنتهاوس')
            : `${isEn ? 'Floor' : 'الطابق'} ${floor}`;

  // Spec chips: only show extras that are set & non-zero / true.
  const specChips: { icon: React.ReactNode; label: string }[] = [];
  if ((livingRooms ?? 0) > 0) {
    specChips.push({ icon: <Sofa className="w-3 h-3" />, label: `${livingRooms} ${isEn ? 'Living' : 'صالة'}` });
  }
  if ((parkingSpaces ?? 0) > 0) {
    specChips.push({ icon: <Car className="w-3 h-3" />, label: `${parkingSpaces} ${isEn ? 'Parking' : 'موقف'}` });
  }
  if (hasMaidRoom) {
    specChips.push({ icon: <Home className="w-3 h-3" />, label: isEn ? 'Maid' : 'خادمة' });
  }
  if (hasDriverRoom) {
    specChips.push({ icon: <Home className="w-3 h-3" />, label: isEn ? 'Driver' : 'سائق' });
  }
  if (hasStorage) {
    specChips.push({ icon: <Warehouse className="w-3 h-3" />, label: isEn ? 'Storage' : 'تخزين' });
  }

  return (
    <a
      href={`/units?unit_id=${id}`}
      className="group block bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Cover image area */}
      <div className="relative aspect-[16/10] bg-gradient-to-br from-[#F6F8F6] to-[#E8F0EC] overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={`Unit ${unitNumber}`}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Home className="w-10 h-10 text-[#132B25]/15" />
          </div>
        )}

        {/* Status badge top-right */}
        <span className={`absolute top-2.5 end-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-sm ${badge.class}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {locale === 'ar' ? badge.ar : badge.en}
        </span>

        {/* Unit number overlay top-left */}
        <div className="absolute top-2.5 start-2.5 px-2 py-1 rounded-md bg-black/55 text-white text-[10px] font-extrabold tracking-wide backdrop-blur-sm">
          {isEn ? 'UNIT' : 'وحدة'} {unitNumber}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Bed className="w-3 h-3" /> {isEn ? 'Beds' : 'غرف'}
            </div>
            <div className="text-sm font-extrabold text-[#132B25] mt-0.5">{bedrooms}</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Bath className="w-3 h-3" /> {isEn ? 'Baths' : 'حمامات'}
            </div>
            <div className="text-sm font-extrabold text-[#132B25] mt-0.5">{bathrooms}</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Maximize2 className="w-3 h-3" /> {isEn ? 'Area' : 'المساحة'}
            </div>
            <div className="text-sm font-extrabold text-[#132B25] mt-0.5">
              {areaSqft ? `${Math.round(Number(areaSqft))}` : '—'}
            </div>
          </div>
        </div>

        {/* Qatar spec chips */}
        {specChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {specChips.map((chip, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600"
              >
                {chip.icon}
                {chip.label}
              </span>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {t('monthlyRent', locale)}
            </div>
            <div className="font-extrabold text-[#132B25] mt-0.5">
              {currencySymbol} {Number(monthlyRent).toLocaleString()}
            </div>
          </div>
          <div className="text-end">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {t('furnishing', locale)}
            </div>
            <div className="font-semibold text-slate-600 mt-0.5">
              {locale === 'ar' ? furnishLabel.ar : furnishLabel.en}
            </div>
          </div>
        </div>

        {renderedFloor && (
          <div className="text-[10px] text-slate-400 font-semibold">
            {renderedFloor}
          </div>
        )}

        <div className="flex items-center justify-end text-[11px] font-extrabold text-[#132B25] group-hover:gap-2 transition-all">
          <span>{locale === 'ar' ? 'إدارة' : 'Manage'}</span>
          <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''} ms-1`} />
        </div>
      </div>
    </a>
  );
}
