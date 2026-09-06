'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Building2, Plus, Search, Filter, Home,
  Edit2, Trash2, Loader2, AlertCircle, ChevronRight, MapPin,
  Bed, Bath, Maximize2, Calendar, DollarSign
} from 'lucide-react';
import UnitModal from '@/components/UnitModal';
import { useCountry } from '@/context/CountryContext';

interface Property {
  id: string;
  name: string;
  city: string;
}

interface Unit {
  id: string;
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
  property?: {
    id: string;
    name: string;
    city: string;
  };
}

export default function UnitsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="relative">
          <Loader2 className="w-8 h-8 text-[#D97757] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#D97757]" />
          </div>
        </div>
        <p className="text-xs text-slate-400 font-semibold">Loading…</p>
      </div>
    }>
      <UnitsContent />
    </Suspense>
  );
}

function UnitsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedPropertyId = searchParams.get('property_id') || undefined;

  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const isRtl = lang === 'ar';
  const tr = (en: string, ar: string) => isRtl ? ar : en;
  const { currencySymbol } = useCountry();
  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(preselectedPropertyId || '');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [unitsRes, propsRes] = await Promise.all([
        fetch('/api/units', { cache: 'no-store' }),
        fetch('/api/properties', { cache: 'no-store' }),
      ]);
      const unitsData = await unitsRes.json();
      const propsData = await propsRes.json();

      if (!unitsData.ok) throw new Error(unitsData.error);
      if (!propsData.ok) throw new Error(propsData.error);

      setUnits(unitsData.data || []);
      setProperties(propsData.data || []);

      if (preselectedPropertyId && !selectedPropertyId) {
        setSelectedPropertyId(preselectedPropertyId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [preselectedPropertyId]);

  const handleDelete = async (id: string, unitNumber: string) => {
    if (!confirm(`Delete Unit ${unitNumber}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/units?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setUnits(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const filtered = units.filter(u => {
    const matchesSearch = u.unit_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.property?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.property?.city || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || u.status === filterStatus;
    const matchesProperty = !selectedPropertyId || u.property_id === selectedPropertyId;
    return matchesSearch && matchesFilter && matchesProperty;
  });

  const getStatusBadge = (status: string) => {
    const map: Record<string, { class: string; label: string }> = {
      occupied:    { class: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: tr('Occupied', 'مشغول') },
      vacant:      { class: 'bg-blue-100 text-blue-700 border-blue-200',         label: tr('Vacant', 'فارغ') },
      reserved:    { class: 'bg-amber-100 text-amber-700 border-amber-200',       label: tr('Reserved', 'محجوز') },
      maintenance: { class: 'bg-rose-100 text-rose-700 border-rose-200',         label: tr('Maintenance', 'صيانة') },
    };
    const s = map[status] || map.vacant;
    return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${s.class}`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{s.label}</span>;
  };

  const getFurnishingLabel = (f: string) => {
    const map: Record<string, string> = {
      unfurnished:     tr('Unfurnished', 'غير مفروش'),
      semi_furnished:  tr('Semi-Furnished', 'نصف مفروش'),
      fully_furnished: tr('Fully Furnished', 'مفروش بالكامل'),
    };
    return map[f] || f;
  };

  const totalRentRoll = units.reduce((s, u) => s + u.monthly_rent, 0);
  const occupiedCount = units.filter(u => u.status === 'occupied').length;
  const vacantCount = units.filter(u => u.status === 'vacant').length;
  const occupancyRate = units.length > 0 ? Math.round((occupiedCount / units.length) * 100) : 0;
  const loadingSpinner = (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="relative">
        <Loader2 className="w-8 h-8 text-[#D97757] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-[#D97757]" />
        </div>
      </div>
      <p className="text-xs text-slate-400 font-semibold">{tr('Loading units…', 'جارِ تحميل الوحدات…')}</p>
    </div>
  );

  if (loading) return loadingSpinner;

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#D97757] bg-orange-50 border border-orange-100 px-3 py-1 rounded-full mb-2">
            <Home className="w-3 h-3" />
            {tr('UNIT DIRECTORY', 'دليل الوحدات')}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{tr('Units & Residences', 'الوحدات والسكنيات')}</h1>
          <p className="text-sm text-slate-500 font-medium">{tr('Every unit across your portfolio — rent rolls, specs, occupancy & availability.', 'كل وحدة في محفظتك — قوائم الإيجار، المواصفات، الإشغال والتوفر.')}</p>
        </div>
        <div className="flex items-center gap-3">
          {preselectedPropertyId && properties.find(p => p.id === preselectedPropertyId) && (
            <button
              onClick={() => router.push('/units')}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-2 border border-slate-200 rounded-xl transition-all hover:bg-white"
            >
              {tr('← All Units', '← جميع الوحدات')}
            </button>
          )}
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl px-3 py-2 transition-all hover:bg-white"
          >
            {lang === 'en' ? 'العربية' : 'English'}
          </button>
          <select
            value={selectedPropertyId}
            onChange={(e) => { setSelectedPropertyId(e.target.value); setSearchQuery(''); }}
            className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none focus:border-[#D97757] transition-all"
          >
            <option value="">{tr('All Properties', 'جميع العقارات')}</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
            ))}
          </select>
          <button
            onClick={() => {
              setEditingUnit(null);
              setSelectedPropertyId(preselectedPropertyId || (properties[0]?.id || ''));
              setShowForm(true);
            }}
            className="bg-[#132B25] hover:bg-[#1A3831] text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-[#132B25]/20 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            {tr('Add Unit', 'إضافة وحدة')}
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: tr('Total Units', 'إجمالي الوحدات'), value: String(units.length), color: '#132B25', bg: 'bg-[#132B25]/10', ico: Home },
          { label: tr('Occupied', 'المشغولة'), value: String(occupiedCount), color: '#059669', bg: 'bg-emerald-50', ico: Bed },
          { label: tr('Vacant', 'الفارغة'), value: String(vacantCount), color: '#2563EB', bg: 'bg-blue-50', ico: Maximize2 },
          { label: tr('Monthly Rent Roll', 'قائمة الإيجار الشهرية'), value: `${currencySymbol} ${totalRentRoll.toLocaleString()}`, color: '#D97757', bg: 'bg-orange-50', ico: DollarSign },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.ico className="w-4 h-4" style={{ color: stat.color }} />
              </div>
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</div>
            <div className="text-xl font-extrabold text-slate-900 tracking-tight">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Occupancy Progress */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{tr('Occupancy Rate', 'نسبة الإشغال')}</span>
            <span className="text-xs font-black text-[#132B25]">{occupancyRate}%</span>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">{occupiedCount} / {units.length} {tr('units occupied', 'وحدات مشغولة')}</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-[#132B25] to-[#D97757]"
            style={{ width: `${occupancyRate}%` }}
          />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={fetchData} className="me-auto font-bold underline">{tr('Retry', 'إعادة المحاولة')}</button>
        </div>
      )}

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            placeholder={tr('Search by unit number or property…', 'ابحث برقم الوحدة أو العقار…')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full input-field ps-10 pe-4 text-xs py-2.5 bg-white shadow-sm rounded-xl"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {[
            { key: 'all', label: tr('All', 'الكل') },
            { key: 'vacant', label: tr('Vacant', 'فارغ') },
            { key: 'occupied', label: tr('Occupied', 'مشغول') },
            { key: 'reserved', label: tr('Reserved', 'محجوز') },
            { key: 'maintenance', label: tr('Maintenance', 'صيانة') },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                filterStatus === key
                  ? 'bg-[#132B25] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && !loading && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-base font-extrabold text-slate-700 mb-1">{tr('No units found', 'لا توجد وحدات')}</h3>
          <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
            {selectedPropertyId ? tr('This property has no units yet. Add one now.', 'هذا العقار لا يحتوي على وحدات بعد. أضف وحدة الآن.') : tr('Start by adding units to your properties.', 'ابدأ بإضافة وحدات إلى عقاراتك.')}
          </p>
          <button
            onClick={() => {
              setEditingUnit(null);
              setSelectedPropertyId(preselectedPropertyId || (properties[0]?.id || ''));
              setShowForm(true);
            }}
            className="bg-[#132B25] hover:bg-[#1A3831] text-white font-bold py-2.5 px-6 rounded-xl text-xs inline-flex items-center gap-2 shadow-lg shadow-[#132B25]/20 hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            {tr('Add Your First Unit', 'أضف أول وحدة لك')}
          </button>
        </div>
      )}

      {/* Unit Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((unit) => (
          <div key={unit.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-extrabold text-slate-900">{tr('Unit', 'وحدة')} {unit.unit_number}</h3>
                    {unit.floor != null && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">{tr('Floor', 'طابق')} {unit.floor}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <MapPin className="w-3 h-3 text-[#D97757]" />
                    <span>{unit.property?.name || tr('Unknown Property', 'عقار غير معروف')}</span>
                  </div>
                </div>
                {getStatusBadge(unit.status)}
              </div>

              <div className="grid grid-cols-3 gap-2 bg-[#F6F8F6] p-3 rounded-xl border border-slate-100 mb-4">
                <div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    <Bed className="w-3 h-3" /> {tr('Beds', 'غرف')}
                  </div>
                  <div className="text-sm font-extrabold text-[#132B25]">{unit.bedrooms}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    <Bath className="w-3 h-3" /> {tr('Baths', 'حمامات')}
                  </div>
                  <div className="text-sm font-extrabold text-[#132B25]">{unit.bathrooms}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    <Maximize2 className="w-3 h-3" /> {tr('Area', 'المساحة')}
                  </div>
                  <div className="text-sm font-extrabold text-[#132B25]">
                    {unit.area_sqft ? `${Math.round(Number(unit.area_sqft))} m²` : '—'}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                    <DollarSign className="w-3 h-3 text-[#D97757]" />
                    {tr('Monthly Rent', 'الإيجار الشهري')}
                  </span>
                  <span className="font-extrabold text-[#132B25]">{currencySymbol} {Number(unit.monthly_rent).toLocaleString()}</span>
                </div>
                {unit.security_deposit != null && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold">{tr('Security Deposit', 'وديعة التأمين')}</span>
                    <span className="font-semibold text-slate-600">{currencySymbol} {Number(unit.security_deposit).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">{tr('Furnishing', 'التجهيز')}</span>
                  <span className="font-semibold text-slate-600">{getFurnishingLabel(unit.furnishing)}</span>
                </div>
              </div>

              {unit.amenities && unit.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {unit.amenities.slice(0, 4).map(a => (
                    <span key={a} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">{a}</span>
                  ))}
                  {unit.amenities.length > 4 && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#132B25] text-white">+{unit.amenities.length - 4}</span>
                  )}
                </div>
              )}
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{unit.property?.city || ''}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setEditingUnit(unit); setShowForm(true); }}
                  className="p-2 hover:bg-white hover:shadow-sm text-slate-400 hover:text-[#132B25] rounded-xl transition-all"
                  title={tr('Edit', 'تعديل')}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(unit.id, unit.unit_number)}
                  className="p-2 hover:bg-white hover:shadow-sm text-slate-400 hover:text-rose-600 rounded-xl transition-all"
                  title={tr('Delete', 'حذف')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => window.location.href = `/leases?unit_id=${unit.id}`}
                  className="bg-[#132B25] hover:bg-[#1A3831] text-white font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition-all ms-1 text-xs"
                >
                  <span>{tr('Leases', 'عقود')}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <UnitModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        unit={editingUnit}
        properties={properties}
        defaultPropertyId={selectedPropertyId}
        onSuccess={() => {
          fetchData();
          setEditingUnit(null);
        }}
      />
    </div>
  );
}
