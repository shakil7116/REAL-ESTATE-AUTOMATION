'use client';
// ==========================================
// /properties — Property listing page.
// Card-first layout: cover image fills the top
// of each card; dark green is reduced to a
// floating status pill and hover state. The
// whole card is a Link to /properties/[id].
// ==========================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2, Plus, Layers, TrendingUp, Home, Warehouse, Store,
  MapPin, Filter, ChevronRight,
} from 'lucide-react';
import { notifyChange } from '@/lib/store';
import type { Property, Unit } from '@/lib/database';
import { useCountry } from '@/context/CountryContext';
import { t, type Locale } from '@/lib/i18n';
import {
  Button, Card, StatusPill, ProgressBar, Avatar, EmptyState,
  SearchInput, PageHeader, KpiRow, StatCard, SlideOver,
} from '@/components/ui';

const propertyTypeIcon: Record<string, JSX.Element> = {
  residential: <Home className="w-4 h-4" />,
  commercial: <Store className="w-4 h-4" />,
  mixed: <Layers className="w-4 h-4" />,
};

/** Derive a "Healthy / Attention / Maintenance" health from units + tickets. */
function deriveHealth(units: Unit[]): { label: string; status: 'active' | 'pending' | 'danger' } {
  if (units.length === 0) return { label: 'Attention', status: 'pending' };
  const occupied = units.filter(u => u.status === 'occupied').length;
  const occupancyPct = (occupied / units.length) * 100;
  if (occupancyPct >= 80) return { label: 'Healthy', status: 'active' };
  if (occupancyPct >= 50) return { label: 'Attention', status: 'pending' };
  return { label: 'Maintenance', status: 'danger' };
}

const HEALTH_TONE: Record<'active' | 'pending' | 'danger', string> = {
  active:  'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30',
  pending: 'bg-amber-500/20 text-amber-200 border border-amber-400/30',
  danger:  'bg-rose-500/20 text-rose-200 border border-rose-400/30',
};

const HEALTH_AR: Record<string, string> = {
  Healthy: 'سليم',
  Attention: 'انتباه',
  Maintenance: 'صيانة',
};

export default function PropertiesPage() {
  const [lang, setLang] = useState<Locale>('en');
  const isRtl = lang === 'ar';
  const tr = (en: string, ar: string) => (isRtl ? ar : en);
  const { country } = useCountry();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', address: '', city: '', country: country.name,
    property_type: 'residential', total_units: '1', description: '', status: 'active',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, uRes] = await Promise.all([
        fetch('/api/properties', { cache: 'no-store' }),
        fetch('/api/units', { cache: 'no-store' }),
      ]);
      const pData = await pRes.json();
      const uData = await uRes.json();
      if (pData.success) setProperties(pData.data as Property[]);
      if (uData.success) setUnits(uData.data as Unit[]);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, total_units: Number(form.total_units) }),
      });
      const data = await res.json();
      if (data.success) {
        notifyChange('property_created', tr(
          `Property "${form.name}" created`,
          `تم إنشاء العقار "${form.name}"`,
        ));
        setShowForm(false);
        setForm({
          name: '', address: '', city: '', country: country.name,
          property_type: 'residential', total_units: '1', description: '', status: 'active',
        });
        void fetchData();
      }
    } catch {
      // error handled
    }
  };

  const unitsFor = (propertyId: string) => units.filter(u => u.property_id === propertyId);

  const filtered = properties.filter(p => {
    const matchesSearch = (p.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.address ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.city ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || p.property_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalUnits = properties.reduce((s, p) => s + p.total_units, 0);
  const totalOccupied = units.filter(u => u.status === 'occupied').length;
  const totalVacant = Math.max(0, totalUnits - totalOccupied);
  const portfolioOccupancy = totalUnits > 0 ? Math.round((totalOccupied / totalUnits) * 100) : 0;

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-end justify-between gap-3">
        <PageHeader
          title={tr('Properties & Units', 'العقارات والوحدات')}
          subtitle={tr('Manage your real estate portfolio', 'إدارة محفظتك العقارية')}
          action={
            <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>
              {tr('New Property', 'عقار جديد')}
            </Button>
          }
        />
        <button
          onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
          className="text-xs font-bold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 transition-all hover:bg-white"
        >
          {lang === 'en' ? 'العربية' : 'English'}
        </button>
      </div>

      {/* KPI Row */}
      <KpiRow>
        <StatCard
          icon={<Building2 className="w-5 h-5" />}
          value={properties.length}
          label={tr('Total Properties', 'إجمالي العقارات')}
          tone="slate"
        />
        <StatCard
          icon={<Layers className="w-5 h-5" />}
          value={totalUnits}
          label={tr('Total Units', 'إجمالي الوحدات')}
          tone="sky"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          value={`${portfolioOccupancy}%`}
          label={tr('Portfolio Occupancy', 'إشغال المحفظة')}
          tone="emerald"
        />
        <StatCard
          icon={<Home className="w-5 h-5" />}
          value={totalVacant}
          label={tr('Vacant Units', 'وحدات فارغة')}
          tone="amber"
        />
      </KpiRow>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={tr('Search properties…', 'البحث في العقارات…')}
            className="flex-1"
          />
          <div className="relative sm:w-48">
            <Filter className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full ps-10 pe-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757] appearance-none"
            >
              <option value="all">{tr('All Types', 'جميع الأنواع')}</option>
              <option value="residential">{tr('Residential', 'سكني')}</option>
              <option value="commercial">{tr('Commercial', 'تجاري')}</option>
              <option value="mixed">{tr('Mixed', 'مختلط')}</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Property card grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-72 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Building2 className="w-6 h-6" />}
            title={properties.length === 0 ? t('noProperties', lang) : tr('No properties match your search', 'لا توجد عقارات مطابقة')}
            description={properties.length === 0 ? tr('Add your first property to start tracking units and tenants.', 'أضف عقارك الأول لبدء تتبع الوحدات والمستأجرين.') : undefined}
            action={properties.length === 0 ? (
              <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>
                {tr('Add Property', 'إضافة عقار')}
              </Button>
            ) : undefined}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => {
            const us = unitsFor(p.id);
            const occupied = us.filter(u => u.status === 'occupied').length;
            const totalU = us.length || p.total_units;
            const vacant = Math.max(0, totalU - occupied);
            const occupancy = totalU > 0 ? Math.round((occupied / totalU) * 100) : 0;
            const health = deriveHealth(us);
            const cover = p.images?.[0];
            const healthLabel = isRtl ? (HEALTH_AR[health.label] || health.label) : health.label;

            return (
              <Link
                key={p.id}
                href={`/properties/${p.id}`}
                className="group block bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                {/* Cover image area */}
                <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1A3830] via-[#132B25] to-[#0D2A24] flex flex-col items-center justify-center">
                      <Building2 className="w-12 h-12 text-white/15" />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/30 mt-2">
                        {tr('No image yet', 'لا توجد صورة بعد')}
                      </span>
                    </div>
                  )}

                  {/* Status pill top-right */}
                  <span className={`absolute top-3 end-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-sm ${HEALTH_TONE[health.status]}`}>
                    {healthLabel}
                  </span>

                  {/* Type icon top-left */}
                  <div className="absolute top-3 start-3 w-9 h-9 rounded-xl bg-white/85 backdrop-blur-sm border border-white/40 flex items-center justify-center text-[#132B25]">
                    {propertyTypeIcon[p.property_type] || <Building2 className="w-4 h-4" />}
                  </div>

                  {/* Bottom gradient + name overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0D2A24]/85 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="font-extrabold text-white text-base drop-shadow-sm truncate">
                      {p.name}
                    </h3>
                    <p className="text-xs text-white/85 mt-0.5 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{p.city}</span>
                    </p>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3">
                  <div className="flex items-end justify-between text-xs text-slate-500">
                    <span className="font-semibold">{tr('Occupancy', 'الإشغال')}</span>
                    <span className="font-extrabold text-[#0D2A24]">{occupied}/{totalU} {tr('units', 'وحدات')}</span>
                  </div>
                  <ProgressBar value={occupancy} height="sm" />

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-slate-400 font-semibold">{tr('Occupied', 'مشغول')}</div>
                        <div className="font-extrabold text-emerald-600">{occupied}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-semibold">{tr('Vacant', 'فارغ')}</div>
                        <div className="font-extrabold text-amber-600">{vacant}</div>
                      </div>
                    </div>
                    <span className="text-[#132B25] font-extrabold flex items-center gap-1 group-hover:gap-2 transition-all">
                      {t('viewProperty', lang)}
                      <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create property slide-over */}
      <SlideOver
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={tr('Add Property', 'إضافة عقار')}
        subtitle={tr('Add a new building or development to your portfolio', 'أضف مبنى أو تطويراً جديداً إلى محفظتك')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>{tr('Cancel', 'إلغاء')}</Button>
            <Button variant="dark" type="submit" form="property-form">{tr('Save Property', 'حفظ العقار')}</Button>
          </>
        }
      >
        <form id="property-form" onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Property Name', 'اسم العقار')}</label>
              <input required placeholder={tr('e.g. Marina Tower', 'مثال: برج مارينا')} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Total Units', 'إجمالي الوحدات')}</label>
              <input type="number" min="1" required inputMode="numeric" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757] font-semibold" value={form.total_units} onChange={e => { const raw = e.target.value.replace(/^0+(\d+)/, '$1'); setForm({ ...form, total_units: raw }); }} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Address', 'العنوان')}</label>
              <input required className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('City', 'المدينة')}</label>
              <input required className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Country', 'الدولة')}</label>
              <input className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Property Type', 'نوع العقار')}</label>
              <select className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.property_type} onChange={e => setForm({ ...form, property_type: e.target.value })}>
                <option value="residential">{tr('Residential', 'سكني')}</option>
                <option value="commercial">{tr('Commercial', 'تجاري')}</option>
                <option value="mixed">{tr('Mixed', 'مختلط')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Status', 'الحالة')}</label>
              <select className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="active">{tr('Active', 'نشط')}</option>
                <option value="under_renovation">{tr('Under Renovation', 'قيد التجديد')}</option>
                <option value="inactive">{tr('Inactive', 'غير نشط')}</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Description (optional)', 'الوصف (اختياري)')}</label>
              <textarea rows={3} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="sm:col-span-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
              💡 {tr(
                'Want to add a cover image? Use the full editor after creating — it supports drag-and-drop image upload.',
                'هل تريد إضافة صورة غلاف؟ استخدم المحرر الكامل بعد الإنشاء — يدعم رفع الصور بالسحب والإفلات.',
              )}
            </div>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
