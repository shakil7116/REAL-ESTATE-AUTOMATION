'use client';

import { useState, useEffect } from 'react';
import { Wrench, Plus, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { notifyChange } from '@/lib/store';
import type { MaintenanceTicket, Tenant, Unit } from '@/lib/database';
import {
  Button, Card, StatusPill, Avatar, EmptyState, SearchInput, PageHeader, KpiRow, StatCard, Badge, SlideOver, Skeleton,
} from '@/components/ui';
import { useCountry } from '@/context/CountryContext';

const PRIORITY_TONE: Record<string, 'slate' | 'sky' | 'amber' | 'rose'> = {
  low: 'slate',
  medium: 'sky',
  high: 'amber',
  urgent: 'rose',
};

export default function MaintenancePage() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const isRtl = lang === 'ar';
  const tr = (en: string, ar: string) => isRtl ? ar : en;
  const { currency, currencySymbol } = useCountry();
  const displayCurrency = currency;
  const [search, setSearch] = useState('');
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ unit_id: '', tenant_id: '', title: '', description: '', priority: 'medium', category: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mRes, tRes, uRes] = await Promise.all([
        fetch('/api/maintenance', { cache: 'no-store' }),
        fetch('/api/tenants', { cache: 'no-store' }),
        fetch('/api/units', { cache: 'no-store' }),
      ]);
      const mData = await mRes.json();
      const tData = await tRes.json();
      const uData = await uRes.json();
      if (mData.success) setTickets(mData.data as MaintenanceTicket[]);
      if (tData.success) setTenants(tData.data as Tenant[]);
      if (uData.success) setUnits(uData.data as Unit[]);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        notifyChange('ticket_created', `Ticket "${form.title}" created`);
        setShowForm(false);
        setForm({ unit_id: '', tenant_id: '', title: '', description: '', priority: 'medium', category: '' });
        fetchData();
      }
    } catch {
      setError('Failed to create ticket');
    }
  };

  const getUnitLabel = (id: string) => units.find(u => u.id === id)?.unit_number || id;
  const getTenantName = (id: string) => tenants.find(t => t.id === id)?.name || id;

  const filtered = tickets.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    getUnitLabel(t.unit_id).toLowerCase().includes(search.toLowerCase()) ||
    getTenantName(t.tenant_id).toLowerCase().includes(search.toLowerCase())
  );

  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const completedCount = tickets.filter(t => t.status === 'completed').length;
  const urgentCount = tickets.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <PageHeader
        title={tr('Maintenance', 'الصيانة')}
        subtitle={tr('Track repair requests and work orders', 'تتبع طلبات الإصلاح وأوامر العمل')}
        action={
          <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>
            {tr('New Ticket', 'تذكرة جديدة')}
          </Button>
        }
      />

      <KpiRow>
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          value={openCount}
          label={tr('Open', 'مفتوح')}
          tone="slate"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          value={inProgressCount}
          label={tr('In Progress', 'قيد التنفيذ')}
          tone="sky"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          value={completedCount}
          label={tr('Completed', 'مكتمل')}
          tone="emerald"
        />
        <StatCard
          icon={<Wrench className="w-5 h-5" />}
          value={urgentCount}
          label={tr('Urgent', 'عاجل')}
          tone="rose"
        />
      </KpiRow>

      <Card padding="sm">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={tr('Search tickets…', 'البحث في التذاكر…')}
        />
      </Card>

      {loading ? (
        <Card>
          <Skeleton count={3} className="h-16" />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Wrench className="w-6 h-6" />}
            title={tickets.length === 0 ? tr('No tickets yet', 'لا توجد تذاكر بعد') : tr('No tickets match your search', 'لا توجد تذاكر مطابقة')}
            description={tickets.length === 0 ? tr('Create your first maintenance ticket to track repairs and work orders.', 'أنشئ أول تذكرة صيانة لتتبع الإصلاحات وأوامر العمل.') : undefined}
            action={tickets.length === 0 ? <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>{tr('Create Ticket', 'إنشاء تذكرة')}</Button> : undefined}
          />
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map((t) => (
              <div key={t.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <Avatar name={getTenantName(t.tenant_id)} size="md" />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-sm truncate">
                      {t.ticket_number} — {t.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">
                      {getUnitLabel(t.unit_id)} · {getTenantName(t.tenant_id)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge tone={PRIORITY_TONE[t.priority] || 'slate'}>
                    {tr(t.priority.charAt(0).toUpperCase() + t.priority.slice(1), t.priority)}
                  </Badge>
                  <StatusPill status={t.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <SlideOver
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={tr('Create Ticket', 'إنشاء تذكرة')}
        subtitle={tr('Log a new maintenance request for a unit', 'سجّل طلب صيانة جديد لوحدة')}
        width="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>{tr('Cancel', 'إلغاء')}</Button>
            <Button variant="dark" type="submit" form="maintenance-form">{tr('Create Ticket', 'إنشاء تذكرة')}</Button>
          </>
        }
      >
        <form id="maintenance-form" onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Unit', 'الوحدة')}</label>
              <select required className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.unit_id} onChange={e => setForm({ ...form, unit_id: e.target.value })}>
                <option value="">{tr('Select Unit', 'اختر الوحدة')}</option>
                {units.map(u => <option key={u.id} value={u.id}>{getUnitLabel(u.id)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Tenant (optional)', 'المستأجر (اختياري)')}</label>
              <select className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.tenant_id} onChange={e => setForm({ ...form, tenant_id: e.target.value })}>
                <option value="">{tr('Select Tenant', 'اختر المستأجر')}</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Title', 'العنوان')}</label>
              <input required placeholder={tr('Title', 'العنوان')} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Priority', 'الأولوية')}</label>
              <select className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="low">{tr('Low', 'منخفض')}</option>
                <option value="medium">{tr('Medium', 'متوسط')}</option>
                <option value="high">{tr('High', 'مرتفع')}</option>
                <option value="urgent">{tr('Urgent', 'عاجل')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Category (optional)', 'الفئة (اختياري)')}</label>
              <select className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="">{tr('Category (optional)', 'الفئة (اختياري)')}</option>
                <option value="Plumbing">{tr('Plumbing', 'سباكة')}</option>
                <option value="Electrical">{tr('Electrical', 'كهرباء')}</option>
                <option value="HVAC">{tr('HVAC', 'تكييف')}</option>
                <option value="Carpentry">{tr('Carpentry', 'نجارة')}</option>
                <option value="Painting">{tr('Painting', 'دهان')}</option>
                <option value="Appliance">{tr('Appliance', 'أجهزة')}</option>
                <option value="Other">{tr('Other', 'أخرى')}</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Description', 'الوصف')}</label>
              <textarea placeholder={tr('Description', 'الوصف')} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
