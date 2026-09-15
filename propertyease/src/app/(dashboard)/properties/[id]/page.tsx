'use client';
// ==========================================
// /properties/[id] — Property detail page.
// Hero, KPIs, unit grid. Edit via PropertyModal.
// Add unit via UnitModal preselected with property_id.
// ==========================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Plus, Home, Bed, DollarSign, Loader2, Edit3,
} from 'lucide-react';
import PropertyHero from '@/components/PropertyHero';
import UnitCardCompact from '@/components/UnitCardCompact';
import PropertyModal from '@/components/PropertyModal';
import UnitModal from '@/components/UnitModal';
import { Button, StatCard, KpiRow, EmptyState, Card } from '@/components/ui';
import { useCountry } from '@/context/CountryContext';
import { notifyChange } from '@/lib/store';
import { t, type Locale } from '@/lib/i18n';
import type { Property, Unit } from '@/lib/database';

interface PageProps {
  params: { id: string };
}

export default function PropertyDetailPage({ params }: PageProps) {
  const { id } = params;
  const router = useRouter();
  const { currencySymbol } = useCountry();
  const [lang, setLang] = useState<Locale>('en');
  const isRtl = lang === 'ar';

  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addUnitOpen, setAddUnitOpen] = useState(false);

  const tr = (en: string, ar: string) => (isRtl ? ar : en);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, uRes] = await Promise.all([
        fetch(`/api/properties`, { cache: 'no-store' }),
        fetch(`/api/units?property_id=${encodeURIComponent(id)}`, { cache: 'no-store' }),
      ]);
      const pData = await pRes.json();
      const uData = await uRes.json();

      if (pData.ok) {
        const found = (pData.data as Property[]).find(p => p.id === id) || null;
        setProperty(found);
        if (!found) setNotFound(true);
      } else {
        setNotFound(true);
      }
      if (uData.ok) setUnits(uData.data as Unit[]);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-[#D97757] animate-spin" />
        <p className="text-xs text-slate-400 font-semibold">{tr('Loading…', 'جارٍ التحميل…')}</p>
      </div>
    );
  }

  if (notFound || !property) {
    return (
      <Card>
        <EmptyState
          icon={<Building2 className="w-6 h-6" />}
          title={t('propertyNotFound', lang)}
          description={tr(
            "We couldn't find this property. It may have been deleted or the link is wrong.",
            'لم نتمكن من العثور على هذا العقار. ربما تم حذفه أو أن الرابط غير صحيح.',
          )}
          action={
            <Button variant="dark" onClick={() => router.push('/properties')}>
              {t('backToProperties', lang)}
            </Button>
          }
        />
      </Card>
    );
  }

  const totalUnits = units.length || property.total_units;
  const occupied = units.filter(u => u.status === 'occupied').length;
  const vacant = Math.max(0, totalUnits - occupied);
  const occupancy = totalUnits > 0 ? Math.round((occupied / totalUnits) * 100) : 0;
  const rentRoll = units.reduce((s, u) => s + Number(u.monthly_rent), 0);

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Hero */}
      <PropertyHero
        name={property.name}
        address={property.address}
        city={property.city}
        country={property.country}
        status={property.status}
        coverUrl={property.images?.[0] ?? null}
        isRtl={isRtl}
        locale={lang}
        action={
          <Button
            variant="primary"
            icon={<Edit3 className="w-4 h-4" />}
            onClick={() => setEditOpen(true)}
          >
            {t('editProperty', lang)}
          </Button>
        }
      />

      {/* Language toggle (top-right of page area, kept simple) */}
      <div className="flex items-center justify-end -mt-4">
        <button
          onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
          className="text-xs font-bold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 transition-all hover:bg-white"
        >
          {lang === 'en' ? 'العربية' : 'English'}
        </button>
      </div>

      {/* KPI strip */}
      <KpiRow>
        <StatCard
          icon={<Home className="w-5 h-5" />}
          value={totalUnits}
          label={tr('Total units', 'إجمالي الوحدات')}
          tone="slate"
        />
        <StatCard
          icon={<Bed className="w-5 h-5" />}
          value={occupied}
          label={tr('Occupied', 'مشغول')}
          tone="emerald"
        />
        <StatCard
          icon={<Building2 className="w-5 h-5" />}
          value={vacant}
          label={tr('Vacant', 'فارغ')}
          tone="amber"
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          value={`${currencySymbol} ${rentRoll.toLocaleString()}`}
          label={tr('Monthly rent roll', 'قائمة الإيجار الشهرية')}
          tone="orange"
        />
      </KpiRow>

      {/* Occupancy bar */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              {tr('Occupancy', 'الإشغال')}
            </span>
            <span className="text-xs font-black text-[#132B25]">{occupancy}%</span>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">
            {occupied} / {totalUnits} {tr('units', 'وحدات')}
          </span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-[#132B25] to-[#D97757]"
            style={{ width: `${occupancy}%` }}
          />
        </div>
      </Card>

      {/* Units header + Add unit button */}
      <div className="flex items-end justify-between gap-3 pt-2">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {t('unitsInProperty', lang).replace('{name}', property.name)}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {tr('Each unit can be edited, leased, or listed for rent.', 'كل وحدة يمكن تعديلها أو تأجيرها أو عرضها للإيجار.')}
          </p>
        </div>
        <Button
          variant="dark"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setAddUnitOpen(true)}
        >
          {tr('Add unit', 'إضافة وحدة')}
        </Button>
      </div>

      {/* Units grid */}
      {units.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Home className="w-6 h-6" />}
            title={t('noUnitsInProperty', lang)}
            description={tr(
              'Start by adding units to this property — they will appear here and on the Units page.',
              'ابدأ بإضافة وحدات لهذا العقار — ستظهر هنا وفي صفحة الوحدات.',
            )}
            action={
              <Button variant="dark" icon={<Plus className="w-4 h-4" />} onClick={() => setAddUnitOpen(true)}>
                {t('addFirstUnit', lang)}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {units.map(u => (
            <UnitCardCompact
              key={u.id}
              id={u.id}
              unitNumber={u.unit_number}
              floor={u.floor}
              floorLabel={u.floor_label}
              bedrooms={u.bedrooms}
              bathrooms={u.bathrooms}
              livingRooms={u.living_rooms}
              kitchens={u.kitchens}
              hasMaidRoom={u.has_maid_room}
              hasDriverRoom={u.has_driver_room}
              balconies={u.balconies}
              parkingSpaces={u.parking_spaces}
              hasStorage={u.has_storage}
              areaSqft={u.area_sqft}
              monthlyRent={Number(u.monthly_rent)}
              furnishing={u.furnishing}
              status={u.status}
              images={u.images}
              currencySymbol={currencySymbol}
              isRtl={isRtl}
              locale={lang}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <PropertyModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        property={property}
        lang={lang}
        onSuccess={() => {
          notifyChange('property_updated', tr(`Property "${property.name}" updated`, `تم تحديث العقار "${property.name}"`));
          void fetchData();
        }}
      />
      <UnitModal
        isOpen={addUnitOpen}
        onClose={() => setAddUnitOpen(false)}
        unit={null}
        properties={[property]}
        defaultPropertyId={property.id}
        lang={lang}
        onSuccess={() => {
          notifyChange('unit_created', tr('Unit created', 'تم إنشاء الوحدة'));
          void fetchData();
        }}
      />
    </div>
  );
}
