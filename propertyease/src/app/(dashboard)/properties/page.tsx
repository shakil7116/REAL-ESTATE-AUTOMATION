'use client';

import { useState, useEffect } from 'react';
import { Building2, Plus, Layers, TrendingUp, Home, Warehouse, Store, MapPin, Filter } from 'lucide-react';
import { notifyChange } from '@/lib/store';
import type { Property, Unit } from '@/lib/database';
import { useCountry } from '@/context/CountryContext';
import { Button, Card, StatusPill, ProgressBar, Avatar, EmptyState, SearchInput, PageHeader, KpiRow, StatCard, SlideOver } from '@/components/ui';

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

export default function PropertiesPage() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const isRtl = lang === 'ar';
  const tr = (en: string, ar: string) => isRtl ? ar : en;
  const { country } = useCountry();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', city: '', country: country.name, property_type: 'residential', total_units: '1', description: '', status: 'active' });

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

  useEffect(() => { fetchData(); }, []);

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
        notifyChange('property_created', tr(`Property "${form.name}" created`, `تم إنشاء العقار "${form.name}"`));
        setShowForm(false);
        setForm({ name: '', address: '', city: '', country: country.name, property_type: 'residential', total_units: '1', description: '', status: 'active' });
        fetchData();
      }
    } catch {
      // error handled
    }
  };

  const unitsFor = (propertyId: string) => units.filter(u => u.property_id === propertyId);
  const occupancyFor = (propertyId: string) => {
    const us = unitsFor(propertyId);
    if (us.length === 0) return 0;
    return Math.round((us.filter(u => u.status === 'occupied').length / us.length) * 100);
  };

  const filtered = properties.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || p.property_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalUnits = properties.reduce((s, p) => s + p.total_units, 0);
  const totalOccupied = units.filter(u => u.status === 'occupied').length;
  const totalVacant = Math.max(0, totalUnits - totalOccupied);
  const portfolioOccupancy = totalUnits > 0 ? Math.round((totalOccupied / totalUnits) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={tr('Properties & Units', 'العقارات والوحدات')}
        subtitle={tr('Manage your real estate portfolio', 'إدارة محفظتك العقارية')}
        action={
          <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>
            {tr('New Property', 'عقار جديد')}
          </Button>
        }
      />

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

      {/* Property card grid (mockup-aligned) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => <div key={i} className="h-56 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Building2 className="w-6 h-6" />}
            title={properties.length === 0 ? tr('No properties yet', 'لا توجد عقارات بعد') : tr('No properties match your search', 'لا توجد عقارات مطابقة')}
            description={properties.length === 0 ? tr('Add your first property to start tracking units and tenants.', 'أضف عقارك الأول لبدء تتبع الوحدات والمستأجرين.') : undefined}
            action={properties.length === 0 ? <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>{tr('Add Property', 'إضافة عقار')}</Button> : undefined}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => {
            const us = unitsFor(p.id);
            const occupied = us.filter(u => u.status === 'occupied').length;
            const vacant = Math.max(0, us.length - occupied);
            const occupancy = us.length > 0 ? Math.round((occupied / us.length) * 100) : 0;
            const health = deriveHealth(us);
            const typeIcon = propertyTypeIcon[p.property_type] || <Building2 className="w-4 h-4" />;
            return (
              <Card key={p.id} hover className="p-0 overflow-hidden flex flex-col">
                {/* Gradient header with status pill */}
                <div className="relative h-20 bg-gradient-to-br from-[#132B25] via-[#1A3830] to-[#0D2A24] px-5 pt-5">
                  <div className="absolute inset-0 bg-grid-pattern opacity-[0.05]" />
                  <div className="relative flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                      {typeIcon}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      health.status === 'active'  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' :
                      health.status === 'pending' ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30' :
                                                   'bg-rose-500/20 text-rose-200 border border-rose-400/30'
                    }`}>
                      {tr(health.label, health.label === 'Healthy' ? 'سليم' : health.label === 'Attention' ? 'انتباه' : 'صيانة')}
                    </span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-[#0D2A24] text-base truncate">{p.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{p.address}, {p.city}</span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-end justify-between text-xs text-slate-500">
                    <span className="font-semibold">{tr('Occupancy', 'الإشغال')}</span>
                    <span className="font-extrabold text-[#0D2A24]">{occupied}/{us.length || p.total_units} {tr('units', 'وحدات')}</span>
                  </div>
                  <ProgressBar value={occupancy} className="mt-1.5" />
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
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
                    <StatusPill status={p.status} />
                  </div>
                </div>
              </Card>
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
              <input type="number" min="1" required className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.total_units} onChange={e => setForm({ ...form, total_units: e.target.value })} />
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
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
