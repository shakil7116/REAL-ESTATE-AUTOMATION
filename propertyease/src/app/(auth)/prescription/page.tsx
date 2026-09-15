'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain, Stethoscope, Sparkles, Wrench, TrendingUp, Users,
  DollarSign, ShieldCheck, ArrowRight, ArrowLeft, ChevronRight,
  CheckCircle2, AlertCircle, Activity, Target, Building2,
} from 'lucide-react';

interface OnboardingData {
  propertyType: string;
  portfolioSize: string;
  mainChallenge: string;
  teamSize: string;
  companyName: string;
  companyLocation: string;
}

const PROPERTY_TYPES = {
  residential: { en: 'Residential', ar: 'سكني', color: '#059669' },
  commercial: { en: 'Commercial', ar: 'تجاري', color: '#2563EB' },
  mixed: { en: 'Mixed-Use', ar: 'مختلط الاستخدام', color: '#7C3AED' },
  hospitality: { en: 'Hospitality', ar: 'ضيافة وفنادق', color: '#D97757' },
};

const PORTFOLIO_SIZES = {
  '1-10': { en: '1–10 properties', ar: '١ – ١٠ عقارات' },
  '11-50': { en: '11–50 properties', ar: '١١ – ٥٠ عقاراً' },
  '51-200': { en: '51–200 properties', ar: '٥١ – ٢٠٠ عقار' },
  '200+': { en: '200+ properties', ar: '٢٠٠+ عقار' },
};

const CHALLENGES = {
  'rent-collection': { en: 'Rent Collection', ar: 'تحصيل الإيجارات', severity: 'high' },
  'maintenance': { en: 'Maintenance', ar: 'الصيانة', severity: 'high' },
  'tenant-communication': { en: 'Tenant Communication', ar: 'تواصل المستأجرين', severity: 'medium' },
  'marketing': { en: 'Marketing & Vacancies', ar: 'التسويق والشواغر', severity: 'high' },
  'reporting': { en: 'Reporting', ar: 'التقارير', severity: 'low' },
  'multi-property': { en: 'Multi-Property', ar: 'إدارة متعددة', severity: 'medium' },
};

const TEAM_SIZES = {
  solo: { en: 'Just me', ar: 'أنا وحدي' },
  '2-5': { en: '2–5 people', ar: '٢ – ٥ أشخاص' },
  '6-20': { en: '6–20 people', ar: '٦ – ٢٠ شخصاُ' },
  '20+': { en: '20+ people', ar: '٢٠+ شخصاُ' },
};

export default function PrescriptionPage() {
  const router = useRouter();
  const [data, setData] = useState<OnboardingData | null>(null);
  const [lang, setLang] = useState<'en' | 'ar'>('ar');
  const [isRtl] = useState(lang === 'ar');
  const [mounted, setMounted] = useState(false);

  const tr = (en: string, ar: string) => isRtl ? ar : en;

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('propertyease_onboarding') ||
      sessionStorage.getItem('propertyease_onboarding');
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch { /* ignore */ }
    }
  }, []);

  const handleContinue = () => {
    router.push('/signup');
  };

  const handleSkip = () => {
    const trialEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    sessionStorage.setItem('propertyease_trial_active', 'true');
    sessionStorage.setItem('propertyease_trial_end', trialEnd);
    router.push('/dashboard');
  };

  // Generate prescription based on onboarding data
  const generatePrescription = () => {
    if (!data) return null;

    const propertyInfo = PROPERTY_TYPES[data.propertyType as keyof typeof PROPERTY_TYPES];
    const challengeInfo = CHALLENGES[data.mainChallenge as keyof typeof CHALLENGES];
    const portfolioInfo = PORTFOLIO_SIZES[data.portfolioSize as keyof typeof PORTFOLIO_SIZES];
    const teamInfo = TEAM_SIZES[data.teamSize as keyof typeof TEAM_SIZES];

    // Build dynamic prescriptions based on challenge
    const prescriptions = getPrescriptions(data.mainChallenge, data.propertyType);

    return {
      patientName: data.companyName || tr('صاحب العقار', 'Property Owner'),
      diagnosis: tr('Property Analysis', 'تحليل العقارات'),
      symptoms: tr(getSymptoms(data.mainChallenge), ''),
      prescriptions,
      stats: {
        portfolioSize: portfolioInfo?.[isRtl ? 'ar' : 'en'] || '—',
        propertyType: propertyInfo?.[isRtl ? 'ar' : 'en'] || '—',
        mainChallenge: challengeInfo?.[isRtl ? 'ar' : 'en'] || '—',
        teamSize: teamInfo?.[isRtl ? 'ar' : 'en'] || '—',
      },
      recommendations: getRecommendations(data.mainChallenge, data.propertyType),
    };
  };

  const getPrescriptions = (challenge: string, propertyType: string) => {
    const base = [
      {
        icon: Sparkles,
        color: '#059669',
        titleEn: 'AI Tenant Support Bot',
        titleAr: 'شات بوت دعم المستأجرين بالذكاء الاصطناعي',
        descEn: '24/7 automated responses to tenant inquiries, maintenance requests, and lease questions.',
        descAr: 'ردود تلقائية على مدار الساعة لاستفسارات المستأجرين وطلبات الصيانة وأسئلة العقود.',
        priority: 'primary',
      },
      {
        icon: DollarSign,
        color: '#2563EB',
        titleEn: 'Smart Rent Collection System',
        titleAr: 'نظام تحصيل إيجارات ذكي',
        descEn: 'Automated payment reminders, PDC tracking, and cash flow reporting.',
        descAr: 'تذكيرات دفع تلقائية، تتبع شيكات ما قبل التاريخ، وتقارير التدفق النقدي.',
        priority: 'primary',
      },
      {
        icon: TrendingUp,
        color: '#D97757',
        titleEn: 'Marketing Automation',
        titleAr: 'أتمتة التسويق',
        descEn: 'Multi-platform campaign management across Meta, Google, Bayut & Property Finder.',
        descAr: 'إدارة حملات متعددة المنصات عبر ميتا وجوجل وبايوت وبروبتي فايندر.',
        priority: 'secondary',
      },
      {
        icon: Wrench,
        color: '#7C3AED',
        titleEn: 'Maintenance Dispatch System',
        titleAr: 'نظام إرسال الصيانة',
        descEn: 'Auto-assign repair tickets to verified contractors with real-time tracking.',
        descAr: 'تعيين تلقائي لورقات الإصلاح لمقاولين معتمدين مع تتبع مباشر.',
        priority: 'secondary',
      },
    ];

    // Add challenge-specific prescriptions
    const challengePrescriptions: Record<string, typeof base> = {
      'rent-collection': [
        {
          icon: DollarSign,
          color: '#DC2626',
          titleEn: 'PDC Tracking Dashboard',
          titleAr: 'لوحة تتبع الشيكات',
          descEn: 'Visual dashboard for post-dated cheque management with expiry alerts.',
          descAr: 'لوحة بصرية لإدارة شيكات ما بعد الاستحقاق مع تنبيهات انتهاء الصلاحية.',
          priority: 'urgent',
        },
        ...base.slice(0, 3),
      ],
      'maintenance': [
        {
          icon: Wrench,
          color: '#DC2626',
          titleEn: 'Emergency Response Protocol',
          titleAr: 'بروتوكول الاستجابة للطوارئ',
          descEn: 'Priority routing for urgent maintenance with SLA tracking.',
          descAr: 'توجيه أولوي للاستجابات الطارئة مع تتبع SLA.',
          priority: 'urgent',
        },
        ...base.slice(0, 3),
      ],
      'marketing': [
        {
          icon: Target,
          color: '#DC2626',
          titleEn: 'Vacancy Reduction Campaign',
          titleAr: 'حملة تقليل الشواغر',
          descEn: 'Automated listing optimization and lead scoring system.',
          descAr: 'تحسين Listings تلقائي ونظام تسجيل العملاء المحتملين.',
          priority: 'urgent',
        },
        ...base.slice(0, 3),
      ],
      'tenant-communication': [
        {
          icon: Users,
          color: '#DC2626',
          titleEn: 'Tenant Portal Upgrade',
          titleAr: 'ترقية بوابة المستأجرين',
          descEn: 'Self-service portal for payments, requests, and communication.',
          descAr: 'بوابةself-service للمدفوعات والطلبات والاتصالات.',
          priority: 'urgent',
        },
        ...base.slice(0, 3),
      ],
      'reporting': [
        {
          icon: Activity,
          color: '#DC2626',
          titleEn: 'Revenue Analytics Suite',
          titleAr: 'مجموعة تحليلات الإيرادات',
          descEn: 'Advanced dashboards with occupancy, yield, and expense insights.',
          descAr: 'لوحات تحكم متقدمة مع رؤى حول الإشغال والعوائد والمصاريف.',
          priority: 'urgent',
        },
        ...base.slice(0, 3),
      ],
      'multi-property': [
        {
          icon: Building2,
          color: '#DC2626',
          titleEn: 'Multi-Site Management Hub',
          titleAr: 'مركز إدارة متعدد المواقع',
          descEn: 'Consolidated view across all properties with comparative analytics.',
          descAr: 'عرض موحد عبر جميع العقارات مع تحليلات مقارنة.',
          priority: 'urgent',
        },
        ...base.slice(0, 3),
      ],
    };

    return challengePrescriptions[challenge] || base;
  };

  const getSymptoms = (challenge: string) => {
    const symptoms: Record<string, string> = {
      'rent-collection': tr(
        'تأخر في تحصيل الإيجارات، صعوبة في تتبع الشيكات، نقص في الرؤية المالية.',
        'Late rent collection, difficulty tracking cheques, lack of financial visibility.'
      ),
      'maintenance': tr(
        'استجابات بطيئة للصيانة، فوضى في إدارة المقاولين، تكاليف غير متوقعة.',
        'Slow maintenance responses, contractor chaos, unexpected costs.'
      ),
      'tenant-communication': tr(
        'إرهاق من طلبات الدعم المتكررة، عدم رضوان المستأجرين، شكاوى غير معالجة.',
        'Overwhelmed by repetitive support requests, tenant dissatisfaction, unresolved complaints.'
      ),
      'marketing': tr(
        'وحدات شاغرة لفترة طويلة، تكلفة جذب عملاء مرتفعة، تحويل منخفض.',
        'Units vacant for extended periods, high customer acquisition cost, low conversion.'
      ),
      'reporting': tr(
        'عدم وضوح الرؤية المالية، صعوبة في اتخاذ القرارات، تقارير يدوية.',
        'Lack of financial clarity, difficulty making decisions, manual reporting.'
      ),
      'multi-property': tr(
        'صعوبة في التنسيق بين المواقع، معلومات متفرقة، قرارات غير مبنية على بيانات.',
        'Difficulty coordinating across sites, fragmented information, unstructured decision-making.'
      ),
    };
    return symptoms[challenge] || tr('تحليل شامل للمحفظة العقارية', 'Comprehensive portfolio analysis');
  };

  const getRecommendations = (challenge: string, propertyType: string) => {
    const recs: Record<string, string[]> = {
      'rent-collection': [
        tr('تفعيل نظام تذكير الدفع التلقائي', 'Activate automatic payment reminder system'),
        tr('ربط حساب بنكي لتحديث المدفوعات فورياً', 'Connect bank account for instant payment updates'),
        tr('إعداد تقرير التدفق النقدي الأسبوعي', 'Set up weekly cash flow report'),
      ],
      'maintenance': [
        tr('إنشاء قاعدة بيانات مقاولين معتمدين', 'Create database of certified contractors'),
        tr('تفعيل نظام التذاكر الذكية', 'Enable smart ticketing system'),
        tr('إعداد SLA للأولويات المختلفة', 'Set up SLAs for different priorities'),
      ],
      'marketing': [
        tr('تفعيل حملات متعددة المنصات', 'Activate multi-platform campaigns'),
        tr('إعداد لوحة تحكم Lead scoring', 'Set up Lead scoring dashboard'),
        tr('تحسين Listing تلقائياً', 'Auto-optimize listings'),
      ],
    };
    return recs[challenge] || [
      tr('ابدأ بإضافة عقاراتك الأولى', 'Start by adding your first properties'),
      tr('تخصيص لوحة التحكم', 'Customize your dashboard'),
      tr('دعوة فريق العمل', 'Invite your team'),
    ];
  };

  const prescription = generatePrescription();

  if (!mounted || !data) {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[#F6F8F6] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#D97757]/30 border-t-[#D97757] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">{tr('جارِ تحضير تشخيصك...', 'Preparing your diagnosis...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[#F6F8F6] relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D97757]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-white/50 px-6 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#132B25] to-[#1A3830] rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-sm font-extrabold">P</span>
          </div>
          <span className="font-extrabold text-[#132B25] text-base">PropertyEase</span>
        </div>
        <button
          onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
          className="text-xs text-slate-500 hover:text-slate-700 font-bold border border-slate-200 rounded-lg px-2.5 py-1.5 transition-all hover:bg-white"
        >
          {lang === 'en' ? 'العربية' : 'English'}
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10 space-y-6">
        {/* Doctor header card */}
        <div className="bg-gradient-to-br from-[#132B25] to-[#1A3830] rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#D97757]/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                <Stethoscope className="w-6 h-6 text-[#D97757]" />
              </div>
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#D97757]">
                  {tr('Property Diagnosis', 'تشخيص العقار')}
                </div>
                <div className="text-xs text-white/60 font-medium">
                  {tr('AI-Powered Analysis Report', 'تقرير تحليل مدعوم بالذكاء الاصطناعي')}
                </div>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
              {tr('مرحباً', 'Hello')}, {data.companyName || 'صاحب العقار'} 👋
            </h1>
            <p className="text-white/70 text-sm font-medium leading-relaxed">
              {tr(
                'Based on the information you shared, we have analyzed your property situation and prepared a customized plan for you.',
                'بناءً على المعلومات التي شاركتها معنا، قمنا بتحليل وضع عقاراتك وتقديم خطة مخصصة لك.'
              )}
            </p>
          </div>
        </div>

        {/* Patient info */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/60 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-violet-600">
              {tr('بيانات المريض', 'Patient Data')}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: tr('Property Type', 'نوع العقار'), value: PROPERTY_TYPES[data.propertyType as keyof typeof PROPERTY_TYPES]?.[isRtl ? 'ar' : 'en'] || '—' },
              { label: tr('Properties Managed', 'العقارات المُدارة'), value: PORTFOLIO_SIZES[data.portfolioSize as keyof typeof PORTFOLIO_SIZES]?.[isRtl ? 'ar' : 'en'] || '—' },
              { label: tr('Main Challenge', 'التحدي الرئيسي'), value: CHALLENGES[data.mainChallenge as keyof typeof CHALLENGES]?.[isRtl ? 'ar' : 'en'] || '—' },
              { label: tr('Team Size', 'حجم الفريق'), value: TEAM_SIZES[data.teamSize as keyof typeof TEAM_SIZES]?.[isRtl ? 'ar' : 'en'] || '—' },
              { label: tr('Company', 'الشركة'), value: data.companyName || '—' },
              { label: tr('Location', 'الموقع'), value: data.companyLocation || '—' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-xs text-slate-500 font-semibold">{item.label}</span>
                <span className="font-extrabold text-[#132B25]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Symptoms */}
        <div className="bg-rose-50/80 backdrop-blur-sm rounded-2xl p-5 border border-rose-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600">
              {tr('الأعراض المُشخصة', 'Diagnosed Symptoms')}
            </span>
          </div>
          <p className="text-sm text-rose-800 font-medium leading-relaxed">
            {prescription?.symptoms}
          </p>
        </div>

        {/* Prescriptions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600">
              {tr('الوصفات الطبية الموصى بها', 'Recommended Prescriptions')}
            </span>
          </div>

          {prescription?.prescriptions.map((rx, i) => {
            const Icon = rx.icon;
            const priorityColors = {
              urgent: 'border-l-rose-500 bg-rose-50/50',
              primary: 'border-l-emerald-500 bg-emerald-50/30',
              secondary: 'border-l-blue-500 bg-blue-50/30',
            };
            const priorityBadges = {
              urgent: tr('عاجل', 'URGENT'),
              primary: tr('أساسي', 'PRIMARY'),
              secondary: tr('ثانوي', 'SECONDARY'),
            };
            return (
              <div
                key={i}
                className={`bg-white rounded-2xl p-5 border border-white/60 border-l-4 shadow-sm ${priorityColors[rx.priority as keyof typeof priorityColors]}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${rx.color}18` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: rx.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-extrabold text-[#132B25]">
                        {isRtl ? rx.titleAr : rx.titleEn}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                        {priorityBadges[rx.priority as keyof typeof priorityBadges]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {isRtl ? rx.descAr : rx.descEn}
                    </p>
                  </div>
                  <div className="text-2xl font-black text-slate-200">#{String(i + 1).padStart(2, '0')}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recommendations */}
        <div className="bg-emerald-50/80 backdrop-blur-sm rounded-2xl p-5 border border-emerald-200">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
              {tr('تعليمات العلاج', 'Treatment Instructions')}
            </span>
          </div>
          <ul className="space-y-2">
            {prescription?.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-emerald-800 font-medium">
                <ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                {rec}
              </li>
            ))}
          </ul>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 pt-4">
          <button
            onClick={handleContinue}
            className="w-full py-4 bg-gradient-to-r from-[#D97757] to-[#c46748] text-white rounded-2xl font-extrabold text-base hover:from-[#c46748] hover:to-[#b05a3d] active:scale-[0.98] hover:shadow-2xl hover:shadow-[#D97757]/30 hover:-translate-y-0.5 transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
          >
            {tr('أنشئ حسابك وابدأ العلاج', 'Create Account & Start Treatment')}
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={handleSkip}
            className="w-full py-3 bg-white text-slate-600 rounded-xl font-bold text-sm border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
          >
            {tr('تخطي — الدخول المباشر للوحة التحكم', 'Skip — Direct to Dashboard')}
          </button>

          <p className="text-center text-xs text-slate-400 font-semibold">
            {tr('تجربة مجانية 3 أيام · بدون بطاقة ائتمان', '3-day free trial · No credit card required')}
          </p>
        </div>

        {/* Back to onboarding */}
        <div className="text-center">
          <Link
            href="/onboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {tr('الرجوع للتشخيص', 'Back to Diagnosis')}
          </Link>
        </div>
      </div>
    </div>
  );
}
