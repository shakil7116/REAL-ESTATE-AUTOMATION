'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useMounted } from '@/lib/useClientTime';
import {
  Building2, Home, Warehouse, Store, CheckCircle2, Sparkles,
  ArrowRight, Star, ShieldCheck, Zap, TrendingUp,
  Menu, X, Globe, ArrowUpRight, Play,
  Wrench, FileText, Target, BarChart3,
  Clock, User, ChevronRight,
} from 'lucide-react';

// ── Hero slideshow images (from DESIGN_PROMPT.md spec) ──
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80',
  'https://images.unsplash.com/photo-1600566753190-1750c98d5d74?w=1920&q=80',
  'https://images.unsplash.com/photo-1600047509807-b6439dcc55a9?w=1920&q=80',
  'https://images.unsplash.com/photo-1600573472550-8090b5e0743e?w=1920&q=80',
];

// ── Property type showcase images ──
const PROPERTY_TYPE_IMAGES: Record<'residential'|'commercial'|'mixed'|'hospitality', string> = {
  residential: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
  commercial:  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  mixed:       'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
  hospitality: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
};

// ── Full feature set (6 cards as per DESIGN_PROMPT.md) ──
const FEATURES = [
  {
    icon: Sparkles,
    title_en: 'AI Tenant Support',
    title_ar: 'دعم المستأجرين بالذكاء الاصطناعي',
    desc_en: 'Automated chatbot handles tenant inquiries 24/7 — rent reminders, maintenance requests, and lease questions answered instantly.',
    desc_ar: 'شات بوت تلقائي يتعامل مع استفسارات المستأجرين على مدار الساعة — تذكيرات بالإيجار وطلبات الصيانة.',
  },
  {
    icon: Target,
    title_en: 'Smart Marketing',
    title_ar: 'تسويق ذكي',
    desc_en: 'Auto-generate listing descriptions, ads for Meta & Google, and post to Bayut & Property Finder with one click.',
    desc_ar: 'إنشاء أوصاف إعلانية تلقائياً وإعلانات لـ Meta وGoogle ونشرها على عقار وبيوتات بنقرة واحدة.',
  },
  {
    icon: ShieldCheck,
    title_en: 'PDC Check Tracking',
    title_ar: 'تتبع شيكات PDC',
    desc_en: 'Never miss a bouncing cheque. Auto-reminders, escalation workflows, and PDC calendar built right in.',
    desc_ar: 'لا تفوّت شيكاً مرتداً. تذكيرات تلقائية وسير عمل تصاعدي وتقويم PDC مدمج.',
  },
  {
    icon: Wrench,
    title_en: 'Maintenance Dispatch',
    title_ar: 'إرسال الصيانة',
    desc_en: 'Auto-assign contractors based on location, availability, and past performance. Track every ticket to resolution.',
    desc_ar: 'تعيين مقاولين تلقائياً بناءً على الموقع والتوفر والأداء السابق. تتبع كل تذكرة حتى الحل.',
  },
  {
    icon: BarChart3,
    title_en: 'Multi-Property Dashboard',
    title_ar: 'لوحة تحكم متعددة العقارات',
    desc_en: 'See every property, every unit, every payment at a glance. Filter by location, type, or manager.',
    desc_ar: 'شاهد كل عقار وكل وحدة وكل دفعة بنظرة واحدة. تصفية حسب الموقع أو النوع أو المدير.',
  },
  {
    icon: Zap,
    title_en: 'Mobile App',
    title_ar: 'تطبيق الجوال',
    desc_en: 'Manage your properties from anywhere. Receive instant notifications for payments, tickets, and expiring leases.',
    desc_ar: 'أدِر عقاراتك من أي مكان. تلقِّ إشعارات فورية للمدفوعات والتذاكر والعقود المنتهية.',
  },
];

// ── Pricing plans ──
const PRICING_PLANS = [
  {
    id: 'starter',
    name_en: 'Starter',
    name_ar: 'المبتدئ',
    price: 'Free',
    popular: false,
    features_en: [
      'Up to 10 units',
      'Basic maintenance tracking',
      '1 team member',
      'Email support',
    ],
    features_ar: [
      'حتى 10 وحدات',
      'تتبع الصيانة الأساسي',
      'عضو واحد في الفريق',
      'دعم عبر البريد',
    ],
  },
  {
    id: 'growth',
    name_en: 'Growth',
    name_ar: 'النمو',
    price: '299',
    popular: true,
    badge_en: 'Most Popular',
    badge_ar: 'الأكثر شعبية',
    features_en: [
      'Up to 50 units',
      'AI tenant chatbot',
      'Marketing campaign tools',
      '5 team members',
      'Priority support',
    ],
    features_ar: [
      'حتى 50 وحدة',
      'شات بوت ذكي للمستأجرين',
      'أدوات حملات التسويق',
      '5 أعضاء في الفريق',
      'دعم أولوي',
    ],
  },
  {
    id: 'enterprise',
    name_en: 'Enterprise',
    name_ar: 'المؤسسات',
    price: '799',
    popular: false,
    features_en: [
      'Unlimited units',
      'Full AI Copilot',
      'Advanced analytics & reports',
      'Unlimited team members',
      'Dedicated account manager',
      'Custom integrations',
    ],
    features_ar: [
      'وحدات غير محدودة',
      'مساعد ذكي كامل',
      'تحليلات وتقارير متقدمة',
      'أعضاء فريق غير محدودين',
      'مدير حساب مخصص',
      'تكاملات مخصصة',
    ],
  },
];

// ── Testimonials ──
const TESTIMONIALS = [
  {
    name_en: 'Noura Al Mansouri',
    name_ar: 'نورة المنصوري',
    role_en: 'Property Manager, Doha',
    role_ar: 'مدير عقارات، الدوحة',
    quote_en: '"PropertyEase cut our rent collection time by 60%. The AI chatbot handles 80% of tenant queries before they even reach us. Game changer."',
    quote_ar: '"بروبرتي إييز قلل وقت تحصيل الإيجار بنسبة 60%. الشات بوت يتعامل مع 80% من استفسارات المستأجرين قبل وصولنا. تغيير حقيقي."',
    rating: 5,
    avatar: 'NM',
  },
  {
    name_en: 'Ahmed Rashid',
    name_ar: 'أحمد راشد',
    role_en: 'Property Owner, Doha',
    role_ar: 'مالك عقارات، الدوحة',
    quote_en: '"Managing 120+ units across 3 properties was chaotic before. Now everything is in one dashboard. Highly recommended."',
    quote_ar: '"إدارة 120+ وحدة عبر 3 عقارات كانت فوضوية سابقاُ. الآن كل شيء في لوحة تحكم واحدة. أنصح به بشدة."',
    rating: 5,
    avatar: 'AR',
  },
  {
    name_en: 'Sarah Chen',
    name_ar: 'سارة تشين',
    role_en: 'Real Estate Agent, Qatar',
    role_ar: 'وكيلة عقارات، قطر',
    quote_en: '"The marketing tools helped us fill 15 units in just 2 weeks. The lead tracking and ROI reporting are incredibly valuable."',
    quote_ar: '"ساعدتنا أدوات التسويق في شغل 15 وحدة خلال أسبوعين فقط. تتبع العملاء وتقارير العائد لا تقدر بثمن."',
    rating: 5,
    avatar: 'SC',
  },
];

// ── How-it-works steps ──
const HOW_IT_WORKS = [
  {
    step: '01',
    title_en: 'Answer a Few Questions',
    title_ar: 'أجب عن بضع أسئلة',
    desc_en: 'Tell us about your properties. We personalize your dashboard automatically.',
    desc_ar: 'أخبرنا عن عقاراتك. نقوم بتخصيص لوحة التحكم لك تلقائياً.',
  },
  {
    step: '02',
    title_en: 'Start Your Free Trial',
    title_ar: 'ابدأ تجربتك المجانية',
    desc_en: '3 full days, no credit card. Explore every feature risk-free.',
    desc_ar: '3 أيام كاملة بدون بطاقة ائتمان. استكشف كل الميزات بدون مخاطر.',
  },
  {
    step: '03',
    title_en: 'Manage Everything',
    title_ar: 'أدر كل شيء',
    desc_en: 'Rent collection, maintenance, tenants, marketing — all in one place.',
    desc_ar: 'تحصيل الإيجار والصيانة والمستأجرين والتسويق — كل شيء في مكان واحد.',
  },
];

export default function HomePage() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const isRtl = lang === 'ar';

  // Auto-advance hero slideshow every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % HERO_IMAGES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const isHeroLoaded = currentSlide !== undefined;

  // Locale translator — closure captures `isRtl` so callers only pass en/ar strings
  const tr = (en: string, ar: string) => isRtl ? ar : en;

  // Year can differ between server UTC and client local near Dec 31/Jan 1.
  // Render a stable value on SSR, then update after mount.
  const mounted = useMounted();
  const yearText = mounted
    ? tr(`© ${new Date().getFullYear()} PropertyEase. All rights reserved.`, `© ${new Date().getFullYear()} بروبرتية إييز. جميع الحقوق محفوظة.`)
    : tr('© PropertyEase. All rights reserved.', '© بروبرتية إييز. جميع الحقوق محفوظة.');

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-white text-slate-900 font-jakarta">
      {/* ════════════════════════════════════════════
          1. NAVIGATION BAR
      ═════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#132B25] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl font-extrabold">P</span>
            </div>
            <span className="text-xl font-extrabold text-[#132B25]">PropertyEase</span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { id: 'features', en: 'Features', ar: 'المميزات' },
              { id: 'pricing', en: 'Pricing', ar: 'الأسعار' },
              { id: 'how-it-works', en: 'How It Works', ar: 'كيف يعمل' },
              { id: 'testimonials', en: 'Testimonials', ar: 'آراء العملاء' },
            ].map(link => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-sm font-semibold text-slate-600 hover:text-coral transition-colors"
              >
                {tr(link.en, link.ar)}
              </button>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="text-xs font-bold text-slate-500 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
            >
              {lang === 'en' ? 'عربي' : 'EN'}
            </button>
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-[#132B25] hover:text-[#c46040] transition-colors"
            >
              {tr('Sign In', 'تسجيل الدخول')}
            </Link>
            <button
              onClick={() => { window.location.href = '/onboard'; }}
              className="px-5 py-2.5 bg-coral text-white text-sm font-bold rounded-xl hover:bg-[#c66546] transition-all shadow-md"
            >
              {tr('Start Free Trial', 'ابدأ تجربة مجانية')}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 space-y-3 shadow-lg">
            {[
              { id: 'features', en: 'Features', ar: 'المميزات' },
              { id: 'pricing', en: 'Pricing', ar: 'الأسعار' },
              { id: 'how-it-works', en: 'How It Works', ar: 'كيف يعمل' },
              { id: 'testimonials', en: 'Testimonials', ar: 'آراء العملاء' },
            ].map(link => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="block w-full text-left text-sm font-semibold text-slate-600 py-2"
              >
                {tr(link.en, link.ar)}
              </button>
            ))}
            <Link
              href="/login"
              className="block text-center py-3 bg-[#132B25] text-white rounded-xl font-bold text-sm"
            >
              {tr('Sign In', 'تسجيل الدخول')}
            </Link>
          </div>
        )}
      </nav>

      {/* ════════════════════════════════════════════
          2. HERO SECTION — Crossfade Slideshow
      ═════════════════════════════════════════════ */}
      <section className="relative pt-20 min-h-screen flex items-center overflow-hidden">
        {/* Slideshow background */}
        <div className="absolute inset-0">
          {HERO_IMAGES.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`Hero property ${i + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ${
                i === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          ))}
          {/* Gradient overlay: dark green from bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#132B25]/95 via-[#132B25]/60 to-[#132B25]/30" />
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left content */}
          <div className="text-white">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D97757] text-white border-transparent rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              {tr('Now with AI Copilot ✨', 'الآن مع مساعد الذكاء الاصطناعي ✨')}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight mb-6">
              {isRtl
                ? <><span>أدر كل عقارك</span><br /><span className="text-coral">بدون عناء</span></>
                : <><span>Manage Every Property</span><br /><span className="text-coral">Effortlessly</span></>
              }
            </h1>

            <p className="text-base sm:text-lg text-slate-200 leading-relaxed mb-8 max-w-lg">
              {tr(
                'From rent collection to maintenance, marketing to tenant communication. PropertyEase is the all-in-one platform built for modern property managers in Qatar and beyond.',
                'من تحصيل الإيجار إلى الصيانة، والتسويق إلى التواصل مع المستأجرين. بروبرتية إييز هي المنصة الشاملة المصممة لمديري العقارات الحديثين في قطر وخارجها.'
              )}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => { window.location.href = '/onboard'; }}
                className="px-8 py-4 bg-coral text-white font-extrabold rounded-2xl hover:bg-[#c66546] transition-all shadow-2xl hover:-translate-y-0.5 flex items-center gap-2 text-base"
              >
                {tr('Start Your Free 3-Day Trial', 'ابدأ تجربتك المجانية 3 أيام')}
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="px-8 py-4 bg-white/10 backdrop-blur-md text-white font-bold rounded-2xl border border-white/30 hover:bg-white/20 transition-all flex items-center gap-2 text-base"
              >
                <Play className="w-5 h-5" />
                {tr('Watch Demo', 'شاهد العرض')}
              </button>
            </div>

            {/* Trust strip */}
            <div className="flex items-center gap-4 mt-10 flex-wrap">
              <div className="flex -space-x-3">
                {['A', 'M', 'K', 'S'].map((letter, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-xs font-bold text-white backdrop-blur-sm"
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className="w-4 h-4 fill-[#D97757] text-[#D97757]" />
                ))}
              </div>
              <p className="text-sm text-slate-300 font-semibold">
                {tr('Trusted by 500+ property managers in Qatar', 'موثوق به من قبل 500+ مدير عقارات في قطر')}
              </p>
            </div>
          </div>

          {/* Right side — floating dashboard preview card */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Main card */}
              <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md ml-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Properties Overview</div>
                    <div className="text-lg font-extrabold text-slate-900">Good Morning, User</div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#132B25] flex items-center justify-center text-white text-sm font-bold">N</div>
                </div>

                {/* 3 stat mini-cards */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: 'Occupancy', value: '93%', color: 'text-emerald-600', sub: '↑ 2.1%' },
                    { label: 'Rent Collected', value: 'QAR 8.8M', color: 'text-[#132B25]', sub: 'this month' },
                    { label: 'Active Tenants', value: '147', color: 'text-coral', sub: 'across 4 props' },
                  ].map((s, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
                      <div className={`text-sm font-extrabold ${s.color}`}>{s.value}</div>
                      <div className="text-[10px] text-slate-500 font-semibold mt-0.5">{s.label}</div>
                      <div className="text-[9px] text-slate-400">{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Mini property card — Al Mansura A-101 (Qatar seed entity) */}
                <div className="bg-[#132B25] rounded-2xl p-4 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <Home className="w-5 h-5 text-coral" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm">Al Mansura A-101</div>
                      <div className="text-xs text-slate-300">2BR · QAR 78,000/year</div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-slate-300">Lease expires: Jan 2026</span>
                    <span className="text-coral font-bold">Renew soon →</span>
                  </div>
                </div>
              </div>

              {/* Floating notification cards */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-3 shadow-xl border border-slate-100 animate-float">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-700">{tr('Rent collected!', 'تم تحصيل الإيجار!')}</span>
                </div>
                <div className="text-sm font-extrabold text-emerald-600 mt-1">QAR 13,500</div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-3 shadow-xl border border-slate-100 animate-float-delayed">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-coral" />
                  <span className="text-xs font-bold text-slate-700">{tr('New lease signed', 'عقد جديد مٌوقّع')}</span>
                </div>
                <div className="text-sm font-extrabold text-slate-900 mt-1">Marina Tower P-1402</div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentSlide ? 'w-8 bg-coral' : 'w-1.5 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          3. STATS BAR — dark green full-width
      ═════════════════════════════════════════════ */}
      <section className="py-14 bg-[#132B25]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { value: '500+', label_en: 'Properties Managed', label_ar: 'عقار مُدار' },
            { value: '12K+', label_en: 'Units Tracked', label_ar: 'وحدة مُتتبعَة' },
            { value: 'QAR 7.3M+', label_en: 'Rent Collected Monthly', label_ar: 'إيجار مُحصل شهرياُ' },
            { value: '93%', label_en: 'Avg Occupancy Rate', label_ar: 'متوسط معدل الإشغال' },
          ].map((stat, i) => (
            <div key={i} className="text-center relative">
              {i < 3 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-12 bg-[#D97757]/40 lg:block hidden" />
              )}
              <div className="text-3xl lg:text-4xl font-extrabold text-coral mb-1">{stat.value}</div>
              <div className="text-sm text-slate-300 font-semibold">
                {tr(stat.label_en, stat.label_ar)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          4. HOW IT WORKS — 3 Steps
      ═════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 px-6 bg-workspace">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#132B25] mb-4">
              {tr('Get Started in 3 Minutes', 'ابدأ في 3 دقائق')}
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              {tr('No setup fees. No contracts. Just sign up and start managing.', 'بدون رسوم إعداد. بدون عقود. سجل وابدأ الإدارة فوراً.')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-8 relative border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Large coral watermark number */}
                <div className="absolute top-4 end-4 text-7xl font-black text-slate-50 select-none leading-none">
                  {item.step}
                </div>
                <div className="relative">
                  <div className="w-12 h-12 bg-coral/10 rounded-xl flex items-center justify-center mb-5">
                    <span className="text-coral font-extrabold text-lg">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-[#132B25] mb-3">
                    {tr(item.title_en, item.title_ar)}
                  </h3>
                  <p className="text-slate-500 leading-relaxed">
                    {tr(item.desc_en, item.desc_ar)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          5. FEATURES GRID — 2×3 layout
      ═════════════════════════════════════════════ */}
      <section id="features" className="py-24 px-6 bg-white relative overflow-hidden">
        {/* Decorative background blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-coral/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#132B25]/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />
        {/* Subtle dot grid pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, #132B25 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#132B25] mb-4">
              {tr('Everything You Need to Manage Your Properties', 'كل ما تحتاجه لإدارة عقاراتك')}
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              {tr('Powerful tools designed for property managers in Qatar and beyond.', 'أدوات قوية مصممة لمديري العقارات في قطر وخارجها.')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-7 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rtl:border-s-4 rtl:border-e-0 border-s-4 border-s-coral"
              >
                <div className="w-12 h-12 rounded-xl bg-[#132B25] flex items-center justify-center mb-5">
                  <feature.icon className="w-6 h-6 text-coral" />
                </div>
                <h3 className="text-lg font-extrabold text-[#132B25] mb-2">
                  {tr(feature.title_en, feature.title_ar)}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {tr(feature.desc_en, feature.desc_ar)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          6. PROPERTY TYPES SHOWCASE
      ═════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-workspace relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-16 end-16 w-48 h-48 border border-coral/10 rounded-full pointer-events-none" />
        <div className="absolute top-24 end-24 w-32 h-32 border border-[#132B25]/10 rounded-full pointer-events-none" />
        <div className="absolute bottom-12 start-12 w-64 h-64 border border-coral/10 rounded-full pointer-events-none" />
        <div className="absolute bottom-20 start-20 w-40 h-40 border border-[#132B25]/10 rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#132B25] mb-4">
              {tr('Built for Every Property Type', 'مصنوع لكل نوع عقاري')}
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              {tr('Whether you manage a single villa or a 100+ unit complex, PropertyEase scales with you.', 'سواء كنت تدير فيلا واحدة أو مجمعاً يضم 100+ وحدة، بروبرتية إييز ينمو معك.')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                type: 'residential',
                label_en: 'Residential',
                label_ar: 'سكني',
                desc_en: 'Apartments, Villas, Townhouses',
                desc_ar: 'شقق، فلل، تاون هاوس',
                icon: Home,
                count: '2,400+',
              },
              {
                type: 'commercial',
                label_en: 'Commercial',
                label_ar: 'تجاري',
                desc_en: 'Offices, Retail, Warehouses',
                desc_ar: 'مكاتب، متاجر، مستودعات',
                icon: Store,
                count: '680+',
              },
              {
                type: 'mixed',
                label_en: 'Mixed-Use',
                label_ar: 'مختلط',
                desc_en: 'Residential + Commercial',
                desc_ar: 'سكني + تجاري',
                icon: Building2,
                count: '120+',
              },
              {
                type: 'hospitality',
                label_en: 'Hospitality',
                label_ar: 'ضيافة',
                desc_en: 'Hotels, Serviced Apartments',
                desc_ar: 'فنادق، شقق مفروشة',
                icon: Warehouse,
                count: '45+',
              },
            ].map((pt) => (
              <div
                key={pt.type}
                className="group relative rounded-2xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300"
              >
                <img
                  src={PROPERTY_TYPE_IMAGES[pt.type as keyof typeof PROPERTY_TYPE_IMAGES]}
                  alt={tr(pt.label_en, pt.label_ar)}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#132B25]/95 via-[#132B25]/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <pt.icon className="w-5 h-5 text-coral" />
                    <span className="text-white font-bold text-lg">
                      {tr(pt.label_en, pt.label_ar)}
                    </span>
                  </div>
                  <div className="text-white/70 text-sm font-medium mb-1">
                    {tr(pt.desc_en, pt.desc_ar)}
                  </div>
                  <div className="text-white/60 text-xs font-semibold">
                    {pt.count} {tr('properties', 'عقارات')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          7. PRICING SECTION — 3 tiers
      ═════════════════════════════════════════════ */}
      <section id="pricing" className="py-24 px-6 bg-white relative overflow-hidden">
        {/* Subtle accent circles */}
        <div className="absolute top-0 end-0 w-72 h-72 bg-coral/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 start-0 w-96 h-96 bg-[#132B25]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#132B25] mb-4">
              {tr('Simple, Transparent Pricing', 'أسعار بسيطة وواضحة')}
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              {tr('Start free for 3 days. No credit card required to begin.', 'ابدأ مجاناً لمدة 3 أيام. لا نطلب بطاقة ائتمان للبدء.')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl p-8 border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative ${
                  plan.popular
                    ? 'border-coral bg-gradient-to-b from-orange-50 to-white shadow-lg'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-coral text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md">
                    {plan.badge_en}
                  </span>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-lg font-extrabold text-[#132B25] mb-2">
                    {tr(plan.name_en, plan.name_ar)}
                  </h3>
                  <div className="text-4xl font-extrabold text-[#132B25]">
                    {plan.price === 'Free' ? (
                      <span className="text-emerald-600">{tr('Free', 'مجاني')}</span>
                    ) : (
                      <span className="text-coral">QAR {plan.price}</span>
                    )}
                  </div>
                  <div className="text-sm text-slate-400 font-medium mt-1">
                    {tr('per month', 'في الشهر')}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features_en.map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      {feat}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => { window.location.href = '/onboard'; }}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
                    plan.popular
                      ? 'bg-coral text-white hover:bg-[#c66546] shadow-md hover:shadow-lg'
                      : 'bg-[#132B25] text-white hover:bg-[#1A3831]'
                  }`}
                >
                  {plan.id === 'enterprise'
                    ? tr('Contact Sales', 'تواصل مع المبيعات')
                    : tr('Start Free Trial', 'ابدأ تجربة مجانية')
                  }
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          8. TESTIMONIALS
      ═════════════════════════════════════════════ */}
      <section id="testimonials" className="py-24 px-6 bg-workspace relative overflow-hidden">
        {/* Decorative quote marks */}
        <div className="absolute top-8 start-8 text-[#132B25]/5 text-9xl font-serif leading-none select-none pointer-events-none">"</div>
        <div className="absolute bottom-8 end-8 text-[#D97757]/8 text-9xl font-serif leading-none select-none pointer-events-none rotate-180">"</div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#132B25] mb-4">
              {tr('What Our Clients Say', 'ماذا يقول عملاؤنا')}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-8 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, si) => (
                    <Star key={si} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-slate-600 leading-relaxed mb-6 italic text-sm">
                  "{tr(t.quote_en, t.quote_ar).replace(/"/g, '')}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#132B25] flex items-center justify-center text-white text-xs font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-[#132B25] text-sm">
                      {tr(t.name_en, t.name_ar)}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      {tr(t.role_en, t.role_ar)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          9. FINAL CTA
      ═════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#132B25] via-[#1A3831] to-[#0D2A24] relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute top-10 start-10 w-64 h-64 bg-coral/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 end-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm font-semibold text-slate-200 mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-coral" />
            {tr('Start Your Journey Today', 'ابدأ رحلتك اليوم')}
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
            {isRtl
              ? <><span>ابدأ الإدارة بأفضل طريقة</span><br /><span>اليوم</span></>
              : <><span>Start Managing Smarter</span><br /><span>Today</span></>
            }
          </h2>

          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
            {tr(
              'Join 500+ property managers across Qatar. Your 3-day free trial starts now — no credit card required.',
              'انضم إلى أكثر من 500 مدير عقارات في قطر. تجربتك المجانية لمدة 3 أيام تبدأ الآن — بدون بطاقة ائتمان.'
            )}
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => { window.location.href = '/onboard'; }}
              className="px-10 py-4 bg-coral text-white font-extrabold rounded-2xl hover:bg-[#c66546] transition-all shadow-2xl hover:-translate-y-0.5 flex items-center gap-2 text-base"
            >
              {tr('Start Your Free Trial', 'ابدأ تجربتك المجانية')}
              <ArrowUpRight className="w-5 h-5" />
            </button>
            <Link
              href="/login"
              className="px-10 py-4 bg-white/10 text-white font-bold rounded-2xl border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2 text-base"
            >
              {tr('I Already Have an Account', 'لديك حساب بالفعل؟')}
            </Link>
          </div>

          <p className="text-sm text-slate-400 mt-6 font-semibold">
            {tr('No credit card required · 3-day free trial · Cancel anytime', 'لا حاجة لبطاقة ائتمان · تجربة مجانية 3 أيام · إلغاء في أي وقت')}
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          10. FOOTER
      ═════════════════════════════════════════════ */}
      <footer className="py-12 px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#132B25] rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-extrabold">P</span>
            </div>
            <span className="font-extrabold text-slate-900">PropertyEase</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="#" className="hover:text-[#132B25] font-semibold transition-colors">{tr('Privacy Policy', 'سياسة الخصوصية')}</Link>
            <Link href="#" className="hover:text-[#132B25] font-semibold transition-colors">{tr('Terms of Service', 'شروط الخدمة')}</Link>
            <Link href="#" className="hover:text-[#132B25] font-semibold transition-colors">{tr('Contact', 'اتصل بنا')}</Link>
          </div>

          <div className="flex items-center gap-4">
            <Globe className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400 font-semibold">
              {lang === 'en' ? 'English' : 'العربية'}
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-8 pt-8 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400 font-semibold">
            {yearText}
          </p>
        </div>
      </footer>
    </div>
  );
}
