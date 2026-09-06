'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Plus, TrendingUp, DollarSign, Users, BarChart3 } from 'lucide-react';
import { notifyChange } from '@/lib/store';
import type { AdCampaign } from '@/lib/database';
import { useCountry } from '@/context/CountryContext';
import {
  Button, Card, StatusPill, EmptyState, SearchInput, PageHeader, KpiRow, StatCard, Badge, SlideOver, Skeleton, ProgressBar,
} from '@/components/ui';

const PLATFORM_CONFIG: Record<string, { icon: string; labelEn: string; labelAr: string }> = {
  meta:          { icon: 'M', labelEn: 'Meta',               labelAr: 'ميتا' },
  google:        { icon: 'G', labelEn: 'Google Ads',         labelAr: 'جوجل إعلانات' },
  bayut:         { icon: 'B', labelEn: 'Bayut',              labelAr: 'بيتوت' },
  property_finder: { icon: 'PF', labelEn: 'Property Finder', labelAr: 'باحث العقارات' },
  local_agency:  { icon: 'LA', labelEn: 'Local Agency',       labelAr: 'وكالة محلية' },
};

export default function CampaignsPage() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const isRtl = lang === 'ar';
  const tr = (en: string, ar: string) => isRtl ? ar : en;
  const { currency, currencySymbol } = useCountry();
  const displayCurrency = currency;
  const [search, setSearch] = useState('');
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', platform: 'meta' as AdCampaign['platform'],
    budget: '', spent: '0', start_date: '', end_date: '',
    target_audience: '', objective: '', status: 'active' as AdCampaign['status'],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/campaigns', { cache: 'no-store' });
      const data = await res.json();
      if (data.ok) setCampaigns(data.data as AdCampaign[]);
    } catch { /* silently fail */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, budget: Number(form.budget), spent: Number(form.spent) }),
      });
      const data = await res.json();
      if (data.ok) {
        notifyChange('campaign_created', `Campaign "${form.name}" created`);
        setShowForm(false);
        setForm({ name: '', platform: 'meta', budget: '', spent: '0', start_date: '', end_date: '', target_audience: '', objective: '', status: 'active' });
        fetchData();
      }
    } catch { /* error handled */ }
  };

  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
  const activeCount = campaigns.filter(c => c.status === 'active').length;
  const utilizationPct = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0;

  const filtered = campaigns.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.platform.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <PageHeader
        title={tr('Campaigns', 'الحملات الإعلانية')}
        subtitle={tr('Track advertising performance across platforms', 'تتبع أداء الإعلانات عبر المنصات')}
        action={
          <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>
            {tr('New Campaign', 'حملة جديدة')}
          </Button>
        }
      />

      <KpiRow>
        <StatCard
          icon={<Megaphone className="w-5 h-5" />}
          value={activeCount}
          label={tr('Active Campaigns', 'حملات نشطة')}
          tone="emerald"
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          value={`${displayCurrency} ${totalBudget.toLocaleString()}`}
          label={tr('Total Budget', 'إجمالي الميزانية')}
          tone="slate"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          value="—"
          label={tr('Total Leads Generated', 'إجمالي العملاء')}
          tone="purple"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          value={totalBudget > 0 ? `${utilizationPct}%` : '—'}
          label={tr('Budget Utilization', 'استخدام الميزانية')}
          tone="amber"
        />
      </KpiRow>

      <Card padding="sm">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={tr('Search campaigns…', 'البحث في الحملات…')}
        />
      </Card>

      {loading ? (
        <Card>
          <Skeleton count={3} className="h-16" />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Megaphone className="w-6 h-6" />}
            title={campaigns.length === 0 ? tr('No campaigns yet', 'لا توجد حملات بعد') : tr('No campaigns match your search', 'لا توجد حملات مطابقة')}
            description={campaigns.length === 0 ? tr('Create your first ad campaign to track performance across platforms.', 'أنشئ أول حملة إعلانية لتتبع الأداء عبر المنصات.') : undefined}
            action={campaigns.length === 0 ? <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>{tr('Create Campaign', 'إنشاء حملة')}</Button> : undefined}
          />
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map((c) => {
              const pct = c.budget > 0 ? Math.min(Math.round((c.spent / c.budget) * 100), 100) : 0;
              const pCfg = PLATFORM_CONFIG[c.platform] || PLATFORM_CONFIG.meta;
              return (
                <div key={c.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                      <span className="text-xs font-black text-violet-700">{pCfg.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                        <StatusPill status={c.status} />
                        <Badge tone="violet">{isRtl ? pCfg.labelAr : pCfg.labelEn}</Badge>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" />{new Date(c.start_date).toLocaleDateString()} — {c.end_date ? new Date(c.end_date).toLocaleDateString() : tr('Ongoing', 'مستمرة')}</span>
                        {c.target_audience && <span className="text-slate-400 truncate">· {c.target_audience}</span>}
                      </div>
                    </div>
                    <div className="w-56 hidden md:block shrink-0">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-500 font-semibold">{tr('Spent', 'مصروف')} {currencySymbol} {c.spent.toLocaleString()}</span>
                        <span className="text-slate-400">/ {currencySymbol} {c.budget.toLocaleString()}</span>
                      </div>
                      <ProgressBar value={pct} height="sm" />
                    </div>
                    <div className="text-end shrink-0 md:hidden">
                      <div className="font-bold text-slate-900 text-sm">{currencySymbol} {c.budget.toLocaleString()}</div>
                      <div className="text-xs text-slate-400">{tr('Spent:', 'مصروف:')} {currencySymbol} {c.spent.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <SlideOver
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={tr('Create Campaign', 'إنشاء حملة')}
        subtitle={tr('Set up a new advertising campaign across platforms', 'أنشئ حملة إعلانية جديدة عبر المنصات')}
        width="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>{tr('Cancel', 'إلغاء')}</Button>
            <Button variant="dark" type="submit" form="campaigns-form">{tr('Create Campaign', 'إنشاء حملة')}</Button>
          </>
        }
      >
        <form id="campaigns-form" onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Campaign Name', 'اسم الحملة')}</label>
              <input required placeholder={tr('Campaign Name', 'اسم الحملة')} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Platform', 'المنصة')}</label>
              <select className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value as AdCampaign['platform'] })}>
                {(['meta', 'google', 'bayut', 'property_finder', 'local_agency'] as const).map(p => (
                  <option key={p} value={p}>{isRtl ? PLATFORM_CONFIG[p].labelAr : PLATFORM_CONFIG[p].labelEn}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr(`Budget (${currency})`, `الميزانية (${currency})`)}</label>
              <input required type="number" min="0" inputMode="numeric" placeholder={tr(`Budget (${currency})`, 'الميزانية')} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757] font-semibold" value={form.budget} onChange={e => { const raw = e.target.value.replace(/^0+(\d+)/, '$1'); setForm({ ...form, budget: raw }); }} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr(`Spent (${currency})`, `المصروف (${currency})`)}</label>
              <input type="number" min="0" inputMode="numeric" placeholder={tr(`Spent (${currency})`, 'المصروف')} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757] font-semibold" value={form.spent} onChange={e => { const raw = e.target.value.replace(/^0+(\d+)/, '$1'); setForm({ ...form, spent: raw }); }} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Start Date', 'تاريخ البدء')}</label>
              <input required type="date" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('End Date', 'تاريخ الانتهاء')}</label>
              <input type="date" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Objective (optional)', 'الهدف (اختياري)')}</label>
              <select className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })}>
                <option value="">{tr('Objective (optional)', 'الهدف (اختياري)')}</option>
                <option value="leads">{tr('Leads Generation', 'توليد عملاء محتملين')}</option>
                <option value="sales">{tr('Sales', 'مبيعات')}</option>
                <option value="awareness">{tr('Brand Awareness', 'الوعي بالعلامة التجارية')}</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Target Audience (optional)', 'الجمهور المستهدف (اختياري)')}</label>
              <input placeholder={tr('Target Audience (optional)', 'الجمهور المستهدف (اختياري)')} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.target_audience} onChange={e => setForm({ ...form, target_audience: e.target.value })} />
            </div>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
