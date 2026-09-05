'use client';

import { useState, useEffect } from 'react';
import { X, Building2, MapPin, Home, Edit2, Trash2, Plus, AlertCircle } from 'lucide-react';
import { useCountry } from '@/context/CountryContext';
import ImageUploader from '@/components/ImageUploader';

export interface Property {
  id: string;
  name: string;
  name_ar?: string | null;
  address: string;
  address_ar?: string | null;
  city: string;
  country: string;
  property_type: 'residential' | 'commercial' | 'mixed';
  total_units: number;
  description?: string | null;
  description_ar?: string | null;
  status: 'active' | 'under_renovation' | 'inactive';
  monthly_maintenance_fee?: number | null;
  images?: string[];
}

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property?: Property | null;
  lang?: 'en' | 'ar';
  onSuccess: () => void;
}

export default function PropertyModal({ isOpen, onClose, property, lang = 'en', onSuccess }: PropertyModalProps) {
  const { currencySymbol } = useCountry();
  const isEdit = !!property?.id;
  const tr = (en: string, ar: string) => lang === 'ar' ? ar : en;

  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [address, setAddress] = useState('');
  const [addressAr, setAddressAr] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Qatar');
  const [propertyType, setPropertyType] = useState<'residential' | 'commercial' | 'mixed'>('residential');
  const [totalUnits, setTotalUnits] = useState(0);
  const [description, setDescription] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [status, setStatus] = useState<'active' | 'under_renovation' | 'inactive'>('active');
  const [monthlyMaintenanceFee, setMonthlyMaintenanceFee] = useState<number | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (property) {
      setName(property.name || '');
      setNameAr(property.name_ar || '');
      setAddress(property.address || '');
      setAddressAr(property.address_ar || '');
      setCity(property.city || '');
      setCountry(property.country || 'Qatar');
      setPropertyType(property.property_type || 'residential');
      setTotalUnits(property.total_units || 0);
      setDescription(property.description || '');
      setDescriptionAr(property.description_ar || '');
      setStatus(property.status || 'active');
      setMonthlyMaintenanceFee(property.monthly_maintenance_fee ?? null);
      setCoverImageUrl(property.images?.[0] || '');
    } else {
      // Reset form for new property
      setName('');
      setNameAr('');
      setAddress('');
      setAddressAr('');
      setCity('');
      setCountry('Qatar');
      setPropertyType('residential');
      setTotalUnits(0);
      setDescription('');
      setDescriptionAr('');
      setStatus('active');
      setMonthlyMaintenanceFee(null);
      setCoverImageUrl('');
    }
    setError(null);
  }, [property, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !city.trim()) {
      setError('Name, address, and city are required');
      return;
    }

    setLoading(true);
    setError(null);

    const payload: Partial<Property> = {
      name: name.trim(),
      name_ar: nameAr.trim() || undefined,
      address: address.trim(),
      address_ar: addressAr.trim() || undefined,
      city: city.trim(),
      country,
      property_type: propertyType,
      total_units: totalUnits,
      description: description.trim() || undefined,
      description_ar: descriptionAr.trim() || undefined,
      status,
      monthly_maintenance_fee: monthlyMaintenanceFee,
      images: coverImageUrl.trim() ? [coverImageUrl.trim()] : [],
    };

    try {
      const url = isEdit
        ? `/api/properties?id=${property!.id}`
        : '/api/properties';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save property');
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
    if (!property?.id) return;
    if (!confirm(`Are you sure you want to delete "${property.name}"? All units in this property will also be deleted.`)) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/properties?id=${property.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-16 pb-8 px-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#132B25] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {isEdit ? tr('Edit Property', 'تعديل العقار') : tr('Add New Property', 'إضافة عقار جديد')}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {isEdit ? tr('Update property details below', 'تحديث تفاصيل العقار أدناه') : tr('Create a new property asset in your portfolio', 'إنشاء أصل عقاري جديد في محفظتك')}
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
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Basic Info Section */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#D97757] mb-3">{tr('Basic Information', 'المعلومات الأساسية')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {tr('Property Name', 'اسم العقار')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Al Mansura Complex"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 transition-all"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {tr('Arabic Name', 'الاسم بالعربية')}{' '}
                  <span className="text-slate-400 font-normal">({tr('optional', 'اختياري')})</span>
                </label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="e.g. ريزيدنس النخيل"
                  dir="rtl"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 transition-all"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {tr('Address', 'العنوان')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Najma Street, Al Mansura"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{tr('City', 'المدينة')} <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Doha"
                  list="cities"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 transition-all"
                />
                <datalist id="cities">
                  <option value="Doha" />
                  <option value="Al Rayyan" />
                  <option value="Al Wakrah" />
                  <option value="Al Khor" />
                  <option value="Lusail" />
                  <option value="Al Thumama" />
                  <option value="The Pearl" />
                  <option value="Msheireb" />
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{tr('Country', 'الدولة')}</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{tr('Property Type', 'نوع العقار')}</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 transition-all bg-white"
                >
                  <option value="residential">{tr('Residential', 'سكني')}</option>
                  <option value="commercial">{tr('Commercial', 'تجاري')}</option>
                  <option value="mixed">{tr('Mixed Use', 'مختلط الاستخدام')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{tr('Status', 'الحالة')}</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 transition-all bg-white"
                >
                  <option value="active">{tr('Active', 'نشط')}</option>
                  <option value="under_renovation">{tr('Under Renovation', 'قيد التجديد')}</option>
                  <option value="inactive">{tr('Inactive', 'غير نشط')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#D97757] mb-3">{tr('Unit Details', 'تفاصيل الوحدات')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{tr('Total Units', 'إجمالي الوحدات')}</label>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={totalUnits}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/^0+(\d+)/, '$1');
                    const n = Number(raw);
                    if (raw === '' || Number.isFinite(n)) setTotalUnits(Math.max(0, n));
                  }}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 transition-all font-semibold text-[#132B25]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{tr(`Monthly Maintenance Fee (${currencySymbol})`, 'رسوم الصيانة الشهرية')}</label>
                <div className="relative group">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none group-focus-within:text-[#D97757] transition-colors">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    value={monthlyMaintenanceFee ?? ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/^0+(\d+\.?\d*)/, '$1');
                      const n = Number(raw);
                      if (raw === '' || Number.isFinite(n)) setMonthlyMaintenanceFee(Math.max(0, n));
                    }}
                    placeholder="Optional"
                    className="w-full border border-slate-200 rounded-xl ps-10 pe-3.5 py-2.5 text-sm outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 transition-all font-semibold text-[#132B25]"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{tr('Description', 'الوصف')}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Property description..."
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 transition-all resize-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{tr('Arabic Description', 'الوصف بالعربية')}</label>
                <textarea
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  rows={3}
                  placeholder="وصف العقار بالعربية..."
                  dir="rtl"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Cover Image Section */}
          <div>
            <ImageUploader
              value={coverImageUrl ? [coverImageUrl] : []}
              onChange={urls => setCoverImageUrl(urls[0] ?? '')}
              multiple={false}
              max={1}
              label={tr('Property Cover', 'غلاف العقار')}
              hint={tr('Add a cover image for this property', 'أضف صورة غلاف لهذا العقار')}
              locale={lang}
            />
          </div>

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
                  {tr('Delete', 'حذف')}
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
                {tr('Cancel', 'إلغاء')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-[#132B25] hover:bg-[#1a3d34] disabled:bg-slate-400 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {tr('Saving...', 'جارٍ الحفظ...')}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {isEdit ? tr('Save Changes', 'حفظ التغييرات') : tr('Add Property', 'إضافة عقار')}
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
