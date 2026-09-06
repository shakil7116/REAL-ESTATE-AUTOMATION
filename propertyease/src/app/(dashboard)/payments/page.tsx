'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Plus, Search, DollarSign, CheckCircle2, Clock, Loader2, Download } from 'lucide-react';
import { notifyChange } from '@/lib/store';
import type { Payment, Tenant } from '@/lib/database';
import { useCountry } from '@/context/CountryContext';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  received: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-rose-100 text-rose-700',
  bounced: 'bg-red-100 text-red-600',
  cancelled: 'bg-slate-100 text-slate-500',
};

export default function PaymentsPage() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const isRtl = lang === 'ar';
  const tr = (en: string, ar: string) => isRtl ? ar : en;
  const { currencySymbol } = useCountry();
  const [search, setSearch] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ lease_id: '', tenant_id: '', amount: '', payment_date: '', due_date: '', payment_type: 'rent', payment_method: 'pdc', status: 'pending', notes: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, tRes] = await Promise.all([
        fetch('/api/payments', { cache: 'no-store' }),
        fetch('/api/tenants', { cache: 'no-store' }),
      ]);
      const pData = await pRes.json();
      const tData = await tRes.json();
      if (pData.ok) setPayments(pData.data as Payment[]);
      if (tData.ok) setTenants(tData.data as Tenant[]);
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
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const data = await res.json();
      if (data.ok) {
        notifyChange('payment_recorded', `Payment of ${currencySymbol} ${form.amount} recorded`);
        setShowForm(false);
        setForm({ lease_id: '', tenant_id: '', amount: '', payment_date: '', due_date: '', payment_type: 'rent', payment_method: 'pdc', status: 'pending', notes: '' });
        fetchData();
      }
    } catch {
      // error handled by toast fallback
    }
  };

  const totalReceived = payments.filter(p => p.status === 'received').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const totalOverdue = payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0);

  const getTenantName = (id: string) => tenants.find(t => t.id === id)?.name ?? '—';

  const filtered = payments.filter(p =>
    getTenantName(p.tenant_id).toLowerCase().includes(search.toLowerCase()) ||
    p.amount.toString().includes(search) ||
    p.payment_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{tr('Payments', 'المدفوعات')}</h1>
          <p className="text-slate-500 text-sm mt-1">{tr('Track rent collections and payment history', 'تتبع تحصيل الإيجارات وسجل المدفوعات')}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-[#D97757] hover:bg-[#c66546] text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm">
          <Plus className="w-4 h-4" />{tr('Record Payment', 'تسجيل دفعة')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl p-6 border border-slate-200/80 space-y-4">
          <h3 className="font-extrabold text-slate-900">{tr('Record Payment', 'تسجيل دفعة')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select className="input-field" value={form.tenant_id} onChange={e => setForm({ ...form, tenant_id: e.target.value })}>
              <option value="">{tr('Select Tenant', 'اختر المستأجر')}</option>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <input required type="number" inputMode="decimal" placeholder={tr(`Amount (${currencySymbol})`, 'المبلغ')} className="input-field font-semibold" value={form.amount} onChange={e => { const raw = e.target.value.replace(/^0+(\d+\.?\d*)/, '$1'); setForm({ ...form, amount: raw }); }} />
            <input required type="date" className="input-field" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} />
            <input type="date" className="input-field" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            <select className="input-field" value={form.payment_type} onChange={e => setForm({ ...form, payment_type: e.target.value })}>
              <option value="rent">{tr('Rent', 'إيجار')}</option>
              <option value="security_deposit">{tr('Security Deposit', 'وديعة')}</option>
              <option value="maintenance_fee">{tr('Maintenance Fee', 'رسوم صيانة')}</option>
              <option value="late_fee">{tr('Late Fee', 'غرامة تأخير')}</option>
              <option value="other">{tr('Other', 'أخرى')}</option>
            </select>
            <select className="input-field" value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
              <option value="pdc">{tr('PDC', 'شيك مؤرخ')}</option>
              <option value="bank_transfer">{tr('Bank Transfer', 'تحويل بنكي')}</option>
              <option value="cash">{tr('Cash', 'نقدي')}</option>
              <option value="online">{tr('Online', 'إلكتروني')}</option>
            </select>
            <textarea placeholder={tr('Notes (optional)', 'ملاحظات (اختياري)')} className="input-field sm:col-span-2" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">{tr('Cancel', 'إلغاء')}</button>
            <button type="submit" className="px-4 py-2 bg-[#132B25] text-white text-sm font-bold rounded-xl hover:bg-[#1A3831] transition-colors">{tr('Record Payment', 'تسجيل الدفعة')}</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: tr('Total Received', 'إجمالي المستلم'), value: `${currencySymbol} ${totalReceived.toLocaleString()}`, color: 'text-emerald-600' },
          { label: tr('Pending', 'قيد الانتظار'), value: `${currencySymbol} ${totalPending.toLocaleString()}`, color: 'text-amber-600' },
          { label: tr('Overdue', 'متأخر'), value: `${currencySymbol} ${totalOverdue.toLocaleString()}`, color: 'text-rose-600' },
          { label: tr('Transactions', 'المعاملات'), value: payments.length, color: 'text-slate-700' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-200/80">
            <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 font-semibold mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tr('Search payments...', 'البحث في المدفوعات...')} className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 ps-10 pe-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30" />
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-slate-300 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16"><DollarSign className="w-12 h-12 text-slate-200 mx-auto mb-4" /><p className="text-slate-500">{tr('No payments found', 'لا توجد مدفوعات')}</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((p) => (
              <div key={p.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.status === 'received' ? 'bg-emerald-50' : p.status === 'overdue' ? 'bg-rose-50' : 'bg-amber-50'}`}>
                    <CreditCard className={`w-5 h-5 ${p.status === 'received' ? 'text-emerald-600' : p.status === 'overdue' ? 'text-rose-600' : 'text-amber-600'}`} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{getTenantName(p.tenant_id)}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{p.payment_type} · {p.payment_method}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-end hidden sm:block">
                    <div className="font-bold text-slate-900">{currencySymbol} {p.amount.toLocaleString()}</div>
                    <div className="text-xs text-slate-400">{p.payment_date}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[p.status] || 'bg-slate-100 text-slate-600'}`}>
                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
