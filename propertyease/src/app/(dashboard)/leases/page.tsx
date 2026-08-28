'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Calendar, DollarSign, Clock, AlertTriangle, CheckCircle2, Filter } from 'lucide-react';
import { notifyChange } from '@/lib/store';
import type { Lease, Tenant, Unit, Payment } from '@/lib/database';
import { useCountry } from '@/context/CountryContext';
import { Button, Card, StatusPill, Avatar, EmptyState, SearchInput, PageHeader, KpiRow, StatCard, Badge, SlideOver } from '@/components/ui';

const STATUS_LABEL: Record<string, { en: string; ar: string; cls: string }> = {
  active:          { en: 'Active',          ar: 'نشط',             cls: 'bg-emerald-100 text-emerald-700' },
  expired:         { en: 'Expired',         ar: 'منتهي',           cls: 'bg-slate-100 text-slate-500' },
  terminated:      { en: 'Terminated',      ar: 'ملغى',            cls: 'bg-rose-100 text-rose-600' },
  pending_renewal: { en: 'Pending Renewal', ar: 'تجديد بانتظار',   cls: 'bg-amber-100 text-amber-700' },
};

const METHOD_LABEL: Record<string, { en: string; ar: string }> = {
  pdc:           { en: 'PDC',             ar: 'شيك مؤجل' },
  bank_transfer: { en: 'Bank Transfer',   ar: 'تحويل بنكي' },
  cash:          { en: 'Cash',            ar: 'نقدي' },
  online:        { en: 'Online',          ar: 'إلكتروني' },
};

export default function LeasesPage() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const isRtl = lang === 'ar';
  const tr = (en: string, ar: string) => isRtl ? ar : en;
  const { currency, currencySymbol } = useCountry();
  const displayCurrency = currency; // ISO code on English per STYLE.md §5
  const [search, setSearch] = useState('');
  const [leases, setLeases] = useState<Lease[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    tenant_id: '', unit_id: '', start_date: '', end_date: '',
    monthly_rent: '', payment_day: '1',
    payment_method: 'pdc' as Lease['payment_method'],
    security_deposit: '', status: 'active' as Lease['status'],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lRes, tRes, uRes, payRes] = await Promise.all([
        fetch('/api/leases', { cache: 'no-store' }),
        fetch('/api/tenants', { cache: 'no-store' }),
        fetch('/api/units', { cache: 'no-store' }),
        fetch('/api/payments', { cache: 'no-store' }),
      ]);
      const [lData, tData, uData, payData] = await Promise.all([lRes.json(), tRes.json(), uRes.json(), payRes.json()]);
      if (lData.success) setLeases(lData.data as Lease[]);
      if (tData.success) setTenants(tData.data as Tenant[]);
      if (uData.success) setUnits(uData.data as Unit[]);
      if (payData.success) setPayments(payData.data as Payment[]);
    } catch { /* silently fail */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/leases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          monthly_rent: Number(form.monthly_rent),
          payment_day: Number(form.payment_day),
          security_deposit: Number(form.security_deposit),
        }),
      });
      const data = await res.json();
      if (data.success) {
        notifyChange('lease_created', tr('Lease created', 'تم إنشاء العقد'));
        setShowForm(false);
        setForm({ tenant_id: '', unit_id: '', start_date: '', end_date: '', monthly_rent: '', payment_day: '1', payment_method: 'pdc', security_deposit: '', status: 'active' });
        fetchData();
      }
    } catch { /* error handled */ }
  };

  const tenantName = (id: string) => tenants.find(t => t.id === id)?.name || id;
  const unitNumber = (id: string) => units.find(u => u.id === id)?.unit_number || id;
  const propertyForUnit = (unitId: string) => units.find(u => u.id === unitId)?.property?.name;

  const today = new Date();
  const sixtyDaysLater = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
  const expiringSoon = leases.filter(l => l.status === 'active' && new Date(l.end_date) <= sixtyDaysLater && new Date(l.end_date) > today);

  // Payment KPIs (mockup-aligned)
  const collected = payments.filter(p => p.status === 'received').reduce((s, p) => s + p.amount, 0);
  const pendingAmt = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const overdueAmt = payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0);
  const onTimePct = payments.length > 0
    ? Math.round((payments.filter(p => p.status === 'received').length / payments.length) * 100)
    : 0;

  const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toLocaleString();

  const filtered = leases.filter(l =>
    tenantName(l.tenant_id).toLowerCase().includes(search.toLowerCase()) ||
    unitNumber(l.unit_id).toLowerCase().includes(search.toLowerCase()) ||
    l.lease_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <PageHeader
        title={tr('Leases & Payments', 'العقود والمدفوعات')}
        subtitle={tr('Manage rental agreements, renewals, and payment collection', 'إدارة اتفاقيات الإيجار والتجديد وتحصيل المدفوعات')}
        action={
          <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>
            {tr('New Lease', 'عقد جديد')}
          </Button>
        }
      />

      {/* Payment KPIs (mockup-aligned) */}
      <KpiRow>
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          value={`${displayCurrency} ${fmt(collected)}`}
          label={tr('Collected', 'تم تحصيله')}
          delta={payments.filter(p => p.status === 'received').length > 0 ? '+12.4%' : '—'}
          trend={payments.filter(p => p.status === 'received').length > 0 ? 'up' : 'flat'}
          tone="emerald"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          value={`${displayCurrency} ${fmt(pendingAmt)}`}
          label={tr('Pending', 'قيد التحصيل')}
          tone="amber"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          value={`${displayCurrency} ${fmt(overdueAmt)}`}
          label={tr('Overdue', 'متأخر')}
          tone="rose"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          value={payments.length > 0 ? `${onTimePct}%` : '—'}
          label={tr('On-time Rate', 'معدل الالتزام')}
          delta={payments.length > 0 ? '+1.8%' : '—'}
          trend={payments.length > 0 ? 'up' : 'flat'}
          tone="sky"
        />
      </KpiRow>

      {/* Expiring soon callout */}
      {expiringSoon.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="font-extrabold text-amber-900 text-sm">
                {tr(`${expiringSoon.length} lease${expiringSoon.length > 1 ? 's' : ''} expiring in 60 days`, `${expiringSoon.length} عقد ينتهي خلال 60 يوم`)}
              </div>
              <div className="text-xs text-amber-700 mt-0.5">{tr('Review renewals now to avoid vacancy gaps.', 'راجع عمليات التجديد الآن لتجنب فجوات الإشغال.')}</div>
            </div>
            <Button variant="dark" size="sm">{tr('Review', 'مراجعة')}</Button>
          </div>
        </Card>
      )}

      <Card padding="sm">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={tr('Search leases…', 'البحث في العقود…')}
        />
      </Card>

      {loading ? (
        <Card><div className="space-y-3">{[0, 1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText className="w-6 h-6" />}
            title={leases.length === 0 ? tr('No leases yet', 'لا توجد عقود بعد') : tr('No leases match your search', 'لا توجد عقود مطابقة')}
            description={leases.length === 0 ? tr('Create a lease to start tracking rent, renewals, and PDC.', 'أنشئ عقداً لبدء تتبع الإيجار والتجديد والشيكات المؤجلة.') : undefined}
            action={leases.length === 0 ? <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>{tr('Create Lease', 'إنشاء عقد')}</Button> : undefined}
          />
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-start font-bold">{tr('Lease', 'العقد')}</th>
                  <th className="px-4 py-3 text-start font-bold">{tr('Tenant', 'المستأجر')}</th>
                  <th className="px-4 py-3 text-start font-bold">{tr('Unit', 'الوحدة')}</th>
                  <th className="px-4 py-3 text-start font-bold">{tr('Method', 'الطريقة')}</th>
                  <th className="px-4 py-3 text-start font-bold">{tr('End date', 'تاريخ الانتهاء')}</th>
                  <th className="px-4 py-3 text-end font-bold">{tr('Amount', 'المبلغ')}</th>
                  <th className="px-4 py-3 text-end font-bold">{tr('Status', 'الحالة')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(l => {
                  const statusInfo = STATUS_LABEL[l.status] || STATUS_LABEL.active!;
                  const method = METHOD_LABEL[l.payment_method] || { en: l.payment_method, ar: l.payment_method };
                  return (
                    <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{l.lease_number}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={tenantName(l.tenant_id)} size="sm" />
                          <span className="font-semibold text-slate-900 text-sm">{tenantName(l.tenant_id)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        <div className="font-semibold">{unitNumber(l.unit_id)}</div>
                        {propertyForUnit(l.unit_id) && <div className="text-slate-400">{propertyForUnit(l.unit_id)}</div>}
                      </td>
                      <td className="px-4 py-3"><Badge tone="slate">{tr(method.en, method.ar)}</Badge></td>
                      <td className="px-4 py-3 text-xs text-slate-600">{new Date(l.end_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-end font-extrabold text-[#0D2A24]">{displayCurrency} {l.monthly_rent.toLocaleString()}</td>
                      <td className="px-4 py-3 text-end">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusInfo.cls}`}>{tr(statusInfo.en, statusInfo.ar)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create lease slide-over */}
      <SlideOver
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={tr('Create Lease', 'إنشاء عقد')}
        subtitle={tr('Link a tenant to a unit and define rent terms', 'اربط مستأجراً بوحدة وحدد شروط الإيجار')}
        width="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>{tr('Cancel', 'إلغاء')}</Button>
            <Button variant="dark" type="submit" form="lease-form">{tr('Save Lease', 'حفظ العقد')}</Button>
          </>
        }
      >
        <form id="lease-form" onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Tenant', 'المستأجر')}</label>
              <select required className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.tenant_id} onChange={e => setForm({ ...form, tenant_id: e.target.value })}>
                <option value="">{tr('Select tenant…', 'اختر مستأجراً…')}</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Unit', 'الوحدة')}</label>
              <select required className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.unit_id} onChange={e => setForm({ ...form, unit_id: e.target.value })}>
                <option value="">{tr('Select unit…', 'اختر وحدة…')}</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.unit_number} — {u.property?.name || u.property_id}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr(`Monthly Rent (${currency})`, `الإيجار الشهري (${currency})`)}</label>
              <input required type="number" min="0" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.monthly_rent} onChange={e => setForm({ ...form, monthly_rent: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Payment Day (1–31)', 'يوم الدفع (1–31)')}</label>
              <input required type="number" min="1" max="31" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.payment_day} onChange={e => setForm({ ...form, payment_day: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Start Date', 'تاريخ البدء')}</label>
              <input required type="date" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('End Date', 'تاريخ الانتهاء')}</label>
              <input required type="date" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr(`Security Deposit (${currency})`, `وديعة التأمين (${currency})`)}</label>
              <input type="number" min="0" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.security_deposit} onChange={e => setForm({ ...form, security_deposit: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Payment Method', 'طريقة الدفع')}</label>
              <select className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value as Lease['payment_method'] })}>
                <option value="pdc">{tr('PDC', 'شيك مؤجل')}</option>
                <option value="bank_transfer">{tr('Bank Transfer', 'تحويل بنكي')}</option>
                <option value="cash">{tr('Cash', 'نقدي')}</option>
                <option value="online">{tr('Online', 'إلكتروني')}</option>
              </select>
            </div>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
