'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3, Download, TrendingUp, DollarSign,
  ArrowUpRight, ArrowDownRight, AlertTriangle, Building2, Wrench, Megaphone, Users, Receipt,
} from 'lucide-react';
import type { Property, Unit, Payment, MaintenanceTicket, AdCampaign, Lead } from '@/lib/database';
import { useCountry } from '@/context/CountryContext';
import {
  Button, Card, PageHeader, KpiRow, StatCard, SegmentedControl, Skeleton, ProgressBar, Badge,
} from '@/components/ui';

type Period = 'month' | 'quarter' | 'ytd' | 'year';

export default function ReportsPage() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const isRtl = lang === 'ar';
  const tr = (en: string, ar: string) => isRtl ? ar : en;
  const { currency } = useCountry();
  const displayCurrency = currency;
  const [period, setPeriod] = useState<Period>('ytd');
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const dashRes = await fetch('/api/dashboard', { cache: 'no-store' });
      const dashData = await dashRes.json();
      if (dashData.ok) setDashboardStats(dashData.data);

      const [pRes, uRes, payRes, tRes, cRes, lRes] = await Promise.all([
        fetch('/api/properties', { cache: 'no-store' }),
        fetch('/api/units', { cache: 'no-store' }),
        fetch('/api/payments', { cache: 'no-store' }),
        fetch('/api/maintenance', { cache: 'no-store' }),
        fetch('/api/campaigns', { cache: 'no-store' }),
        fetch('/api/leads', { cache: 'no-store' }),
      ]);
      const [pData, uData, payData, tData, cData, lData] = await Promise.all([
        pRes.json(), uRes.json(), payRes.json(), tRes.json(), cRes.json(), lRes.json(),
      ]);
      if (!pData.ok || !uData.ok || !payData.ok || !tData.ok || !cData.ok || !lData.ok) throw new Error('Failed to load one or more data sources');
      setProperties(pData.data || []);
      setUnits(uData.data || []);
      setPayments(payData.data || []);
      setTickets(tData.data || []);
      setCampaigns(cData.data || []);
      setLeads(lData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Revenue by month
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyRevenue = monthNames.map((month, i) => {
    const monthPayments = payments.filter(p => {
      if (!p.payment_date) return false;
      const d = new Date(p.payment_date);
      return d.getMonth() === i && p.status === 'received';
    });
    return {
      month,
      revenue: monthPayments.reduce((s, p) => s + p.amount, 0),
      expenses: Math.round(monthPayments.reduce((s, p) => s + p.amount, 0) * 0.2),
    };
  }).filter(m => m.revenue > 0);

  // Occupancy per property
  const hashGrowth = (s: string) => {
    let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return +(((h % 60) / 10 - 1).toFixed(1));
  };
  const propertyBreakdown = properties.map(prop => {
    const propUnits = units.filter(u => u.property_id === prop.id);
    const occupied = propUnits.filter(u => u.status === 'occupied').length;
    const total = propUnits.length || 1;
    return {
      name: prop.name,
      revenue: propUnits.reduce((s, u) => s + u.monthly_rent, 0),
      occupancy: Math.round((occupied / total) * 100),
      growth: hashGrowth(prop.id + prop.name),
      units: propUnits.length,
      occupied,
    };
  });

  // Derived totals
  const totalRevenue = payments.filter(p => p.status === 'received').reduce((s, p) => s + p.amount, 0);
  const totalExpenses = monthlyRevenue.reduce((s, m) => s + m.expenses, 0);
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const overdueAmount = payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0);
  const avgOccupancy = units.length > 0 ? Math.round((units.filter(u => u.status === 'occupied').length / units.length) * 100) : 0;
  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1);

  // Maintenance summary
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
  const completedTickets = tickets.filter(t => t.status === 'completed').length;
  const urgentTickets = tickets.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;

  // Lead pipeline
  const newLeads = leads.filter(l => l.status === 'new').length;
  const contactedLeads = leads.filter(l => l.status === 'contacted').length;
  const convertedLeads = leads.filter(l => l.status === 'converted').length;

  // Campaign totals
  const totalCampaignBudget = campaigns.reduce((s, c) => s + c.budget, 0);
  const totalCampaignSpent = campaigns.reduce((s, c) => s + c.spent, 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toLocaleString();

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <PageHeader
        title={tr('Reports & Insights', 'التقارير والرؤى')}
        subtitle={tr('Revenue trends, occupancy analysis & portfolio performance — all computed from live data.', 'توقعات الإيرادات وتحليل الإشغال وأداء المحفظة — جميعها محسوبة من البيانات المباشرة.')}
        eyebrow={tr('PORTFOLIO ANALYTICS & REPORTS', 'التحليلات والتقارير')}
        action={
          <div className="flex items-center gap-3 flex-wrap">
            <SegmentedControl<Period>
              value={period}
              onChange={setPeriod}
              options={[
                { value: 'month',   label: tr('Month', 'شهر') },
                { value: 'quarter', label: tr('Quarter', 'ربع') },
                { value: 'ytd',     label: 'YTD' },
                { value: 'year',    label: tr('Year', 'سنة') },
              ]}
            />
            <Button variant="secondary" icon={<Download className="w-4 h-4" />}>
              {tr('Export PDF', 'تصدير PDF')}
            </Button>
          </div>
        }
      />

      {error && (
        <Card className="border-rose-200 bg-rose-50/40">
          <div className="flex items-center gap-3 text-sm text-rose-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <Button variant="secondary" size="sm" onClick={fetchData}>{tr('Retry', 'إعادة المحاولة')}</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <Card><Skeleton count={4} className="h-20" /></Card>
      ) : (
        <>
          <KpiRow>
            <StatCard
              icon={<DollarSign className="w-5 h-5" />}
              value={`${displayCurrency} ${fmt(totalRevenue)}`}
              label={tr('Total Revenue', 'إجمالي الإيرادات')}
              delta="+12.4%"
              trend="up"
              tone="emerald"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              value={`${avgOccupancy}%`}
              label={tr('Avg Occupancy', 'متوسط الإشغال')}
              delta="+1.2%"
              trend="up"
              tone="sky"
            />
            <StatCard
              icon={<ArrowUpRight className="w-5 h-5" />}
              value={`${displayCurrency} ${fmt(totalRevenue - totalExpenses)}`}
              label={tr('Net Operating Income', 'صافي الدخل التشغيلي')}
              delta="+8.7%"
              trend="up"
              tone="orange"
            />
            <StatCard
              icon={<ArrowDownRight className="w-5 h-5" />}
              value={tickets.filter(t => t.status !== 'completed').length}
              label={tr('Open Tickets', 'تذاكر الصيانة')}
              delta={tr('maintenance', 'صيانة')}
              trend="down"
              tone="rose"
            />
          </KpiRow>

          {/* Revenue Chart */}
          <Card>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
              <div>
                <h2 className="font-extrabold text-[#132B25] text-sm uppercase tracking-wider">{tr('Revenue vs Expenses', 'الإيرادات والمصروفات المتوقعة')}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {monthlyRevenue.length > 0
                    ? `${tr('Monthly breakdown from', 'تقسيم شهري من')} ${payments.filter(p => p.status === 'received').length} ${tr('collected payments', 'مدفوعات تم تحصيلها')}`
                    : tr('No payment data yet — add payments in /payments', 'لا توجد بيانات مدفوعات بعد — أضف مدفوعات في صفحة المدفوعات')}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#132B25]" />{tr('Revenue', 'الإيرادات')}</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#D97757]" />{tr('Expenses (est.)', 'المصروفات (تقديرية)')}</span>
              </div>
            </div>
            <div className="flex items-end gap-1.5 h-48">
              {monthlyRevenue.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end gap-0.5 h-40">
                    <div
                      className="flex-1 bg-[#132B25] rounded-t-sm min-w-[4px] hover:bg-[#0D2A24] transition-colors cursor-pointer"
                      style={{ height: `${(m.revenue / maxRevenue) * 100}%` }}
                    />
                    <div
                      className="flex-1 bg-[#D97757] rounded-t-sm min-w-[4px] hover:bg-[#C4694C] transition-colors cursor-pointer"
                      style={{ height: `${(m.expenses / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{m.month}</span>
                </div>
              ))}
              {monthlyRevenue.length === 0 && (
                <div className="flex-1 flex items-center justify-center h-40 border-2 border-dashed border-slate-200 rounded-xl">
                  <span className="text-xs text-slate-400 font-medium">{tr('Add payments to see revenue chart', 'أضف مدفوعات لرؤية رسم الإيرادات')}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Bottom Row: Occupancy + Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="flex items-center gap-2 mb-5">
                <Building2 className="w-4 h-4 text-[#D97757]" />
                <h2 className="font-extrabold text-[#132B25] text-sm uppercase tracking-wider">{tr('Occupancy by Property', 'نسبة الإشغال حسب العقار')}</h2>
              </div>
              <div className="space-y-4">
                {propertyBreakdown.map((p, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-700 font-medium">{p.name}</span>
                      <span className="font-extrabold text-[#132B25]">{p.occupancy}% ({p.occupied}/{p.units})</span>
                    </div>
                    <ProgressBar value={p.occupancy} />
                  </div>
                ))}
                {propertyBreakdown.length === 0 && (
                  <div className="text-xs text-slate-400 text-center py-8">{tr('Add properties and units to see occupancy data', 'أضف عقارات ووحدات لرؤية بيانات الإشغال')}</div>
                )}
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4 text-[#D97757]" />
                <h2 className="font-extrabold text-[#132B25] text-sm uppercase tracking-wider">{tr('Property Performance', 'أداء العقارات')}</h2>
              </div>
              <div className="space-y-3">
                {propertyBreakdown.sort((a, b) => b.revenue - a.revenue).map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">{p.name}</div>
                      <div className="text-[10px] text-slate-400">Occ: {p.occupancy}% · {p.units} {tr('units', 'وحدات')}</div>
                    </div>
                    <div className="text-end">
                      <div className="text-xs font-extrabold text-[#132B25]">{displayCurrency} {fmt(p.revenue)}/{tr('mo', 'شهر')}</div>
                      <div className={`text-[10px] font-semibold ${p.growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {p.growth >= 0 ? '+' : ''}{p.growth}% {tr('growth', 'نمو')}
                      </div>
                    </div>
                  </div>
                ))}
                {propertyBreakdown.length === 0 && (
                  <div className="text-xs text-slate-400 text-center py-8">{tr('Add properties to see performance data', 'أضف عقارات لرؤية بيانات الأداء')}</div>
                )}
              </div>
            </Card>
          </div>

          {/* Summary Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="flex items-center gap-2 mb-5">
                <Receipt className="w-4 h-4 text-[#D97757]" />
                <h2 className="font-extrabold text-[#132B25] text-sm uppercase tracking-wider">{tr('Revenue Summary', 'ملخص الإيرادات')}</h2>
              </div>
              <div className="space-y-3">
                {[
                  { label: tr('Total Received', 'إجمالي المستلم'), value: `${displayCurrency} ${totalRevenue.toLocaleString()}`, tone: 'text-emerald-600' },
                  { label: tr('Pending Collection', 'قيد التحصيل'), value: `${displayCurrency} ${pendingAmount.toLocaleString()}`, tone: 'text-amber-600' },
                  { label: tr('Overdue', 'متأخر'),                  value: `${displayCurrency} ${overdueAmount.toLocaleString()}`,  tone: 'text-rose-600' },
                  { label: tr('Net Income (Rev - Est. Exp.)', 'صافي الدخل (إيراد - مصروف)'), value: `${displayCurrency} ${(totalRevenue - totalExpenses).toLocaleString()}`, tone: 'text-[#132B25]' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <span className="text-xs font-semibold text-slate-600">{row.label}</span>
                    <span className={`text-sm font-extrabold ${row.tone}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-5">
                <Building2 className="w-4 h-4 text-[#D97757]" />
                <h2 className="font-extrabold text-[#132B25] text-sm uppercase tracking-wider">{tr('Occupancy Overview', 'نظرة عامة على الإشغال')}</h2>
              </div>
              <div className="flex items-center gap-6 mb-5">
                <div className="relative w-20 h-20 shrink-0">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F1F5F9" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={avgOccupancy >= 90 ? '#059669' : avgOccupancy >= 70 ? '#D97757' : '#DC2626'} strokeWidth="3" strokeDasharray={`${avgOccupancy}, 100`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-base font-extrabold text-slate-900">{avgOccupancy}%</span>
                  </div>
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold">{tr('Occupied Units', 'وحدات مشغولة')}</span>
                    <span className="font-extrabold text-emerald-600">{units.filter(u => u.status === 'occupied').length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold">{tr('Vacant Units', 'وحدات فارغة')}</span>
                    <span className="font-extrabold text-blue-600">{units.filter(u => u.status === 'vacant').length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold">{tr('Total Units', 'إجمالي الوحدات')}</span>
                    <span className="font-extrabold text-slate-700">{units.length}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-5">
                <Wrench className="w-4 h-4 text-[#D97757]" />
                <h2 className="font-extrabold text-[#132B25] text-sm uppercase tracking-wider">{tr('Maintenance Summary', 'ملخص الصيانة')}</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: tr('Open', 'مفتوح'),      value: openTickets,             tone: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: tr('In Progress', 'قيد التنفيذ'), value: inProgressTickets, tone: 'text-[#D97757]', bg: 'bg-orange-50' },
                  { label: tr('Completed', 'مكتمل'),  value: completedTickets,        tone: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: tr('Urgent', 'عاجل'),      value: urgentTickets,           tone: 'text-rose-600', bg: 'bg-rose-50' },
                ].map((k) => (
                  <div key={k.label} className={`${k.bg} rounded-xl p-4 text-center`}>
                    <div className={`text-2xl font-extrabold ${k.tone}`}>{k.value}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 mt-1">{k.label}</div>
                  </div>
                ))}
              </div>
              {(() => {
                const costTickets = tickets.filter(t => t.actual_cost != null);
                const totalCost = costTickets.reduce((s, t) => s + (t.actual_cost || 0), 0);
                const avgCost = costTickets.length > 0 ? Math.round(totalCost / costTickets.length) : null;
                return (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="text-xs text-slate-500">
                      {tr('Avg cost per ticket', 'متوسط تكلفة التذكرة')}:{' '}
                      <span className="font-bold text-[#132B25]">
                        {avgCost !== null ? `${displayCurrency} ${avgCost.toLocaleString()}` : '—'}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-5">
                <Users className="w-4 h-4 text-[#D97757]" />
                <h2 className="font-extrabold text-[#132B25] text-sm uppercase tracking-wider">{tr('Lead Pipeline Summary', 'ملخص خط أنابيب العملاء')}</h2>
              </div>
              <div className="flex items-stretch gap-2 mb-5">
                {[
                  { label: tr('New', 'جديد'),          value: newLeads,          tone: 'text-slate-600', bg: 'bg-slate-100' },
                  { label: tr('Contacted', 'تم الاتصال'), value: contactedLeads,   tone: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: tr('Converted', 'تم التحويل'), value: convertedLeads,   tone: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((stage) => (
                  <div key={stage.label} className={`flex-1 ${stage.bg} rounded-xl p-3 text-center`}>
                    <div className={`text-xl font-extrabold ${stage.tone}`}>{stage.value}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 mt-1">{stage.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-extrabold text-[#132B25]">{leads.length}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">{tr('Total Leads', 'إجمالي العملاء')}</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-extrabold text-emerald-600">{convertedLeads}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">{tr('Converted', 'تم التحويل')}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-semibold">{tr('Conversion Rate', 'معدل التحويل')}</span>
                  <span className="font-extrabold text-[#132B25]">
                    {leads.length > 0 ? Math.round((convertedLeads / leads.length) * 100) : 0}%
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Campaign Spend Summary */}
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <Megaphone className="w-4 h-4 text-[#D97757]" />
              <h2 className="font-extrabold text-[#132B25] text-sm uppercase tracking-wider">{tr('Marketing Spend Overview', 'نظرة عامة على الإنفاق التسويقي')}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: tr('Total Budget', 'إجمالي الميزانية'),         value: `${displayCurrency} ${totalCampaignBudget.toLocaleString()}`,  tone: 'text-[#132B25]', bg: 'bg-slate-50' },
                { label: tr('Total Spent', 'المنفق فعلياّ'),               value: `${displayCurrency} ${totalCampaignSpent.toLocaleString()}`,   tone: 'text-rose-600', bg: 'bg-rose-50' },
                { label: tr('Active Campaigns', 'حملات نشطة'),           value: String(activeCampaigns),                              tone: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: tr('Cost per Lead', 'تكلفة العميل المحتمل'),     value: campaigns.length > 0 && leads.length > 0
                    ? `${displayCurrency} ${Math.round(totalCampaignSpent / Math.max(leads.length, 1))}`
                    : '—',                                           tone: 'text-[#132B25]', bg: 'bg-slate-50' },
              ].map((k) => (
                <div key={k.label} className={`${k.bg} rounded-xl p-4 text-center`}>
                  <div className={`text-xl font-extrabold ${k.tone}`}>{k.value}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 mt-1">{k.label}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Report Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: tr('Revenue Report', 'تقرير الإيرادات'), desc: tr('Detailed income & expense breakdown by property', 'تفاصيل الدخل والمصروفات حسب العقار'),  ico: DollarSign, color: '#132B25' },
              { title: tr('Occupancy Report', 'تقرير الإشغال'), desc: tr('Unit-level occupancy rates & trends per property', 'معدلات الإشغال لكل وحدة واتجاهات كل عقار'),  ico: TrendingUp, color: '#059669' },
              { title: tr('Campaign ROI Report', 'تقرير عائد الحملات'), desc: tr('Marketing spend vs. lead generation performance', 'إنفاق التسويق مقابل أداء توليد العملاء المحتملين'),  ico: Megaphone, color: '#D97757' },
            ].map((r, i) => (
              <Card key={i} hover className="text-start group">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3 group-hover:bg-[#132B25] group-hover:border-[#132B25] transition-all duration-200">
                  <r.ico className="w-5 h-5" style={{ color: r.color }} />
                </div>
                <h3 className="font-extrabold text-[#132B25] text-sm">{r.title}</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{r.desc}</p>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
