'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Search, Loader2, CheckCircle2, ArrowRight, Target } from 'lucide-react';
import { notifyChange } from '@/lib/store';
import type { Lead, Property } from '@/lib/database';
import { useCountry } from '@/context/CountryContext';

type PipelineStage = 'new' | 'contacted' | 'interested' | 'visited' | 'negotiating' | 'converted' | 'lost';

const stageConfig: Record<PipelineStage, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: 'text-slate-600', bg: 'bg-slate-100' },
  contacted: { label: 'Contacted', color: 'text-blue-600', bg: 'bg-blue-50' },
  interested: { label: 'Interested', color: 'text-violet-600', bg: 'bg-violet-50' },
  visited: { label: 'Visited', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  negotiating: { label: 'Negotiating', color: 'text-amber-600', bg: 'bg-amber-50' },
  converted: { label: 'Converted', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  lost: { label: 'Lost', color: 'text-rose-600', bg: 'bg-rose-50' },
};

export default function LeadsPage() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const isRtl = lang === 'ar';
  const tr = (en: string, ar: string) => isRtl ? ar : en;
  const { currencySymbol } = useCountry();
  const [search, setSearch] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', source: 'direct', budget: '', property_interest: '', notes: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lRes, pRes] = await Promise.all([
        fetch('/api/leads', { cache: 'no-store' }),
        fetch('/api/properties', { cache: 'no-store' }),
      ]);
      const lData = await lRes.json();
      const pData = await pRes.json();
      if (lData.ok) setLeads(lData.data as Lead[]);
      if (pData.ok) setProperties(pData.data as Property[]);
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
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, budget: form.budget ? Number(form.budget) : null }),
      });
      const data = await res.json();
      if (data.ok) {
        notifyChange('lead_created', `Lead "${form.name}" added`);
        setShowForm(false);
        setForm({ name: '', phone: '', email: '', source: 'direct', budget: '', property_interest: '', notes: '' });
        fetchData();
      }
    } catch {
      // error handled
    }
  };

  const handleStatusChange = async (id: string, status: PipelineStage) => {
    try {
      const res = await fetch(`/api/leads?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.ok) {
        notifyChange('lead_updated', `Lead status updated to ${status}`);
        fetchData();
      }
    } catch {
      // error handled
    }
  };

  const filtered = leads.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.phone.includes(search) ||
    (l.property_interest ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const stageCounts: Record<PipelineStage, number> = { new: 0, contacted: 0, interested: 0, visited: 0, negotiating: 0, converted: 0, lost: 0 };
  leads.forEach(l => { if (stageCounts[l.status as PipelineStage] !== undefined) stageCounts[l.status as PipelineStage]++; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{tr('Leads', 'العملاء المحتملون')}</h1>
          <p className="text-slate-500 text-sm mt-1">{tr('Track prospects through your sales pipeline', 'تتبع العملاء المحتملين عبر خط أنابيب المبيعات')}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-[#D97757] hover:bg-[#c66546] text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm">
          <Plus className="w-4 h-4" />{tr('Add Lead', 'إضافة عميل')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl p-6 border border-slate-200/80 space-y-4">
          <h3 className="font-extrabold text-slate-900">{tr('Add Lead', 'إضافة عميل محتمل')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input required placeholder={tr('Name', 'الاسم')} className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input required placeholder={tr('Phone', 'الهاتف')} className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <input type="email" placeholder={tr('Email (optional)', 'البريد الإلكتروني (اختياري)')} className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <select className="input-field" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
              <option value="direct">{tr('Direct', 'مباشر')}</option>
              <option value="phone_call">{tr('Phone Call', 'مكالمة هاتفية')}</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="meta_ads">Meta Ads</option>
              <option value="google_ads">Google Ads</option>
              <option value="bayut">Bayut</option>
              <option value="property_finder">Property Finder</option>
              <option value="referral">{tr('Referral', 'إحالة')}</option>
            </select>
            <input type="number" inputMode="numeric" placeholder={tr(`Budget (${currencySymbol})`, 'الميزانية')} className="input-field font-semibold" value={form.budget} onChange={e => { const raw = e.target.value.replace(/^0+(\d+)/, '$1'); setForm({ ...form, budget: raw }); }} />
            <select className="input-field" value={form.property_interest} onChange={e => setForm({ ...form, property_interest: e.target.value })}>
              <option value="">{tr('Property Interest (optional)', 'الاهتمام بالعقار (اختياري)')}</option>
              {properties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
            <textarea placeholder={tr('Notes (optional)', 'ملاحظات (اختياري)')} className="input-field sm:col-span-2" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">{tr('Cancel', 'إلغاء')}</button>
            <button type="submit" className="px-4 py-2 bg-[#132B25] text-white text-sm font-bold rounded-xl hover:bg-[#1A3831] transition-colors">{tr('Save Lead', 'حفظ العميل')}</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {(Object.keys(stageConfig) as PipelineStage[]).map((stage) => (
          <div key={stage} className={`rounded-xl p-3 text-center ${stageConfig[stage].bg}`}>
            <div className={`text-lg font-extrabold ${stageConfig[stage].color}`}>{stageCounts[stage]}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{tr(stageConfig[stage].label, stageConfig[stage].label)}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tr('Search leads...', 'البحث في العملاء...')} className="w-full ps-10 pe-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30" />
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-slate-300 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16"><Users className="w-12 h-12 text-slate-200 mx-auto mb-4" /><p className="text-slate-500">{tr('No leads found', 'لا يوجد عملاء محتملون')}</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((l) => (
              <div key={l.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                      <Users className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{l.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{l.phone} · {l.source}</div>
                      {l.property_interest && <div className="text-xs text-slate-400">{tr('Interest:', 'الاهتمام:')} {l.property_interest}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={l.status}
                      onChange={e => handleStatusChange(l.id, e.target.value as PipelineStage)}
                      className="text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#D97757]/30"
                    >
                      {(Object.keys(stageConfig) as PipelineStage[]).map(s => (
                        <option key={s} value={s}>{stageConfig[s].label}</option>
                      ))}
                    </select>
                    {l.status === 'converted' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
