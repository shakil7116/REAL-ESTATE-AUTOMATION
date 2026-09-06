'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Phone, Mail, Filter, TrendingUp, UserCheck, Eye, FileCheck } from 'lucide-react';
import { notifyChange } from '@/lib/store';
import type { Tenant, Unit, Lead } from '@/lib/database';
import { Button, Card, Avatar, Badge, EmptyState, SearchInput, PageHeader, KpiRow, StatCard, SlideOver } from '@/components/ui';

const PIPELINE_STAGES = [
  { key: 'new_enquiry',    labelEn: 'New enquiry',    labelAr: 'استفسار جديد',    icon: TrendingUp, tone: 'slate' as const },
  { key: 'viewing_booked', labelEn: 'Viewing booked', labelAr: 'حجز معاينة',      icon: Eye,        tone: 'sky' as const },
  { key: 'application',    labelEn: 'Application',    labelAr: 'طلب تأجير',      icon: FileCheck,  tone: 'amber' as const },
  { key: 'approved',       labelEn: 'Approved',       labelAr: 'موافق عليه',     icon: UserCheck,  tone: 'emerald' as const },
] as const;

// Static maps so Tailwind's JIT compiler sees the class names literally.
const ICON_BG: Record<string, string> = {
  slate:   'bg-slate-100 text-slate-700',
  sky:     'bg-sky-100 text-sky-700',
  amber:   'bg-amber-100 text-amber-700',
  emerald: 'bg-emerald-100 text-emerald-700',
};
const BAR_BG: Record<string, string> = {
  slate:   'bg-slate-500',
  sky:     'bg-sky-500',
  amber:   'bg-amber-500',
  emerald: 'bg-emerald-500',
};

export default function TenantsPage() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const isRtl = lang === 'ar';
  const tr = (en: string, ar: string) => isRtl ? ar : en;
  const [search, setSearch] = useState('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', phone2: '', company: '', nationality: '', notes: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, lRes, uRes] = await Promise.all([
        fetch('/api/tenants', { cache: 'no-store' }),
        fetch('/api/leads', { cache: 'no-store' }),
        fetch('/api/units', { cache: 'no-store' }),
      ]);
      const [tData, lData, uData] = await Promise.all([tRes.json(), lRes.json(), uRes.json()]);
      if (tData.ok) setTenants(tData.data as Tenant[]);
      if (lData.ok) setLeads(lData.data as Lead[]);
      if (uData.ok) setUnits(uData.data as Unit[]);
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
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        notifyChange('tenant_created', tr(`Tenant "${form.name}" created`, `تم إنشاء المستأجر "${form.name}"`));
        setShowForm(false);
        setForm({ name: '', email: '', phone: '', phone2: '', company: '', nationality: '', notes: '' });
        fetchData();
      }
    } catch {
      // error handled
    }
  };

  const filtered = tenants.filter(t =>
    (t.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (t.phone ?? '').toString().includes(search) ||
    (t.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (t.company ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // Pipeline counts (mockup-aligned). Derive from leads.status when present.
  const pipelineCount = (key: string) => {
    const map: Record<string, string[]> = {
      new_enquiry:    ['new'],
      viewing_booked: ['contacted'],
      application:    ['qualified', 'viewing'],
      approved:       ['converted'],
    };
    return leads.filter(l => (map[key] || []).includes(String(l.status).toLowerCase())).length;
  };
  const totalLeads = leads.length || 1;
  const activeTenantsCount = tenants.length;

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <PageHeader
        title={tr('Tenants & Leads', 'المستأجرون والعملاء')}
        subtitle={tr('Manage your tenant profiles and leasing pipeline', 'إدارة ملفات المستأجرين وخط أنابيب التأجير')}
        action={
          <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>
            {tr('New Tenant', 'مستأجر جديد')}
          </Button>
        }
      />

      {/* KPI Row */}
      <KpiRow>
        <StatCard
          icon={<Users className="w-5 h-5" />}
          value={tenants.length}
          label={tr('Total Tenants', 'إجمالي المستأجرين')}
          tone="slate"
        />
        <StatCard
          icon={<UserCheck className="w-5 h-5" />}
          value={pipelineCount('approved')}
          label={tr('Approved This Month', 'موافقات هذا الشهر')}
          tone="emerald"
        />
        <StatCard
          icon={<Eye className="w-5 h-5" />}
          value={pipelineCount('viewing_booked')}
          label={tr('Viewings Booked', 'حجوزات المعاينة')}
          tone="sky"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          value={leads.length}
          label={tr('New Leads', 'عملاء جدد')}
          tone="orange"
        />
      </KpiRow>

      {/* Leasing pipeline (mockup-aligned funnel) */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-extrabold text-[#0D2A24] text-base">{tr('Leasing Pipeline', 'خط أنابيب التأجير')}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{tr('Leads moving through the funnel', 'العملاء المحتملون عبر المراحل')}</p>
          </div>
        </div>
        <div className="space-y-3">
          {PIPELINE_STAGES.map((stage, i) => {
            const count = pipelineCount(stage.key);
            const pct = totalLeads > 0 ? Math.max(8, Math.round((count / totalLeads) * 100)) : 8;
            const StageIcon = stage.icon;
            return (
              <div key={stage.key} className="flex items-center gap-3">
                <div className="w-32 shrink-0 flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${ICON_BG[stage.tone]}`}>
                    <StageIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{tr(stage.labelEn, stage.labelAr)}</span>
                </div>
                <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${BAR_BG[stage.tone]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-12 text-end text-sm font-extrabold text-[#0D2A24]">{count}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Search + List */}
      <Card padding="sm">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={tr('Search tenants…', 'البحث في المستأجرين…')}
        />
      </Card>

      {loading ? (
        <Card><div className="space-y-3">{[0, 1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title={tenants.length === 0 ? tr('No tenants yet', 'لا يوجد مستأجرون بعد') : tr('No tenants match your search', 'لا يوجد مستأجرون مطابقون')}
            description={tenants.length === 0 ? tr('Add your first tenant to start tracking leases and communications.', 'أضف أول مستأجر لبدء تتبع العقود والتواصل.') : undefined}
            action={tenants.length === 0 ? <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>{tr('Add Tenant', 'إضافة مستأجر')}</Button> : undefined}
          />
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map(t => (
              <div key={t.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4">
                <Avatar name={t.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
                    {t.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{t.phone}</span>}
                    {t.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{t.email}</span>}
                    {t.company && <Badge tone="violet">{t.company}</Badge>}
                  </div>
                </div>
                <div className="text-end hidden sm:block">
                  <div className="text-xs text-slate-400">{tr('Nationality', 'الجنسية')}</div>
                  <div className="text-sm font-semibold text-slate-700">{t.nationality || '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add Tenant slide-over */}
      <SlideOver
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={tr('Add Tenant', 'إضافة مستأجر')}
        subtitle={tr('Create a tenant profile and start tracking their lease', 'أنشئ ملف مستأجر وابدأ تتبع عقده')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>{tr('Cancel', 'إلغاء')}</Button>
            <Button variant="dark" type="submit" form="tenant-form">{tr('Save Tenant', 'حفظ المستأجر')}</Button>
          </>
        }
      >
        <form id="tenant-form" onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Full Name', 'الاسم الكامل')}</label>
              <input required className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Phone', 'الهاتف')}</label>
              <input required className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Email', 'البريد الإلكتروني')}</label>
              <input type="email" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Phone 2 (optional)', 'هاتف آخر')}</label>
              <input className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.phone2} onChange={e => setForm({ ...form, phone2: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Nationality', 'الجنسية')}</label>
              <input className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Company (optional)', 'الشركة')}</label>
              <input className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Notes (optional)', 'ملاحظات')}</label>
              <textarea rows={3} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
