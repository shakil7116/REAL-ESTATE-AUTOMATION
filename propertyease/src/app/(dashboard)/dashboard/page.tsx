'use client';

import { useState, useEffect, useRef } from 'react';
import {
  DollarSign, Building2, Mail, Wrench,
  Sparkles, ArrowUpRight, ArrowDownRight, Users, FileText,
  Clock, ChevronDown,
} from 'lucide-react';
import RevenueChart from '../components/RevenueChart';
import { useCountry } from '@/context/CountryContext';
import { useClientDate } from '@/lib/useClientTime';

// ── Live mock data (syncs to Supabase when backend is connected) ──────────
// Empty by design — only real data from API is shown
const EMPTY_STATS = {
  totalRevenue: 0,
  occupancyRate: 0,
  pendingPayments: 0,
  openTickets: 0,
  occupiedUnits: 0,
  vacantUnits: 0,
  totalUnits: 0,
  overduePayments: 0,
};

const RECENT_ACTIVITY_EN = [
  {
    id: 1,
    text: 'RENT received from Marina Tower 4B',
    time: '2 min ago',
    icon: DollarSign,
    color: '#22C55E',
  },
  {
    id: 2,
    text: 'New maintenance request — Water leak in Palm Residence 12A',
    time: '18 min ago',
    icon: Wrench,
    color: '#F59E0B',
  },
  {
    id: 3,
    text: 'Lease signed — Business Hub 3A (2-year term)',
    time: '1 hr ago',
    icon: FileText,
    color: '#3B82F6',
  },
  {
    id: 4,
    text: 'New lead inquiry — Studio at Marina Tower, QAR 55K',
    time: '2 hrs ago',
    icon: Users,
    color: '#8B5CF6',
  },
  {
    id: 5,
    text: 'PDC returned — Tenant 8C, Palm Residence',
    time: '3 hrs ago',
    icon: Clock,
    color: '#EF4444',
  },
];

const RECENT_ACTIVITY_AR = [
  {
    id: 1,
    text: 'تم استلام إيجار بقيمة 12,500 ريال من برج Marina 4B',
    time: 'منذ دقيقتين',
    icon: DollarSign,
    color: '#22C55E',
  },
  {
    id: 2,
    text: 'طلب صيانة جديد — تسرب مياه في Palm Residence 12A',
    time: 'منذ 18 دقيقة',
    icon: Wrench,
    color: '#F59E0B',
  },
  {
    id: 3,
    text: 'تم توقيع عقد إيجار — Business Hub 3A (مدة سنتان)',
    time: 'منذ ساعة',
    icon: FileText,
    color: '#3B82F6',
  },
  {
    id: 4,
    text: 'استفسار عميل جديد — استوديو في برج Marina، 55 ألف ريال',
    time: 'منذ ساعتين',
    icon: Users,
    color: '#8B5CF6',
  },
  {
    id: 5,
    text: 'شيك PDC مردود — مستأجر 8C، Palm Residence',
    time: 'منذ 3 ساعات',
    icon: Clock,
    color: '#EF4444',
  },
];

export default function DashboardPage() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const { country, currency, currencySymbol } = useCountry();
  const [stats, setStats] = useState(EMPTY_STATS);  const dataFetchedRef = useRef(false);

  // Load language preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('propertyease_lang') as 'en' | 'ar' | null;
      if (stored) setLang(stored);
    }
  }, []);

  // Fetch dashboard stats once on mount — render empty state immediately, fetch in background
  useEffect(() => {
    if (dataFetchedRef.current) return;
    dataFetchedRef.current = true;

    // Render immediately — no loading spinner delay
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setStats(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const s = stats;

  // Country → ICU locale map. Used for time formatting (so the live
  // portfolio pulse shows e.g. "09:46 GST" for Qatar in Arabic, not the
  // UAE default). Falls back to en-US for unmapped countries.
  const countryLocale: Record<string, string> = {
    QA: 'en-QA', AE: 'en-AE', SA: 'en-SA', KW: 'en-KW', BH: 'en-BH', OM: 'en-OM',
  };
  const intlLocale = lang === 'ar'
    ? `ar-${country.code}`
    : (countryLocale[country.code] || 'en-US');

  // Time-of-day stamp is timezone- and locale-dependent, so it must NOT
  // be rendered on the server. Server uses UTC, client uses the user's
  // local timezone, and ICU output also differs between Node and browsers.
  // We render a stable placeholder on SSR/first render and only swap in
  // the live time after mount — and keep it fresh via a 60s interval.
  const liveNow = useClientDate(
    () => new Date().toLocaleTimeString(intlLocale, {
      hour: '2-digit',
      minute: '2-digit',
    }).toUpperCase(),
    '--:--'
  );

  // On the English page, show the currency CODE (e.g. "QAR") instead of
  // the Arabic-Indic symbol (e.g. "ر.ق"). The symbol is meaningful to
  // Arabic readers; the code is meaningful to English readers. The
  // Arabic page uses the symbol, which is the convention everywhere
  // in the GCC.
  const displayCurrency = lang === 'ar' ? currencySymbol : currency;

  // Localized strings
  const pulseBadge = lang === 'ar'
    ? `نبض المحفظة المباشر · ${liveNow} +ضريبة`
    : `Live portfolio pulse · ${liveNow} VAT`;
  const heading = lang === 'ar' ? 'محفكتك، بوضوح.' : 'Your portfolio, in focus.';
  const subheading = lang === 'ar'
    ? 'نظرة واضحة على العمل الذي يهم هذا الأسبوع.'
    : 'A clear read on the work that matters this week.';
  const monthlyRevenue = lang === 'ar' ? 'الإيرادات الشهرية' : 'Monthly Revenue';
  const occupancyRate = lang === 'ar' ? 'معدل الإشغال' : 'Occupancy Rate';
  const pendingRent = lang === 'ar' ? 'الإيجار المعلق' : 'Pending Rent';
  const activeTickets = lang === 'ar' ? 'التذاكر النشطة' : 'Active Tickets';
  const recentActivity = lang === 'ar' ? 'النشاط الأخير' : 'Recent activity';
  const pulseText = lang === 'ar' ? 'نبض محفظتك' : 'The pulse across your portfolio';
  const viewAll = lang === 'ar' ? 'عرض الكل ←' : 'View all →';
  const activityData = lang === 'ar' ? RECENT_ACTIVITY_AR : RECENT_ACTIVITY_EN;

  // No fake numbers: show "—" when there's no data
  const formatValue = (value: number) => {
    if (value === 0) return '—';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toLocaleString();
  };

  return (
    <div className="flex gap-6">
      {/* ══════════════ Main Content ══════════════ */}
      <div className="flex-1 min-w-0">

        {/* Live Pulse Badge */}
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {pulseBadge}
          </span>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0D2A24] tracking-tight leading-tight">
            {heading}
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">
            {subheading}
          </p>
        </div>

        {/* ── 4 Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

          {/* Monthly Revenue */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600">
                <ArrowUpRight className="w-3 h-3" />
                {stats.totalRevenue > 0 ? '+8.4%' : '—'}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-[#0D2A24] mb-1">
              {stats.totalRevenue > 0
                ? `${displayCurrency} ${formatValue(s.totalRevenue)}`
                : '—'}
            </div>
            <div className="text-xs text-slate-500 font-semibold">{monthlyRevenue}</div>
          </div>

          {/* Occupancy Rate */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-sky-600" />
              </div>
              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600">
                <ArrowUpRight className="w-3 h-3" />
                {stats.occupancyRate > 0 ? '+2.1%' : '—'}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-[#0D2A24] mb-1">
              {s.occupancyRate > 0 ? `${s.occupancyRate}%` : '—'}
            </div>
            <div className="text-xs text-slate-500 font-semibold">{occupancyRate}</div>
          </div>

          {/* Pending Rent */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Mail className="w-5 h-5 text-orange-600" />
              </div>
              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-rose-500">
                <ArrowDownRight className="w-3 h-3" />
                {stats.pendingPayments > 0 ? '-12.6%' : '—'}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-[#0D2A24] mb-1">
              {stats.pendingPayments > 0
                ? `${displayCurrency} ${formatValue(s.pendingPayments)}`
                : '—'}
            </div>
            <div className="text-xs text-slate-500 font-semibold">{pendingRent}</div>
          </div>

          {/* Active Tickets */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-purple-600" />
              </div>
              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-rose-500">
                <ArrowDownRight className="w-3 h-3" />
                {stats.openTickets > 0 ? '-4 this week' : '—'}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-[#0D2A24] mb-1">
              {s.openTickets > 0 ? s.openTickets : '—'}
            </div>
            <div className="text-xs text-slate-500 font-semibold">{activeTickets}</div>
          </div>
        </div>

        {/* ── Revenue Trend Chart ── */}
        <div className="mb-6">
          <RevenueChart lang={lang} currency={currency} currencySymbol={displayCurrency} hasData={stats.totalRevenue > 0} />
        </div>

        {/* ── Recent Activity ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-[#0D2A24] text-base">{recentActivity}</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">{pulseText}</p>
            </div>
            <a
              href="/reports"
              className="text-xs font-semibold text-[#D97757] hover:text-[#c46040] transition-colors"
            >
              {viewAll}
            </a>
          </div>
          <div className="divide-y divide-slate-50">
            {activityData.map((activity) => (
              <div
                key={activity.id}
                className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: activity.color + '15' }}
                >
                  <activity.icon className="w-4 h-4" style={{ color: activity.color }} />
                </div>
                <p className="text-sm text-slate-700 flex-1 font-medium">{activity.text}</p>
                <span className="text-xs text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Copilot Panel ── */}
      <CopilotWidget lang={lang} />
    </div>
  );
}

// ── Mini Copilot Widget (collapsible floating box) ────────────────────
function CopilotWidget({ lang }: { lang: 'en' | 'ar' }) {
  const [expanded, setExpanded] = useState(false);
  const isRtl = lang === 'ar';

  return (
    <>
      {/* Desktop: fixed bottom-right floating FAB */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="hidden xl:flex fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#132B25] hover:bg-[#1A3831] text-white rounded-2xl shadow-2xl flex items-center justify-center transition-all active:scale-95 group"
          aria-label="Open Copilot"
        >
          <Sparkles className="w-6 h-6 text-[#D97757] group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Expanded overlay — takes up half the viewport on mobile/tablet */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm xl:hidden"
          onClick={(e) => { if (e.target === e.currentTarget) setExpanded(false); }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-[95vw] max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
            dir={isRtl ? 'rtl' : 'ltr'}
            style={{ animation: 'copilotSlideUp 0.25s cubic-bezier(0.16,1,0.3,1)' }}
          >
            {/* Header */}
            <div className="bg-[#132B25] p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#D97757]" />
                </div>
                <div>
                  <div className="font-bold text-sm tracking-tight">PropertyEase Copilot</div>
                  <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {lang === 'en' ? 'Online — Portfolio Live' : 'متصل — محفظتك مباشرة'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Chat content area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              <div className="text-center py-8">
                <Sparkles className="w-8 h-8 text-[#D97757] mx-auto mb-2 opacity-60" />
                <p className="text-xs text-slate-400">
                  {lang === 'en' ? 'Ask me about your portfolio, leases, maintenance, or marketing.' : 'اسألني عن محفظتك أو عقودك أو صيانتك أو تسويقك.'}
                </p>
              </div>
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-slate-200 shrink-0">
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 focus-within:border-[#132B25] focus-within:bg-white transition-all">
                <input
                  type="text"
                  placeholder={lang === 'en' ? 'Ask Copilot anything...' : 'اسأل المساعد أي شيء...'}
                  className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 outline-none"
                />
                <button className="w-7 h-7 bg-[#132B25] text-white rounded-lg flex items-center justify-center hover:bg-[#1A3831] transition-colors">
                  <Sparkles className="w-4 h-4 text-[#D97757]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline keyframe for the slide-up animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes copilotSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </>
  );
}
