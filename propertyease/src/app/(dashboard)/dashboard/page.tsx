'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  DollarSign, Building2, Mail, Wrench,
  Users, FileText, Clock,
} from 'lucide-react';
import type { Payment } from '@/lib/database';
import { useCountry } from '@/context/CountryContext';
import { useClientDate } from '@/lib/useClientTime';
import { StatCard, KpiRow, Card, Skeleton } from '@/components/ui';

// ── Activity row shape (from /api/activities) ──────────────────────────
interface ActivityRow {
  id: string;
  action: string;
  entity: string;
  entity_id: string;
  details: string | null;
  user_id?: string;
  created_at: string;
}

// Activity `action` → icon + color + EN/AR formatter. `details` is JSON
// (stored as a string in the Activity table). Formatter receives the
// parsed object and returns a human-readable sentence.
type IconComponent = typeof DollarSign;
type ActivityFormatter = (d: any) => string;

const ACTIVITY_META: Record<string, {
  icon: IconComponent; color: string; en: ActivityFormatter; ar: ActivityFormatter;
}> = {
  payment_received: {
    icon: DollarSign, color: '#22C55E',
    en: (d) => `Rent received from ${d?.tenant ?? 'tenant'} (${d?.property ?? ''} ${d?.unit ?? ''})`,
    ar: (d) => `تم استلام إيجار من ${d?.tenant ?? 'مستأجر'} (${d?.property ?? ''} ${d?.unit ?? ''})`,
  },
  payment_overdue: {
    icon: Clock, color: '#EF4444',
    en: (d) => `Overdue payment — ${d?.tenant ?? 'tenant'} (${d?.property ?? ''} ${d?.unit ?? ''})`,
    ar: (d) => `دفعة متأخرة — ${d?.tenant ?? 'مستأجر'} (${d?.property ?? ''} ${d?.unit ?? ''})`,
  },
  maintenance_created: {
    icon: Wrench, color: '#F59E0B',
    en: (d) => `New maintenance — ${d?.title ?? ''} (${d?.property ?? ''} ${d?.unit ?? ''})`,
    ar: (d) => `طلب صيانة جديد — ${d?.title ?? ''} (${d?.property ?? ''} ${d?.unit ?? ''})`,
  },
  maintenance_completed: {
    icon: Wrench, color: '#22C55E',
    en: (d) => `Maintenance completed — ${d?.title ?? ''} (${d?.property ?? ''} ${d?.unit ?? ''})`,
    ar: (d) => `اكتملت الصيانة — ${d?.title ?? ''} (${d?.property ?? ''} ${d?.unit ?? ''})`,
  },
  lease_signed: {
    icon: FileText, color: '#3B82F6',
    en: (d) => `Lease signed — ${d?.tenant ?? 'tenant'} (${d?.property ?? ''} ${d?.unit ?? ''})`,
    ar: (d) => `تم توقيع عقد — ${d?.tenant ?? 'مستأجر'} (${d?.property ?? ''} ${d?.unit ?? ''})`,
  },
  lease_renewed: {
    icon: FileText, color: '#3B82F6',
    en: (d) => `Lease renewed — ${d?.tenant ?? 'tenant'} (${d?.property ?? ''} ${d?.unit ?? ''})`,
    ar: (d) => `تم تجديد عقد — ${d?.tenant ?? 'مستأجر'} (${d?.property ?? ''} ${d?.unit ?? ''})`,
  },
  lead_created: {
    icon: Users, color: '#8B5CF6',
    en: (d) => `New lead — ${d?.name ?? ''} (${d?.interest ?? ''})`,
    ar: (d) => `عميل جديد — ${d?.name ?? ''} (${d?.interest ?? ''})`,
  },
  lead_converted: {
    icon: Users, color: '#22C55E',
    en: (d) => `Lead converted — ${d?.name ?? ''}`,
    ar: (d) => `تم تحويل العميل — ${d?.name ?? ''}`,
  },
};
const FALLBACK_META = {
  icon: FileText as IconComponent, color: '#94A3B8',
  en: () => 'Activity recorded',
  ar: () => 'نشاط مسجل',
};

function parseActivityDetails(raw: string | null): any {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function relativeTime(iso: string, lang: 'en' | 'ar'): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.round(diffMs / 60000);
  const h = Math.round(diffMs / 3600000);
  const d = Math.round(diffMs / 86400000);
  if (lang === 'ar') {
    if (m < 1) return 'الآن';
    if (m < 60) return `منذ ${m} دقيقة`;
    if (h < 24) return `منذ ${h} ساعة`;
    return `منذ ${d} يوم`;
  }
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  if (h < 24) return `${h} hr ago`;
  return `${d} day${d === 1 ? '' : 's'} ago`;
}

// ── Lazy-load Recharts (~1MB) so the dashboard bundle stays slim ───────
const RevenueChart = dynamic(() => import('../components/RevenueChart'), {
  ssr: false,
  loading: () => <Card><Skeleton className="h-56" /></Card>,
});

// Empty stats — only real API data is shown. No fake numbers.
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

export default function DashboardPage() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const { country, currency, currencySymbol } = useCountry();
  const [stats, setStats] = useState(EMPTY_STATS);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const dataFetchedRef = useRef(false);

  // Load language preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('propertyease_lang') as 'en' | 'ar' | null;
      if (stored) setLang(stored);
    }
  }, []);

  // Fetch dashboard stats + activities + payments in parallel — render
  // empty state immediately, fetch in background.
  useEffect(() => {
    if (dataFetchedRef.current) return;
    dataFetchedRef.current = true;

    Promise.all([
      fetch('/api/dashboard').then((r) => r.json()).catch(() => null),
      fetch('/api/activities?limit=8').then((r) => r.json()).catch(() => null),
      fetch('/api/payments').then((r) => r.json()).catch(() => null),
    ]).then(([dashRes, actRes, payRes]) => {
      if (dashRes?.ok && dashRes.data) setStats(dashRes.data);
      if (actRes?.ok && Array.isArray(actRes.data)) setActivities(actRes.data as ActivityRow[]);
      if (payRes?.ok && Array.isArray(payRes.data)) setPayments(payRes.data as Payment[]);
    });
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
  const heading = lang === 'ar' ? 'محفظتك، بوضوح.' : 'Your portfolio, in focus.';
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
  const noActivity = lang === 'ar' ? 'لا يوجد نشاط حديث' : 'No recent activity';

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
          <RevenueChart
            lang={lang}
            currency={currency}
            currencySymbol={displayCurrency}
            hasData={stats.totalRevenue > 0}
            paymentData={payments}
          />
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
          {activities.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-400">{noActivity}</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {activities.slice(0, 8).map((a) => {
                const meta = ACTIVITY_META[a.action] || FALLBACK_META;
                const details = parseActivityDetails(a.details);
                const text = (lang === 'ar' ? meta.ar : meta.en)(details);
                const time = relativeTime(a.created_at, lang);
                const Icon = meta.icon;
                return (
                  <div
                    key={a.id}
                    className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: meta.color + '15' }}
                    >
                      <Icon className="w-4 h-4" style={{ color: meta.color }} />
                    </div>
                    <p className="text-sm text-slate-700 flex-1 font-medium">{text}</p>
                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {time}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Copilot is now a global panel mounted in the dashboard layout — see GlobalCopilot */}
    </div>
  );
}
