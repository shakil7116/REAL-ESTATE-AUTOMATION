'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Eye, EyeOff, User, Mail, Lock,
  CheckCircle2, AlertCircle, ArrowRight, Sparkles, HeartHandshake,
  ShieldCheck, Zap,
} from 'lucide-react';
import { useOnboarding } from '@/context/OnboardingContext';
import { supabase } from '@/lib/database';

export default function SignupPage() {
  const router = useRouter();
  const { data } = useOnboarding();
  const [step, setStep] = useState<'details' | 'trial'>('details');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const isRtl = lang === 'ar';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('growth');

  const tr = (en: string, ar: string) => isRtl ? ar : en;

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!name.trim() || !email.trim() || !password.trim()) {
        setError(tr('Please fill in all fields.', 'يرجى ملء جميع الحقول.'));
        setIsLoading(false);
        return;
      }
      if (!validateEmail(email)) {
        setError(tr('Please enter a valid email address.', 'يرجى إدخال بريد إلكتروني صحيح.'));
        setIsLoading(false);
        return;
      }
      if (password.length < 8) {
        setError(tr('Password must be at least 8 characters.', 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.'));
        setIsLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError(tr('Passwords do not match.', 'كلمتا المرور غير متطابقتين.'));
        setIsLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            onboarding_data: data,
          },
        },
      });

      if (authError) throw authError;

      sessionStorage.setItem('propertyease_onboarding', JSON.stringify(data));
      sessionStorage.setItem('propertyease_user', JSON.stringify({ name, email, createdAt: new Date().toISOString() }));

      if (authData.user) {
        // Show plan selection screen (user picks plan before entering dashboard)
        setStep('trial');
      }
    } catch (err: any) {
      setError(err.message || tr('Sign up failed. Please try again.', 'فشل التسجيل. يرجى المحاولة مرة أخرى.'));
    } finally {
      setIsLoading(false);
    }
  };

  const startTrial = () => {
    sessionStorage.setItem('propertyease_trial_active', 'true');
    sessionStorage.setItem('propertyease_trial_end', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString());
    sessionStorage.setItem('propertyease_plan', selectedPlan);
  };

  const handleTrial = () => {
    setIsLoading(true);
    startTrial();
    // Redirect to dashboard immediately after setting trial data
    setTimeout(() => {
      sessionStorage.setItem('propertyease_plan', selectedPlan);
      router.push('/dashboard');
    }, 200); // 200ms for visual feedback only
  };

  // Left panel content
  const LeftPanel = () => (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#132B25] via-[#1A3831] to-[#0D2A24] relative overflow-hidden">
      {/* Animated blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#D97757]/15 rounded-full blur-3xl animate-float-blob" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-float-blob-reverse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-3xl animate-parallax-drift" />
      </div>

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <div className="relative z-10 flex flex-col justify-center px-12 text-white w-full">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-[#D97757] text-2xl font-extrabold">P</span>
          </div>
          <span className="text-2xl font-extrabold">{tr('PropertyEase', 'بروبرتي إييز')}</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-extrabold leading-tight mb-6 text-boost">
          {step === 'details' ? (
            <>
              {tr('Your property', 'رحلة عقاراتك')}<br />
              <span className="text-[#D97757]">{tr('journey starts here', 'تبدأ من هنا')}</span>
            </>
          ) : (
            <>
              {tr('Choose your', 'اختر خطتك')}<br />
              <span className="text-[#D97757]">{tr('path to growth', 'نحو النمو')}</span>
            </>
          )}
        </h1>

        <p className="text-slate-300 text-lg leading-relaxed font-medium mb-10">
          {step === 'details'
            ? tr('Welcome, future property manager. In just a few steps, you\'ll have a fully personalized dashboard ready for your portfolio.', 'مرحباّ بك يا مدير العقارات المستقبلي. في بضع خطوات فقط، سيكون لديك لوحة تحكم مخصصة بالكامل جاهزة لمحفظتك.')
            : tr('Start with a 3-day free trial. No credit card required — explore everything before committing.', 'ابدأ بتجربة مجانية لمدة 3 أيام. بدون بطاقة ائتمان — استكشف كل شيء قبل الالتزام.')
          }
        </p>

        {/* Onboarding summary */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
          <div className="text-xs font-extrabold uppercase tracking-widest text-[#D97757] mb-4">
            {tr('Your setup', 'إعدادك')}
          </div>
          <div className="space-y-2 text-sm">
            {[
              { key: 'propertyType', label: tr('Property type', 'نوع العقار'), value: data.propertyType },
              { key: 'portfolioSize', label: tr('Properties managed', 'العقارات المُدارة'), value: data.portfolioSize },
              { key: 'mainChallenge', label: tr('Main challenge', 'التحدي الرئيسي'), value: data.mainChallenge },
              { key: 'teamSize', label: tr('Team', 'الفريق'), value: data.teamSize },
              { key: 'companyName', label: tr('Company', 'الشركة'), value: data.companyName },
            ].map((item) => {
              const valueMap: Record<string, string> = {
                propertyType: PROPERTY_LABELS[data.propertyType] || '—',
                portfolioSize: PORTFOLIO_LABELS[data.portfolioSize] || '—',
                mainChallenge: CHALLENGE_LABELS[data.mainChallenge] || '—',
                teamSize: TEAM_LABELS[data.teamSize] || '—',
                companyName: data.companyName || '—',
              };
              return (
                <div key={item.key} className="flex justify-between gap-3">
                  <span className="text-slate-400 font-medium">{item.label}</span>
                  <span className="font-bold text-white text-end">{valueMap[item.key]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-10 space-y-3">
          {[
            { icon: ShieldCheck, en: 'Bank-level encryption', ar: 'تشفير على مستوى بنكي' },
            { icon: Zap, en: 'AI-powered insights', ar: 'رؤى مدعومة بالذكاء الاصطناعي' },
            { icon: HeartHandshake, en: 'Dedicated support team', ar: 'فريق دعم متخصص' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
              <item.icon className="w-4 h-4 text-[#D97757] shrink-0" />
              <span>{isRtl ? item.ar : item.en}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const PROPERTY_LABELS: Record<string, string> = { residential: tr('Residential', 'سكني'), commercial: tr('Commercial', 'تجاري'), mixed: tr('Mixed-Use', 'مختلط'), hospitality: tr('Hospitality', 'ضيافة') };
  const PORTFOLIO_LABELS: Record<string, string> = {
    '1-10': tr('1–10 properties', '١ – ١٠ عقارات'),
    '11-50': tr('11–50 properties', '١١ – ٥٠ عقاراً'),
    '51-200': tr('51–200 properties', '٥١ – ٢٠٠ عقار'),
    '200+': tr('200+ properties', '٢٠٠+ عقار'),
  };
  const CHALLENGE_LABELS: Record<string, string> = {
    'rent-collection': tr('Rent Collection', 'تحصيل الإيجارات'),
    maintenance: tr('Maintenance', 'الصيانة'),
    'tenant-communication': tr('Tenant Communication', 'تواصل المستأجرين'),
    marketing: tr('Marketing & Vacancies', 'التسويق والشواغر'),
    reporting: tr('Reporting', 'التقارير'),
    'multi-property': tr('Multi-Property', 'إدارة متعددة'),
  };
  const TEAM_LABELS: Record<string, string> = {
    solo: tr('Just me', 'أنا وحدي'),
    '2-5': tr('2–5 people', '٢ – ٥ أشخاص'),
    '6-20': tr('6–20 people', '٦ – ٢٠ شخصاً'),
    '20+': tr('20+ people', '٢٠+ شخصاً'),
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[#F6F8F6] flex relative overflow-hidden">
      {/* Background ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#D97757]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <LeftPanel />

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-[#132B25] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl font-extrabold">P</span>
            </div>
            <span className="text-2xl font-extrabold text-[#132B25]">PropertyEase</span>
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${
                s <= (step === 'details' ? 1 : 2) ? 'bg-[#D97757] shadow-sm' : 'bg-slate-200'
              }`} />
            ))}
          </div>

          {/* Language toggle */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="text-xs text-slate-500 hover:text-slate-700 font-bold border border-slate-200 rounded-lg px-2.5 py-1.5 transition-all hover:bg-white"
            >
              {lang === 'en' ? 'العربية' : 'English'}
            </button>
          </div>

          {/* ── Details Step ── */}
          {step === 'details' && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-extrabold text-[#132B25] mb-1 text-boost">
                {tr('Create your account', 'أنشئ حسابك')}
              </h2>
              <p className="text-slate-500 text-sm font-medium mb-8">
                {tr('Fill in your details to start your free 3-day trial.', 'املأ بياناتك للبدء مع تجربتك المجانية لمدة 3 أيام.')}
              </p>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-medium mb-6">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{tr('Full name', 'الاسم الكامل')}</label>
                  <div className="relative">
                    <User className="absolute top-3.5 ltr:right-3 rtl:left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      className="input-field ps-10"
                      placeholder={tr('e.g., Noura Al Mansouri', 'مثال: نورة المنصوري')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{tr('Email address', 'البريد الإلكتروني')}</label>
                  <div className="relative">
                    <Mail className="absolute top-3.5 ltr:right-3 rtl:left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      className="input-field ps-10"
                      placeholder={tr('you@company.com', 'أنت@شركتك.com')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{tr('Password', 'كلمة المرور')}</label>
                  <div className="relative">
                    <Lock className="absolute top-3.5 ltr:right-3 rtl:left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field ps-10 pe-10"
                      placeholder={tr('Min. 8 characters', '8 أحرف على الأقل')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-3.5 ltr:left-3 rtl:right-3 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 font-semibold">
                    {tr('At least 8 characters with letters and numbers', '8 أحرف على الأقل مع حروف وأرقام')}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{tr('Confirm password', 'تأكيد كلمة المرور')}</label>
                  <div className="relative">
                    <Lock className="absolute top-3.5 ltr:right-3 rtl:left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="password"
                      className="input-field ps-10"
                      placeholder={tr('Re-enter your password', 'أعد إدخال كلمة المرور')}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={8}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 mt-2 bg-[#D97757] text-white rounded-xl font-extrabold text-base hover:bg-[#c46748] active:scale-[0.98] hover:shadow-xl hover:shadow-[#D97757]/30 hover:-translate-y-0.5 transition-all duration-200 shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {tr('Creating account...', 'جارِ إنشاء الحساب...')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {tr('Create account & start trial', 'أنشئ الحساب وابدأ التجربة')}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{tr('or continue with', 'أو متابعة بواسطة')}</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Google Sign-In */}
              <button
                type="button"
                onClick={() => {
                  // Use Supabase's built-in callback which handles redirect properly
                  supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: `${window.location.origin}/callback`,
                    },
                  });
                }}
                className="w-full py-3 border-2 border-slate-200 rounded-xl font-bold text-base text-slate-700 hover:border-[#D97757] hover:bg-orange-50 hover:text-[#D97757] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 shadow-sm"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {tr('Continue with Google', 'متابعة عبر جوجل')}
              </button>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-500 font-medium">
                  {tr('Already have an account?', 'لديك حساب بالفعل؟')}{' '}
                  <Link href="/login" className="text-[#D97757] font-bold hover:underline">{tr('Sign in', 'تسجيل الدخول')}</Link>
                </p>
              </div>

              <p className="text-xs text-slate-400 text-center mt-4 font-semibold leading-relaxed">
                {tr('By signing up, you agree to our Terms of Service and Privacy Policy. Your 3-day free trial starts immediately.', 'بتسجيلك، فإنك توافق على شروط الخدمة وسياسة الخصوصية. تجربتك المجانية لمدة 3 أيام تبدأ فوراُ.')}
              </p>
            </div>
          )}

          {/* ── Trial Step (skip: goes straight to dashboard) ── */}
          {step === 'trial' && (
            <div className="animate-slide-up">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D97757] to-[#c46748] flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-extrabold text-[#132B25] text-boost">
                  {tr('Choose your plan', 'اختر خطتك')}
                </h2>
                <p className="text-slate-500 text-sm mt-2 font-medium">
                  {tr('Start with a 3-day free trial. No credit card required.', 'ابدأ بتجربة مجانية لمدة 3 أيام. لا نطلب بطاقة ائتمان.')}
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { id: 'starter', name: tr('Starter', 'المبتدئ'), price: 'QAR 0', period: tr('3-day trial', 'تجربة 3 أيام'), desc: tr('Up to 10 units', 'حتى 10 وحدات'), popular: false, free: true },
                  { id: 'growth', name: tr('Growth', 'النمو'), price: 'QAR 299', period: tr('per month', 'شهرياُ'), desc: tr('Up to 50 units + AI chatbot', 'حتى 50 وحدة + شات بوت ذكي'), popular: true },
                  { id: 'enterprise', name: tr('Enterprise', 'المؤسسات'), price: 'QAR 799', period: tr('per month', 'شهرياُ'), desc: tr('Unlimited + full AI Copilot', 'غير محدود + مساعد ذكي كامل'), popular: false },
                ].map((plan) => {
                  const isSelected = selectedPlan === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`w-full text-left rounded-2xl p-5 border-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99] relative ${
                        isSelected
                          ? 'border-[#D97757] bg-orange-50/70 shadow-md ring-4 ring-[#D97757]/10'
                          : 'border-slate-200 bg-white hover:border-[#D97757]/40'
                      }`}
                    >
                      {plan.popular && (
                        <span className="absolute -top-2.5 right-4 px-3 py-0.5 rounded-full bg-[#D97757] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                          {tr('Most popular', 'الأكثر شعبية')}
                        </span>
                      )}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                            isSelected ? 'border-[#D97757] bg-[#D97757]' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                          </span>
                          <div>
                            <div className="font-extrabold text-[#132B25]">{plan.name}</div>
                            <div className="text-xs text-slate-500 font-medium">{plan.period} · {plan.desc}</div>
                          </div>
                        </div>
                        <div className={`text-xl font-extrabold ${plan.free ? 'text-emerald-600' : isSelected ? 'text-[#D97757]' : 'text-[#132B25]'}`}>{plan.price}</div>
                      </div>
                    </button>
                  );
                })}

                <button
                  onClick={handleTrial}
                  disabled={isLoading}
                  className="w-full mt-6 py-4 bg-[#D97757] text-white rounded-2xl font-extrabold text-base hover:bg-[#c46748] active:scale-[0.98] hover:shadow-2xl hover:shadow-[#D97757]/30 hover:-translate-y-0.5 transition-all duration-200 shadow-xl flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {tr('Activating trial...', 'جارٍ تفعيل التجربة...')}
                    </span>
                  ) : (
                    <>{tr('Start 3-day free trial', 'ابدأ تجربة 3 أيام مجانية')}<ArrowRight className="w-5 h-5" /></>
                  )}
                </button>

                <button
                  onClick={handleTrial}
                  disabled={isLoading}
                  className="w-full py-3 bg-white text-slate-600 rounded-xl font-bold text-sm border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
                >
                  {tr('Choose plan later', 'اختيار الخطة لاحقاُ')}
                </button>

                <p className="text-xs text-slate-400 text-center mt-3 font-semibold">
                  {tr('No credit card required. Cancel anytime.', 'لا نطلب بطاقة ائتمان. إلغاء في أي وقت.')}
                </p>
                <div className="mt-4 text-center">
                  <Link href="/login" className="text-sm text-[#D97757] font-bold hover:underline">
                    {tr('Already have an account? Sign in', 'لديك حساب بالفعل؟ سجل الدخول')}
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
