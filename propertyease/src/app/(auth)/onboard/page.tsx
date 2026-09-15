'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home, Building2, Warehouse, Store, ArrowRight, ArrowLeft,
  CheckCircle2, Sparkles, Wrench, Users, TrendingUp,
  DollarSign, Zap, Brain, PenTool, Target,
  ChevronRight, X, AlertCircle,
} from 'lucide-react';
import { useOnboarding } from '@/context/OnboardingContext';
import { t, type Locale } from '@/lib/i18n';

// ── Data ────────────────────────────────────────────────────────────────────
const PROPERTY_TYPES = [
  { id: 'residential', icon: Home, enLabel: 'Residential', arLabel: 'سكني', enDesc: 'Apartments, Villas, Townhouses', arDesc: 'شقق، فلل، تاون هاوس', color: '#059669', glow: 'shadow-emerald-500/30' },
  { id: 'commercial', icon: Building2, enLabel: 'Commercial', arLabel: 'تجاري', enDesc: 'Offices, Retail, Warehouses', arDesc: 'مكاتب، محلات، مستودعات', color: '#2563EB', glow: 'shadow-blue-500/30' },
  { id: 'mixed', icon: Warehouse, enLabel: 'Mixed-Use', arLabel: 'مختلط الاستخدام', enDesc: 'Residential + Commercial blend', arDesc: 'سكني وتجاري معااُ', color: '#7C3AED', glow: 'shadow-violet-500/30' },
  { id: 'hospitality', icon: Store, enLabel: 'Hospitality', arLabel: 'ضيافة وفنادق', enDesc: 'Hotels, Serviced Apartments', arDesc: 'فنادق، شقق مخدومة', color: '#D97757', glow: 'shadow-orange-500/30' },
];

const PORTFOLIO_SIZES = [
  { id: '1-10', enLabel: '1–10', arLabel: '١ – ١٠', enDesc: 'Starter', arDesc: 'بداية', bigNum: '10' },
  { id: '11-50', enLabel: '11–50', arLabel: '١١ – ٥٠', enDesc: 'Growing', arDesc: 'متنامٍ', bigNum: '50' },
  { id: '51-200', enLabel: '51–200', arLabel: '٥١ – ٢٠٠', enDesc: 'Established', arDesc: 'راسخ', bigNum: '200' },
  { id: '200+', enLabel: '200+', arLabel: '٢٠٠+', enDesc: 'Enterprise', arDesc: 'مؤسسة', bigNum: '∞' },
];

const CHALLENGES = [
  { id: 'rent-collection', icon: DollarSign, enLabel: 'Rent Collection', arLabel: 'تحصيل الإيجارات', enDesc: 'Late payments, PDC tracking gaps', arDesc: 'تأخر الدفعات وشيكات ما قبل التاريخ', severity: 'medium' },
  { id: 'maintenance', icon: Wrench, enLabel: 'Maintenance', arLabel: 'الصيانة', enDesc: 'Slow response, contractor chaos', arDesc: 'بطء الاستجابة وفوضى المقاولين', severity: 'high' },
  { id: 'tenant-communication', icon: Users, enLabel: 'Tenant comms', arLabel: 'تواصل المستأجرين', enDesc: '24/7 support overload', arDesc: 'إرهاق دعم العملاء على مدار الساعة', severity: 'medium' },
  { id: 'marketing', icon: TrendingUp, enLabel: 'Marketing & Vacancies', arLabel: 'التسويق والشواغر', enDesc: 'Units staying vacant too long', arDesc: 'وحدات شاغرة لفترة طويلة', severity: 'high' },
  { id: 'reporting', icon: Sparkles, enLabel: 'Reporting', arLabel: 'التقارير', enDesc: 'No visibility into revenue', arDesc: 'عدم وضوح الرؤية المالية', severity: 'low' },
  { id: 'multi-property', icon: Building2, enLabel: 'Multi-Property', arLabel: 'إدارة متعددة', enDesc: 'Hard to track multiple locations', arDesc: 'صعوبة تتبع مواقع مختلفة', severity: 'medium' },
];

const TEAM_SIZES = [
  { id: 'solo', enLabel: 'Just me', arLabel: 'أنا وحدي', enDesc: 'Solo property manager', arDesc: 'مدير عقارات فردي', emoji: '🧑‍💼' },
  { id: '2-5', enLabel: '2–5', arLabel: '٢ – ٥', enDesc: 'Small team', arDesc: 'فريق صغير', emoji: '👥' },
  { id: '6-20', enLabel: '6–20', arLabel: '٦ – ٢٠', enDesc: 'Growing team', arDesc: 'فريق متنامٍ', emoji: '🏢' },
  { id: '20+', enLabel: '20+', arLabel: '٢٠+', enDesc: 'Large org', arDesc: 'منظمة كبيرة', emoji: '🏗️' },
];

const STEP_HINTS_EN = [
  'Pick the category that best describes your properties.',
  'How many properties or units do you currently manage?',
  'What is the biggest problem you are trying to solve?',
  'Who else helps you manage your properties day-to-day?',
  'A few details so we can set up your account correctly.',
  'Here is the setup we built for you — review and start.',
];

const STEP_HINTS_AR = [
  'اختر الفئة الأقرب لوصف عقاراتك.',
  'كم عقار أو وحدة تديرها حالياُ؟',
  'ما أكبر مشكلة تحاول حلّها اليوم؟',
  'من يساعدك في إدارة عقاراتك يومياُ؟',
  'بعض التفاصيل لإعداد حسابك بالشكل الصحيح.',
  'هذا الإعداد الذي جهزناه لك — راجعه وابدأ.',
];

const STEP_TITLES_EN = [
  'What type of properties do you manage?',
  'How many properties do you manage?',
  'What is your biggest challenge right now?',
  'Who manages your properties with you?',
  'Tell us about your company',
  'You are all set!',
];

const STEP_TITLES_AR = [
  'ما نوع العقارات التي تديرها؟',
  'كم عقاراُ أو وحدة تديرها؟',
  'ما أكبر تحدٍّ تواجهه حالياُ؟',
  'من يدير عقاراتك معك؟',
  'أخبرنا عن شركتك',
  'كل شيء جاهز!',
];

const AUTO_ADVANCE_STEPS = new Set([0, 1, 2, 3]);

// ── Floating particles component ─────────────────────────────────────────────
function AmbientParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full mix-blend-multiply animate-float-blob"
          style={{
            width: `${60 + i * 40}px`,
            height: `${60 + i * 40}px`,
            left: `${10 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
            background: [`rgba(217,119,87,0.06)`, `rgba(5,150,105,0.05)`, `rgba(37,99,235,0.04)`][i % 3],
            filter: 'blur(40px)',
            animationDelay: `${i * 2}s`,
            animationDuration: `${12 + i * 3}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Step Card (premium interactive container) ────────────────────────────────
function OptionCard({
  selected,
  onClick,
  children,
  accentColor,
  glowClass,
  className = '',
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  accentColor?: string;
  glowClass?: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative group rounded-2xl border-2 transition-all duration-300 ease-out
        ${selected
          ? 'border-transparent shadow-lg scale-[1.02]'
          : 'border-white/60 bg-white/70 backdrop-blur-sm hover:bg-white hover:shadow-md hover:-translate-y-0.5 hover:border-white/80'
        }
        ${glowClass || ''}
        ${className}
      `}
      style={selected && accentColor ? { boxShadow: `0 8px 32px ${accentColor}30, inset 0 1px 0 rgba(255,255,255,0.5)`, borderColor: accentColor } : undefined}
    >
      {selected && (
        <div
          className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-all duration-300"
          style={{ background: accentColor || '#059669' }}
        >
          <CheckCircle2 className="w-4 h-4 text-white" />
        </div>
      )}
      <div className="p-5">{children}</div>
    </button>
  );
}

// ── Prescription logic helpers (mirrors /prescription page) ──────────────────
type RxItem = { icon: typeof Zap; color: string; en: string; ar: string; priority: 'urgent' | 'primary' | 'secondary' };

function getPrescriptions(challenge: string): RxItem[] {
  const base: RxItem[] = [
    { icon: Zap, color: '#059669', en: 'AI-powered tenant chatbot for 24/7 support', ar: 'شات بوت ذكي لدعم المستأجرين على مدار الساعة', priority: 'primary' },
    { icon: TrendingUp, color: '#2563EB', en: 'Automated rent collection with PDC tracking', ar: 'تحصيل إيجارات آلي مع تتبع الشيكات', priority: 'primary' },
    { icon: Wrench, color: '#D97757', en: 'Smart maintenance dispatch system', ar: 'نظام ذكي لإدارة الصيانة', priority: 'secondary' },
    { icon: Target, color: '#7C3AED', en: 'Marketing campaigns to reduce vacancies', ar: 'حملات تسويقية لتقليل الشواغر', priority: 'secondary' },
  ];
  const byChallenge: Record<string, RxItem[]> = {
    'rent-collection': [
      { icon: TrendingUp, color: '#DC2626', en: 'PDC tracking dashboard with expiry alerts', ar: 'لوحة تتبع الشيكات مع تنبيهات انتهاء الصلاحية', priority: 'urgent' },
      ...base.slice(0, 3),
    ],
    'maintenance': [
      { icon: Wrench, color: '#DC2626', en: 'Emergency response protocol with SLA tracking', ar: 'بروتوكول استجابة للطوارئ مع تتبع SLA', priority: 'urgent' },
      ...base.slice(0, 3),
    ],
    'marketing': [
      { icon: Target, color: '#DC2626', en: 'Vacancy reduction campaign with lead scoring', ar: 'حملة تقليل الشواغر مع تسجيل العملاء المحتملين', priority: 'urgent' },
      ...base.slice(0, 3),
    ],
    'tenant-communication': [
      { icon: Users, color: '#DC2626', en: 'Tenant self-service portal for payments & requests', ar: 'بوابة ذاتية للمستأجرين للمدفوعات والطلبات', priority: 'urgent' },
      ...base.slice(0, 3),
    ],
    'reporting': [
      { icon: Sparkles, color: '#DC2626', en: 'Revenue analytics suite with occupancy insights', ar: 'مجموعة تحليلات الإيرادات مع رؤى الإشغال', priority: 'urgent' },
      ...base.slice(0, 3),
    ],
    'multi-property': [
      { icon: Building2, color: '#DC2626', en: 'Multi-site management hub with comparative analytics', ar: 'مركز إدارة متعدد المواقع مع تحليلات مقارنة', priority: 'urgent' },
      ...base.slice(0, 3),
    ],
  };
  return byChallenge[challenge] ?? base;
}

function getSymptoms(challenge: string, isRtl: boolean): string {
  const map: Record<string, { en: string; ar: string }> = {
    'rent-collection': { en: 'Late rent collection, difficulty tracking PDC cheques, lack of financial visibility.', ar: 'تأخر في تحصيل الإيجارات، صعوبة في تتبع شيكات ما قبل التاريخ، نقص في الرؤية المالية.' },
    'maintenance': { en: 'Slow maintenance responses, contractor chaos, unexpected costs.', ar: 'استجابات بطيئة للصيانة، فوضى في إدارة المقاولين، تكاليف غير متوقعة.' },
    'tenant-communication': { en: 'Overwhelmed by repetitive support requests, tenant dissatisfaction, unresolved complaints.', ar: 'إرهاق من طلبات الدعم المتكررة، عدم رضا المستأجرين، شكاوى غير معالجة.' },
    'marketing': { en: 'Units vacant for extended periods, high customer acquisition cost, low conversion.', ar: 'وحدات شاغرة لفترة طويلة، تكلفة جذب عملاء مرتفعة، تحويل منخفض.' },
    'reporting': { en: 'Lack of financial clarity, difficulty making decisions, manual reporting.', ar: 'عدم وضوح الرؤية المالية، صعوبة في اتخاذ القرارات، تقارير يدوية.' },
    'multi-property': { en: 'Difficulty coordinating across sites, fragmented information, unstructured decision-making.', ar: 'صعوبة في التنسيق بين المواقع، معلومات متفرقة، قرارات غير مبنية على بيانات.' },
  };
  const { en, ar } = map[challenge] ?? { en: 'Portfolio needs comprehensive analysis.', ar: 'المحفظة تحتاج إلى تحليل شامل.' };
  return isRtl ? ar : en;
}

function getRecommendations(challenge: string, isRtl: boolean): string[] {
  const recs: Record<string, Array<{ en: string; ar: string }>> = {
    'rent-collection': [
      { en: 'Activate automatic payment reminders', ar: 'تفعيل نظام تذكير الدفع التلقائي' },
      { en: 'Connect bank account for instant payment updates', ar: 'ربط حساب بنكي لتحديث المدفوعات فوراُ' },
      { en: 'Set up weekly cash flow report', ar: 'إعداد تقرير التدفق النقدي الأسبوعي' },
    ],
    'maintenance': [
      { en: 'Create database of certified contractors', ar: 'إنشاء قاعدة بيانات مقاولين معتمدين' },
      { en: 'Enable smart ticketing system', ar: 'تفعيل نظام التذاكر الذكية' },
      { en: 'Set up SLAs for different priorities', ar: 'إعداد SLAs للأولويات المختلفة' },
    ],
    'marketing': [
      { en: 'Activate multi-platform campaigns', ar: 'تفعيل حملات متعددة المنصات' },
      { en: 'Set up lead scoring dashboard', ar: 'إعداد لوحة تحكم تسجيل العملاء المحتملين' },
      { en: 'Auto-optimize property listings', ar: 'تحسين Listings تلقائياُ' },
    ],
  };
  const items = recs[challenge] ?? [
    { en: 'Start by adding your first properties', ar: 'ابدأ بإضافة عقاراتك الأولى' },
    { en: 'Customize your dashboard', ar: 'تخصيص لوحة التحكم' },
    { en: 'Invite your team members', ar: 'دعوة فريق العمل' },
  ];
  return items.map(i => isRtl ? i.ar : i.en);
}

// ── Main Onboarding Page ─────────────────────────────────────────────────────
export default function OnboardPage() {
  const router = useRouter();
  const { data, setData, step, setStep, nextStep } = useOnboarding();
  const [lang, setLang] = useState<Locale>('en');
  const isRtl = lang === 'ar';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load language preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('propertyease_lang') as Locale | null;
      if (stored) setLang(stored);
    }
    setMounted(true);
  }, []);

  const tr = (en: string, ar: string) => isRtl ? ar : en;
  const autoAdvance = AUTO_ADVANCE_STEPS.has(step);
  const progress = ((step) / 5) * 100;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const advance = () => nextStep();

  const handlePropertyType = (id: string) => {
    setData({ propertyType: id });
    if (AUTO_ADVANCE_STEPS.has(step)) setTimeout(advance, 200);
  };

  const handlePortfolioSize = (id: string) => {
    setData({ portfolioSize: id });
    if (AUTO_ADVANCE_STEPS.has(step)) setTimeout(advance, 200);
  };

  const handleChallenge = (id: string) => {
    const isSelected = data.mainChallenge === id;
    setData({ mainChallenge: isSelected ? '' : id });
    if (!isSelected && AUTO_ADVANCE_STEPS.has(step)) setTimeout(advance, 200);
  };

  const handleTeamSize = (id: string) => {
    setData({ teamSize: id });
    if (AUTO_ADVANCE_STEPS.has(step)) setTimeout(advance, 200);
  };

  const handleStart = () => {
    if (isSubmitting) return; // re-entry guard
    setIsSubmitting(true);
    try {
      const payload = JSON.stringify(data);
      sessionStorage.setItem('propertyease_onboarding', payload);
      localStorage.setItem('propertyease_onboarding', payload);
    } catch {
      // storage may be full / disabled — non-fatal, signup page still has live context
    }
    // Navigate immediately; the spinner on the in-card CTA gives the visual feedback.
    // No artificial setTimeout — that was the source of the multi-minute "stuck" feel.
    router.push('/signup');
  };

  // ── Steps ─────────────────────────────────────────────────────────────────
  const renderStep0 = () => (
    <div className="grid grid-cols-2 gap-3">
      {PROPERTY_TYPES.map((pt) => {
        const selected = data.propertyType === pt.id;
        const isHovered = hoveredCard === pt.id;
        return (
          <OptionCard
            key={pt.id}
            selected={selected}
            onClick={() => handlePropertyType(pt.id)}
            accentColor={pt.color}
            glowClass={selected ? pt.glow : ''}
            className="min-h-[140px] flex flex-col"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 ${
                selected ? 'text-white' : 'text-slate-400 bg-white/80'
              }`}
              style={selected ? { background: pt.color, boxShadow: `0 4px 14px ${pt.color}50` } : {}}
            >
              <pt.icon className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm text-slate-800 leading-tight">
              {selected ? pt.arLabel : pt.enLabel}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-relaxed font-medium">
              {selected ? pt.arDesc : pt.enDesc}
            </div>
            {/* Subtle hover glow */}
            {isHovered && !selected && (
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 50%, ${pt.color}10, transparent 70%)` }}
              />
            )}
          </OptionCard>
        );
      })}
    </div>
  );

  const renderStep1 = () => (
    <div className="grid grid-cols-2 gap-3">
      {PORTFOLIO_SIZES.map((ps) => {
        const selected = data.portfolioSize === ps.id;
        return (
          <OptionCard
            key={ps.id}
            selected={selected}
            onClick={() => handlePortfolioSize(ps.id)}
            accentColor="#059669"
            glowClass={selected ? 'shadow-emerald-500/30' : ''}
            className="min-h-[120px] flex flex-col items-center text-center justify-center"
          >
            <div className={`text-4xl font-black tabular-nums leading-none mb-1 transition-colors ${selected ? 'text-emerald-600' : 'text-slate-800'}`}>
              {selected ? ps.arLabel : ps.enLabel}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-1">
              {selected ? ps.arDesc : ps.enDesc}
            </div>
          </OptionCard>
        );
      })}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-2">
      {CHALLENGES.map((ch) => {
        const isSelected = data.mainChallenge === ch.id;
        const severityColors = {
          low: '#059669',
          medium: '#D97757',
          high: '#DC2626',
        };
        return (
          <button
            key={ch.id}
            onClick={() => handleChallenge(ch.id)}
            className={`
              w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300
              ${isSelected
                ? 'border-transparent shadow-lg scale-[1.01]'
                : 'border-white/60 bg-white/70 backdrop-blur-sm hover:bg-white hover:shadow-md'
              }
            `}
            style={isSelected ? {
              background: `${severityColors[ch.severity as keyof typeof severityColors]}12`,
              boxShadow: `0 8px 32px ${severityColors[ch.severity as keyof typeof severityColors]}20`,
            } : {}}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                isSelected ? 'text-white' : 'text-slate-400 bg-white/80'
              }`}
              style={isSelected ? { background: severityColors[ch.severity as keyof typeof severityColors] } : {}}
            >
              <ch.icon className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1 text-start">
              <div className="font-bold text-sm text-slate-800">
                {isSelected ? ch.arLabel : ch.enLabel}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                {isSelected ? ch.arDesc : ch.enDesc}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isSelected && (
                <CheckCircle2 className="w-4 h-4" style={{ color: severityColors[ch.severity as keyof typeof severityColors] }} />
              )}
              {!isSelected && (
                <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${isRtl ? 'rotate-180' : ''}`} />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderStep3 = () => (
    <div className="grid grid-cols-2 gap-3">
      {TEAM_SIZES.map((ts) => {
        const selected = data.teamSize === ts.id;
        return (
          <OptionCard
            key={ts.id}
            selected={selected}
            onClick={() => handleTeamSize(ts.id)}
            accentColor="#7C3AED"
            glowClass={selected ? 'shadow-violet-500/30' : ''}
            className="min-h-[110px] flex flex-col items-center text-center justify-center"
          >
            <div className="text-3xl mb-2">{ts.emoji}</div>
            <div className="font-extrabold text-base text-slate-800">
              {selected ? ts.arLabel : ts.enLabel}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-1">
              {selected ? ts.arDesc : ts.enDesc}
            </div>
          </OptionCard>
        );
      })}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          {tr('Company name', 'اسم الشركة')}
        </label>
        <input
          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757] transition-all placeholder:text-slate-400"
          placeholder={tr('e.g. Al Mansouri Properties', 'مثال: عقارات المنصوري')}
          value={data.companyName}
          onChange={(e) => setData({ companyName: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          {tr('Location / city', 'الموقع / المدينة')}
        </label>
        <input
          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757] transition-all placeholder:text-slate-400"
          placeholder={tr('e.g. Doha, Qatar', 'مثال: الدوحة، قطر')}
          value={data.companyLocation}
          onChange={(e) => setData({ companyLocation: e.target.value })}
        />
      </div>
    </div>
  );

  // ── Step 5: personalised prescription ──────────────────────────────────────
  const renderStep5 = () => {
    const challengeData = CHALLENGES.find(c => c.id === data.mainChallenge);
    const propertyData = PROPERTY_TYPES.find(p => p.id === data.propertyType);
    const portfolioData = PORTFOLIO_SIZES.find(s => s.id === data.portfolioSize);
    const rxItems = getPrescriptions(data.mainChallenge);
    const symptoms = getSymptoms(data.mainChallenge, isRtl);
    const recommendations = getRecommendations(data.mainChallenge, isRtl);

    const priorityColors: Record<string, string> = {
      urgent: 'border-l-rose-500 bg-rose-50/60',
      primary: 'border-l-emerald-500 bg-emerald-50/40',
      secondary: 'border-l-blue-500 bg-blue-50/40',
    };
    const priorityBadge: Record<string, { en: string; ar: string }> = {
      urgent: { en: 'URGENT', ar: 'عاجل' },
      primary: { en: 'PRIMARY', ar: 'أساسي' },
      secondary: { en: 'SECONDARY', ar: 'ثانوي' },
    };

    return (
      <div className="space-y-4">
        {/* Diagnosis Header */}
        <div className="bg-gradient-to-br from-[#132B25] to-[#1A3830] rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D97757]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/15 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <PenTool className="w-4 h-4 text-[#D97757]" />
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#D97757]">
                {tr('Your Property Prescription', 'تشخيص عقارك')}
              </span>
            </div>
            <h3 className="text-lg font-extrabold mb-1">
              {tr('Hello,', 'مرحباُ,')} {data.companyName || 'صاحب العقار'} 👋
            </h3>
            <p className="text-white/70 text-sm font-medium leading-relaxed">
              {tr("Based on what you've shared, here's our diagnosis of your situation:", "بناءً على ما شاركته، إليك تشخيصنا لوضعك:")}
            </p>
          </div>
        </div>

        {/* Diagnosis summary + symptoms */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/60 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-violet-600">
              {tr('Diagnosis', 'التشخيص')}
            </span>
          </div>
          <p className="text-sm text-slate-700 font-medium leading-relaxed">
            {tr(
              `${propertyData?.enLabel || ''} properties · ${portfolioData?.enLabel || ''} units under management · ${challengeData?.enLabel || ''} is your priority`,
              `${propertyData?.arLabel || ''} · ${portfolioData?.arLabel || ''} وحدة تحت الإدارة · ${challengeData?.arLabel || ''} هو أولويتك`
            )}
          </p>

          {/* Symptoms — challenge-specific */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600">
                {tr('Diagnosed Symptoms', 'الأعراض المُشخصة')}
              </span>
            </div>
            <p className="text-xs text-rose-700 font-medium leading-relaxed">{symptoms}</p>
          </div>
        </div>

        {/* Prescribed Solutions — dynamic per challenge */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600">
              {tr('Prescribed Solutions', 'الحلول الموصى بها')}
            </span>
          </div>

          {rxItems.map((rx, i) => {
            const Icon = rx.icon;
            const badge = priorityBadge[rx.priority];
            return (
              <div
                key={i}
                className={`bg-white rounded-xl p-3.5 border border-white/60 border-l-4 shadow-sm ${priorityColors[rx.priority]}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${rx.color}18` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: rx.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-extrabold text-[#132B25] truncate">
                        {isRtl ? rx.ar : rx.en}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 shrink-0">
                        {badge[isRtl ? 'ar' : 'en']}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm font-black text-slate-200 shrink-0">#{String(i + 1).padStart(2, '0')}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Treatment instructions */}
        <div className="bg-emerald-50/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-200">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
              {tr('Treatment Instructions', 'تعليمات العلاج')}
            </span>
          </div>
          <ul className="space-y-1.5">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-emerald-800 font-medium leading-relaxed">
                <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
                {rec}
              </li>
            ))}
          </ul>
        </div>

        {/* Quick stats preview */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: tr('Trial', 'تجربة'), value: '3 days', color: '#059669' },
            { label: tr('Support', 'دعم'), value: '24/7', color: '#2563EB' },
            { label: tr('AI Copilot', 'مساعد ذكي'), value: 'Built-in', color: '#D97757' },
          ].map((item, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-white/60 text-center">
              <div className="text-lg font-black text-slate-800">{item.value}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleStart}
          disabled={isSubmitting}
          className="w-full py-4 bg-gradient-to-r from-[#D97757] to-[#c46748] text-white rounded-2xl font-extrabold text-base hover:from-[#c46748] hover:to-[#b05a3d] active:scale-[0.98] hover:shadow-2xl hover:shadow-[#D97757]/30 hover:-translate-y-0.5 transition-all duration-300 shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {tr('Opening sign-up…', 'جارِ فتح التسجيل…')}
            </span>
          ) : (
            <>
              {tr('Create Account & Start Free Trial', 'أنشئ حسابك وابدأ التجربة المجانية')}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-400 font-semibold">
          {tr('No credit card required · Cancel anytime', 'لا نطلب بطاقة ائتمان · إلغاء في أي وقت')}
        </p>
      </div>
    );
  };

  const STEPS_RENDER = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5];

  return (
    <div dir={mounted ? (isRtl ? 'rtl' : 'ltr') : 'ltr'} className="min-h-screen bg-[#F6F8F6] flex flex-col relative overflow-hidden">
      <AmbientParticles />

      {/* Top bar */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-white/50 px-6 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#132B25] to-[#1A3830] rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-sm font-extrabold">P</span>
          </div>
          <span className="font-extrabold text-[#132B25] text-base">PropertyEase</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5">
            {[0, 1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`rounded-full transition-all duration-500 ${
                  s === step
                    ? 'w-8 h-2 bg-gradient-to-r from-[#D97757] to-[#c46748] shadow-md shadow-[#D97757]/30'
                    : s < step
                      ? 'w-2 h-2 bg-emerald-500'
                      : 'w-2 h-2 bg-slate-200'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="text-xs text-slate-500 hover:text-slate-700 font-bold border border-slate-200 rounded-lg px-2.5 py-1.5 transition-all hover:bg-white"
          >
            {lang === 'en' ? 'العربية' : 'English'}
          </button>
          <div className="w-px h-6 bg-slate-200 hidden sm:block" />
          <button
            onClick={() => router.push('/')}
            aria-label={tr('Exit onboarding', 'الخروج من الإعداد')}
            title={tr('Exit', 'خروج')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm transition-all"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">{tr('Exit', 'خروج')}</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 relative z-10">
        <div className="w-full max-w-lg">
          {/* Step indicator */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#D97757]">
                {t('step', lang)} {step + 1} <span className="text-slate-400">/ 6</span>
              </span>
              {autoAdvance && step < 4 && (
                <span className="text-[10px] text-slate-400 font-semibold">
                  {tr('· tap to choose', '· اضغط للاختيار')}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-[1.75rem] font-extrabold text-[#132B25] leading-tight">
              {isRtl ? STEP_TITLES_AR[step] : STEP_TITLES_EN[step]}
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-semibold">
              {isRtl ? STEP_HINTS_AR[step] : STEP_HINTS_EN[step]}
            </p>
          </div>

          {/* Step content */}
          <div className="animate-slide-up min-h-[200px]">
            {STEPS_RENDER[step]()}
          </div>

          {/* ── Navigation ── */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => { if (step > 0) setStep(step - 1); }}
              disabled={step === 0}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                step === 0
                  ? 'opacity-0 pointer-events-none'
                  : 'text-slate-500 hover:bg-white hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              {t('previous', lang)}
            </button>

            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-all"
            >
              <Home className="w-3.5 h-3.5" />
              {t('home', lang)}
            </button>
          </div>

          {/* Continue / Next button for non-auto steps */}
          {!autoAdvance && (
            <div className="mt-4 flex justify-end">
              {step === 5 ? (
                <button
                  onClick={handleStart}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 bg-[#132B25] text-white rounded-xl text-sm font-bold hover:bg-[#1A3831] active:scale-[0.98] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-[#132B25]/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {tr('Opening…', 'جارِ الفتح…')}
                    </span>
                  ) : (
                    <>
                      {t('finish', lang)}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (step === 4 && !data.companyName.trim()) return;
                    nextStep();
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-[#132B25] text-white rounded-xl text-sm font-bold hover:bg-[#1A3831] active:scale-[0.98] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-[#132B25]/20"
                >
                  {t('continue', lang)}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Progress bar */}
          <div className="mt-8">
            <div className="h-1 bg-slate-200/60 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#D97757] to-[#c46748] transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
