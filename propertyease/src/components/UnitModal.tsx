'use client';
// ==========================================
// UnitModal — Add/Edit unit dialog.
//
// Layout (matches user request, 2026-08-28):
//   1. Header with property + unit number subtitle
//   2. Unit Identity
//        - Property  → locked, read-only card (auto-selected)
//        - Unit #    → text input (12A, 1B, 203...)
//        - Floor     → named-floor dropdown (Basement, Ground, 1st–5th, Penthouse)
//        - Status    → vacant / occupied / reserved / maintenance
//   3. Unit Specs (Qatar layout)
//        - Living rooms, Kitchens, Maid's room, Driver's room,
//          Balconies, Parking spaces, Storage room (all counts or yes/no)
//        - Bedrooms, Bathrooms, Area, Furnishing
//   4. Financial Details
//        - Monthly rent, Security deposit, Amenities (chips), Description
//   5. Unit Gallery — drag/drop uploader (URL tab removed; managers
//      want real file uploads here, see ImageUploader `allowUrl`)
//   6. Action row — Delete (edit) + Cancel + Save
// ==========================================

import { useState, useEffect, useMemo } from 'react';
import {
  X, Home, Edit2, Trash2, AlertCircle, Lock, Bed, Bath, Sofa,
  CookingPot, Users, ParkingSquare, Warehouse, Building2,
} from 'lucide-react';
import { useCountry } from '@/context/CountryContext';
import ImageUploader from '@/components/ImageUploader';
import { t, type Locale } from '@/lib/i18n';

interface Unit {
  id?: string;
  property_id: string;
  unit_number: string;
  floor?: number | null;
  floor_label?: string | null;
  bedrooms: number;
  bathrooms: number;
  living_rooms?: number | null;
  kitchens?: number | null;
  has_maid_room?: boolean | null;
  has_driver_room?: boolean | null;
  balconies?: number | null;
  parking_spaces?: number | null;
  has_storage?: boolean | null;
  area_sqft?: number | null;
  monthly_rent: number;
  security_deposit?: number | null;
  furnishing: 'unfurnished' | 'semi_furnished' | 'fully_furnished';
  status: 'vacant' | 'occupied' | 'maintenance' | 'reserved';
  description?: string | null;
  amenities?: string[];
  images?: string[];
}

interface Property {
  id: string;
  name: string;
  name_ar?: string | null;
  city: string;
}

interface UnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit?: Unit | null;
  properties: Property[];
  defaultPropertyId?: string;
  lang?: Locale;
  onSuccess: () => void;
}

// Named floors — used in the dropdown. `value` is the canonical
// integer we still write to `floor`; `label` is what the user sees.
type FloorValue = {
  value: number;
  label: (locale: Locale) => string;
};

const FLOOR_OPTIONS: FloorValue[] = [
  { value: -1, label: (l) => t('floorBasement', l) },
  { value:  0, label: (l) => t('floorGround', l) },
  { value:  1, label: (l) => t('floor1st', l) },
  { value:  2, label: (l) => t('floor2nd', l) },
  { value:  3, label: (l) => t('floor3rd', l) },
  { value:  4, label: (l) => t('floor4th', l) },
  { value:  5, label: (l) => t('floor5th', l) },
  { value:  6, label: (l) => t('floor6th', l) },
  { value: 99, label: (l) => t('floorPenthouse', l) },
];

function labelForFloor(value: number | null | undefined, locale: Locale): string {
  if (value == null) return '—';
  const match = FLOOR_OPTIONS.find(f => f.value === value);
  return match ? match.label(locale) : `Floor ${value}`;
}

export default function UnitModal({
  isOpen,
  onClose,
  unit,
  properties,
  defaultPropertyId,
  lang = 'en',
  onSuccess,
}: UnitModalProps) {
  const { currencySymbol } = useCountry();
  const isEdit = !!unit?.id;

  // ── form state ──────────────────────────────────────────────────
  const [propertyId, setPropertyId] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [floor, setFloor] = useState<number | null>(0);
  const [status, setStatus] = useState<'vacant' | 'occupied' | 'maintenance' | 'reserved'>('vacant');

  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(1);
  const [livingRooms, setLivingRooms] = useState(0);
  const [kitchens, setKitchens] = useState(1);
  const [hasMaidRoom, setHasMaidRoom] = useState(false);
  const [hasDriverRoom, setHasDriverRoom] = useState(false);
  const [balconies, setBalconies] = useState(0);
  const [parkingSpaces, setParkingSpaces] = useState(0);
  const [hasStorage, setHasStorage] = useState(false);
  const [areaSqft, setAreaSqft] = useState<number | null>(null);
  const [furnishing, setFurnishing] = useState<'unfurnished' | 'semi_furnished' | 'fully_furnished'>('unfurnished');

  const [monthlyRent, setMonthlyRent] = useState(0);
  const [securityDeposit, setSecurityDeposit] = useState<number | null>(null);
  const [amenitiesInput, setAmenitiesInput] = useState('');
  const [description, setDescription] = useState('');

  const [unitImages, setUnitImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate / reset form when modal opens.
  useEffect(() => {
    if (unit) {
      setPropertyId(unit.property_id);
      setUnitNumber(unit.unit_number);
      setFloor(unit.floor ?? null);
      setStatus(unit.status);
      setBedrooms(unit.bedrooms);
      setBathrooms(unit.bathrooms);
      setLivingRooms(unit.living_rooms ?? 0);
      setKitchens(unit.kitchens ?? 1);
      setHasMaidRoom(unit.has_maid_room ?? false);
      setHasDriverRoom(unit.has_driver_room ?? false);
      setBalconies(unit.balconies ?? 0);
      setParkingSpaces(unit.parking_spaces ?? 0);
      setHasStorage(unit.has_storage ?? false);
      setAreaSqft(unit.area_sqft ?? null);
      setFurnishing(unit.furnishing);
      setMonthlyRent(unit.monthly_rent);
      setSecurityDeposit(unit.security_deposit ?? null);
      setDescription(unit.description || '');
      setAmenitiesInput((unit.amenities || []).join(', '));
      setUnitImages(unit.images || []);
    } else {
      setPropertyId(defaultPropertyId || (properties[0]?.id || ''));
      setUnitNumber('');
      setFloor(0);
      setStatus('vacant');
      setBedrooms(0);
      setBathrooms(1);
      setLivingRooms(0);
      setKitchens(1);
      setHasMaidRoom(false);
      setHasDriverRoom(false);
      setBalconies(0);
      setParkingSpaces(0);
      setHasStorage(false);
      setAreaSqft(null);
      setFurnishing('unfurnished');
      setMonthlyRent(0);
      setSecurityDeposit(null);
      setDescription('');
      setAmenitiesInput('');
      setUnitImages([]);
    }
    setError(null);
  }, [unit, isOpen, properties, defaultPropertyId]);

  const selectedProperty = useMemo(
    () => properties.find(p => p.id === propertyId) ?? null,
    [properties, propertyId],
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId.trim() || !unitNumber.trim()) {
      setError(t('propertyLockedHint', lang).split('.')[0] || 'Property and unit number are required');
      return;
    }

    const amenities = amenitiesInput
      .split(',')
      .map(a => a.trim().toLowerCase())
      .filter(Boolean);

    // The floor_label is derived from the named-floor dropdown —
    // we always write both `floor` (int) and `floor_label` (text)
    // so card views can render either form.
    const floorLabel = floor != null ? labelForFloor(floor, lang) : null;

    setLoading(true);
    setError(null);

    const payload: Partial<Unit> = {
      property_id: propertyId.trim(),
      unit_number: unitNumber.trim(),
      floor,
      floor_label: floorLabel,
      status,
      bedrooms,
      bathrooms,
      living_rooms: livingRooms,
      kitchens,
      has_maid_room: hasMaidRoom,
      has_driver_room: hasDriverRoom,
      balconies,
      parking_spaces: parkingSpaces,
      has_storage: hasStorage,
      area_sqft: areaSqft,
      furnishing,
      monthly_rent: Number(monthlyRent),
      security_deposit: securityDeposit,
      description: description.trim() || null,
      amenities,
      images: unitImages,
    };

    try {
      const url = isEdit
        ? `/api/units?id=${unit!.id}`
        : '/api/units';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save unit');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!unit?.id) return;
    if (!confirm(`Are you sure you want to delete Unit ${unit.unit_number}?`)) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/units?id=${unit.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete unit');
    } finally {
      setLoading(false);
    }
  };

  // ── tiny form helpers ───────────────────────────────────────────
  const Counter = ({
    label, value, onChange, min = 0, max = 20, icon,
  }: {
    label: string;
    value: number;
    onChange: (n: number) => void;
    min?: number;
    max?: number;
    icon?: React.ReactNode;
  }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      <div className="flex items-stretch border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#D97757] focus-within:ring-2 focus-within:ring-[#D97757]/20 transition-all">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="px-3 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
          disabled={value <= min}
        >
          −
        </button>
        <input
          type="number"
          min={min}
          max={max}
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(e) => {
            const raw = e.target.value.replace(/^0+(\d+)/, '$1');
            const n = Number(raw);
            if (raw === '' || Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
          }}
          className="flex-1 min-w-0 text-center text-sm font-bold text-[#132B25] outline-none bg-transparent"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="px-3 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
          disabled={value >= max}
        >
          +
        </button>
      </div>
    </div>
  );

  const YesNo = ({
    label, value, onChange, icon,
  }: {
    label: string;
    value: boolean;
    onChange: (b: boolean) => void;
    icon?: React.ReactNode;
  }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      <div className="flex border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#D97757] focus-within:ring-2 focus-within:ring-[#D97757]/20 transition-all">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`flex-1 py-2.5 text-xs font-bold transition-all ${
            value ? 'bg-[#132B25] text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`flex-1 py-2.5 text-xs font-bold transition-all ${
            !value ? 'bg-[#132B25] text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
          }`}
        >
          No
        </button>
      </div>
    </div>
  );

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-12 pb-8 px-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#132B25] flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {isEdit ? t('edit', lang) + ' ' + t('units', lang) : t('addUnit', lang)}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {selectedProperty
                  ? `${selectedProperty.name} — Unit ${unit?.unit_number || '...'}`
                  : t('addUnit', lang)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-4 py-3 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          {/* ── UNIT IDENTITY ─────────────────────────────── */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#D97757] mb-3">
              {lang === 'ar' ? 'هوية الوحدة' : 'Unit Identity'}
            </h3>

            {/* Property — locked read-only card */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                {t('properties', lang)} <span className="text-red-500">*</span>
              </label>
              {selectedProperty ? (
                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-[#132B25]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {selectedProperty.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium truncate">
                      {selectedProperty.city}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-500">
                    <Lock className="w-3 h-3" />
                    {lang === 'ar' ? 'مثبت' : 'Locked'}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  {lang === 'ar' ? 'لم يتم تحديد عقار.' : 'No property selected.'}
                </p>
              )}
              <p className="mt-1.5 text-[10px] text-slate-400">
                {t('propertyLockedHint', lang)}
              </p>
            </div>

            {/* Unit number + Floor + Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {lang === 'ar' ? 'رقم الوحدة' : 'Unit Number'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  placeholder="e.g. 12A, 1B, 203"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {t('floorLabel', lang)}
                </label>
                <select
                  value={floor ?? ''}
                  onChange={(e) => setFloor(e.target.value === '' ? null : Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 transition-all bg-white"
                >
                  <option value="">{lang === 'ar' ? 'اختر الطابق...' : 'Select floor...'}</option>
                  {FLOOR_OPTIONS.map(f => (
                    <option key={f.value} value={f.value}>
                      {f.label(lang)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {t('status', lang)}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as typeof status)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 transition-all bg-white"
                >
                  <option value="vacant">{lang === 'ar' ? 'شاغرة' : 'Vacant'}</option>
                  <option value="occupied">{lang === 'ar' ? 'مشغولة' : 'Occupied'}</option>
                  <option value="reserved">{lang === 'ar' ? 'محجوزة' : 'Reserved'}</option>
                  <option value="maintenance">{lang === 'ar' ? 'صيانة' : 'Maintenance'}</option>
                </select>
              </div>
            </div>
          </section>

          {/* ── UNIT SPECS (Qatar layout) ────────────────── */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#D97757] mb-3">
              {lang === 'ar' ? 'مواصفات الوحدة' : 'Unit Specs'}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Counter
                label={t('bedrooms', lang)}
                value={bedrooms}
                onChange={setBedrooms}
                min={0}
                max={10}
                icon={<Bed className="w-3.5 h-3.5" />}
              />
              <Counter
                label={t('bathrooms', lang)}
                value={bathrooms}
                onChange={setBathrooms}
                min={0}
                max={10}
                icon={<Bath className="w-3.5 h-3.5" />}
              />
              <Counter
                label={t('livingRooms', lang)}
                value={livingRooms}
                onChange={setLivingRooms}
                min={0}
                max={5}
                icon={<Sofa className="w-3.5 h-3.5" />}
              />
              <Counter
                label={t('kitchens', lang)}
                value={kitchens}
                onChange={setKitchens}
                min={0}
                max={3}
                icon={<CookingPot className="w-3.5 h-3.5" />}
              />
              <Counter
                label={t('balconies', lang)}
                value={balconies}
                onChange={setBalconies}
                min={0}
                max={5}
                icon={<Home className="w-3.5 h-3.5" />}
              />
              <Counter
                label={t('parkingSpaces', lang)}
                value={parkingSpaces}
                onChange={setParkingSpaces}
                min={0}
                max={10}
                icon={<ParkingSquare className="w-3.5 h-3.5" />}
              />
              <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <YesNo
                  label={t('hasMaidRoom', lang)}
                  value={hasMaidRoom}
                  onChange={setHasMaidRoom}
                  icon={<Users className="w-3.5 h-3.5" />}
                />
                <YesNo
                  label={t('hasDriverRoom', lang)}
                  value={hasDriverRoom}
                  onChange={setHasDriverRoom}
                  icon={<Users className="w-3.5 h-3.5" />}
                />
              </div>
            </div>

            {/* Area + Furnishing — text/number fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {lang === 'ar' ? 'المساحة (متر مربع)' : 'Area (m²)'}
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    value={areaSqft ?? ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/^0+(\d+\.?\d*)/, '$1');
                      const n = Number(raw);
                      if (raw === '' || Number.isFinite(n)) setAreaSqft(Math.max(0, n));
                    }}
                    placeholder="Optional"
                    className="w-full border border-slate-200 rounded-xl px-3.5 pe-16 py-2.5 text-sm outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 transition-all font-semibold text-[#132B25]"
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none group-focus-within:text-[#D97757] transition-colors">
                    م²
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {t('furnishing', lang)}
                </label>
                <select
                  value={furnishing}
                  onChange={(e) => setFurnishing(e.target.value as typeof furnishing)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 transition-all bg-white"
                >
                  <option value="unfurnished">{t('unfurnished', lang)}</option>
                  <option value="semi_furnished">{t('semiFurnished', lang)}</option>
                  <option value="fully_furnished">{t('fullyFurnished', lang)}</option>
                </select>
              </div>
            </div>
          </section>

          {/* ── FINANCIAL DETAILS ─────────────────────────── */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#D97757] mb-3">
              {lang === 'ar' ? 'التفاصيل المالية' : 'Financial Details'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {t('monthlyRent', lang)} ({currencySymbol}) <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none group-focus-within:text-[#D97757] transition-colors">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    value={monthlyRent}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/^0+(\d+\.?\d*)/, '$1');
                      const n = Number(raw);
                      if (raw === '' || Number.isFinite(n)) setMonthlyRent(Math.max(0, n));
                    }}
                    className="w-full border border-slate-200 rounded-xl ps-10 pe-3.5 py-2.5 text-sm outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 transition-all font-semibold text-[#132B25]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {t('securityDeposit', lang)} ({currencySymbol})
                </label>
                <div className="relative group">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none group-focus-within:text-[#D97757] transition-colors">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    value={securityDeposit ?? ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/^0+(\d+\.?\d*)/, '$1');
                      const n = Number(raw);
                      if (raw === '' || Number.isFinite(n)) setSecurityDeposit(Math.max(0, n));
                    }}
                    placeholder="Optional"
                    className="w-full border border-slate-200 rounded-xl ps-10 pe-3.5 py-2.5 text-sm outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 transition-all font-semibold text-[#132B25]"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-2">
                  {t('amenities', lang)}
                  <span className="text-slate-400 font-normal text-[10px]">
                    ({lang === 'ar' ? 'مفصولة بفاصلة' : 'comma-separated'})
                  </span>
                </label>
                <input
                  type="text"
                  value={amenitiesInput}
                  onChange={(e) => setAmenitiesInput(e.target.value)}
                  placeholder="ac, parking, balcony, gym, pool, etc."
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 transition-all"
                />
                {/* amenity chips preview */}
                {amenitiesInput.trim() && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {amenitiesInput
                      .split(',')
                      .map(s => s.trim().toLowerCase())
                      .filter(Boolean)
                      .slice(0, 12)
                      .map(a => (
                        <span
                          key={a}
                          className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold"
                        >
                          {a}
                        </span>
                      ))}
                  </div>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {t('description', lang)}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder={lang === 'ar' ? 'تفاصيل إضافية عن الوحدة...' : 'Additional unit details...'}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 transition-all resize-none"
                />
              </div>
            </div>
          </section>

          {/* ── GALLERY (URL tab removed) ─────────────────── */}
          <section>
            <ImageUploader
              value={unitImages}
              onChange={setUnitImages}
              multiple
              max={5}
              label={lang === 'ar' ? 'معرض الوحدة' : 'Unit Gallery'}
              hint={lang === 'ar' ? 'أضف حتى ٥ صور لهذه الوحدة' : 'Add up to 5 photos of this unit'}
              locale={lang}
              allowUrl={false}
            />
          </section>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-3">
              {isEdit && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 text-sm font-semibold px-3 py-2 rounded-xl transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('delete', lang)}
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                {t('cancel', lang)}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-[#132B25] hover:bg-[#1a3d34] disabled:bg-slate-400 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('loading', lang)}
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4" />
                    {isEdit ? t('save', lang) : t('addUnit', lang)}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
