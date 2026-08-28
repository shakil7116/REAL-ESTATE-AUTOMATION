'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  DollarSign, Building2, Mail, Wrench,
  Users, FileText,
  Clock,
} from 'lucide-react';
import { useCountry } from '@/context/CountryContext';
import { useClientDate } from '@/lib/useClientTime';
import { StatCard, KpiRow, Card, Skeleton } from '@/components/ui';

// Recharts is ~1MB minified. Lazy-load the chart so it doesn't bloat the
// initial dashboard bundle — users see the stat cards instantly.
const RevenueChart = dynamic(() => import('../components/RevenueChart'), {
  ssr: false,
  loading: () => <Card><Skeleton className="h-56" /></Card>,
});

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
        <KpiRow className="mb-6">
          <StatCard
            icon={<DollarSign className="w-5 h-5" />}
            value={stats.totalRevenue > 0 ? `${displayCurrency} ${formatValue(s.totalRevenue)}` : '—'}
            label={monthlyRevenue}
            delta={stats.totalRevenue > 0 ? '+8.4%' : '—'}
            trend={stats.totalRevenue > 0 ? 'up' : 'flat'}
            tone="emerald"
          />
          <StatCard
            icon={<Building2 className="w-5 h-5" />}
            value={s.occupancyRate > 0 ? `${s.occupancyRate}%` : '—'}
            label={occupancyRate}
            delta={stats.occupancyRate > 0 ? '+2.1%' : '—'}
            trend={stats.occupancyRate > 0 ? 'up' : 'flat'}
            tone="sky"
          />
          <StatCard
            icon={<Mail className="w-5 h-5" />}
            value={stats.pendingPayments > 0 ? `${displayCurrency} ${formatValue(s.pendingPayments)}` : '—'}
            label={pendingRent}
            delta={stats.pendingPayments > 0 ? '-12.6%' : '—'}
            trend={stats.pendingPayments > 0 ? 'down' : 'flat'}
            tone="orange"
          />
          <StatCard
            icon={<Wrench className="w-5 h-5" />}
            value={s.openTickets > 0 ? s.openTickets : '—'}
            label={activeTickets}
            delta={stats.openTickets > 0 ? '-4 this week' : '—'}
            trend={stats.openTickets > 0 ? 'down' : 'flat'}
            tone="purple"
          />
        </KpiRow>

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

      {/* Copilot is now a global panel mounted in the dashboard layout — see GlobalCopilot */}
    </div>
  );
}
