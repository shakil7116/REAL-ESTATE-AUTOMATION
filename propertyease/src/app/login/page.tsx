'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn, getProviders } from 'next-auth/react';
import {
  Eye, EyeOff, LogIn, Mail, Lock, AlertCircle,
  ArrowRight, Sparkles, ShieldCheck, Zap, HeartHandshake,
  Chrome,
} from 'lucide-react';
import { seedSampleData } from '@/lib/seed';
import { useMounted } from '@/lib/useClientTime';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [providers, setProviders] = useState<any>(null);
  const isRtl = lang === 'ar';
  const tr = (en: string, ar: string) => isRtl ? ar : en;

  // Load providers on mount so Google button renders
  useEffect(() => {
    (async () => {
      const result = await getProviders();
      setProviders(result);
    })();
  }, []);

  // Pre-fill email if coming from a redirect with email hint
  useEffect(() => {
    const stored = sessionStorage.getItem('propertyease_user_name');
    if (stored) setName(stored);
    const hint = searchParams.get('email');
    if (hint) setEmail(hint);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError(tr('Please enter your email and password.', 'يرجى إدخال البريد الإلكتروني وكلمة المرور.'));
      setIsLoading(false);
      return;
    }

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      if (result.error === 'CredentialsSignin') {
        // Distinguish "no user found" from "wrong password" if possible
        // NextAuth collapses both into the same error, so show a safe generic message
        setError(tr('Invalid email or password. Please try again.', 'بريد إلكتروني أو كلمة مرور غير صحيحة. يرجى المحاولة مرة أخرى.'));
      } else {
        setError(result.error);
      }
      setIsLoading(false);
      return;
    }

    // Store for client-side UI (sidebar greeting, etc.)
    const userName = name.trim() || email.split('@')[0];
    const storedCreatedAt = sessionStorage.getItem('propertyease_user_createdAt');
    sessionStorage.setItem('propertyease_user', JSON.stringify({
      email,
      name: userName,
      createdAt: storedCreatedAt ?? new Date().toISOString(),
    }));
    sessionStorage.setItem('propertyease_user_name', userName);
    sessionStorage.setItem('propertyease_demo', 'true');
    seedSampleData();
    router.push('/dashboard');
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    const result = await signIn('google', { callbackUrl: '/dashboard' });
    if (result?.error) {
      setError(tr('Google sign-in failed. Please try again.', 'فشل تسجيل الدخول عبر جوجل. يرجى المحاولة مرة أخرى.'));
      setIsLoading(false);
    }
    // If no error, NextAuth redirects automatically to callbackUrl
  };

  const handleDemoLogin = () => {
    const demoName = 'Demo User';
    const demoCreatedAt = sessionStorage.getItem('propertyease_user_createdAt') ?? new Date().toISOString();
    sessionStorage.setItem('propertyease_demo', 'true');
    sessionStorage.setItem('propertyease_user', JSON.stringify({
      email: 'demo@propertEase.qa',
      name: demoName,
      createdAt: demoCreatedAt,
    }));
    sessionStorage.setItem('propertyease_user_name', demoName);
    seedSampleData();
    router.push('/dashboard');
  };

  // Time-of-day greeting
  const mounted = useMounted();
  const getGreetingPrefix = () => {
    const hour = new Date().getHours();
    if (lang === 'ar') {
      if (hour < 12) return 'صباح الخير';
      if (hour < 17) return 'مساء الخير';
      return 'مساء الخير';
    }
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };
  const greetingPrefix = mounted ? getGreetingPrefix() : (lang === 'ar' ? 'مرحباُ' : 'Welcome');

  // Auth query params
  const authError = searchParams.get('error');
  useEffect(() => {
    if (authError === 'OAuthSignin' || authError === 'OAuthCallback' || authError === 'OAuthAccountNotLinked') {
      setError(tr('Sign-in failed. Please try again.', 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.'));
    }
  }, [authError, tr]);

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[#F6F8F6] flex relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#D97757]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#132B25] via-[#1A3831] to-[#0D2A24] relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#D97757]/12 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white w-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-[#D97757] text-2xl font-extrabold">P</span>
            </div>
            <span className="text-2xl font-extrabold">{tr('PropertyEase', 'بروبرتي إيز')}</span>
          </div>
          <h1 className="text-4xl font-extrabold mb-4 leading-tight">
            {tr('Welcome Back,', 'مرحباُ بعودتك،')}<br />
            <span className="text-[#D97757]">{tr('Manager', 'المدير')}</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-md leading-relaxed font-medium">
            {tr('Sign in to access your property dashboard. Track rent, manage maintenance, and grow your portfolio.', 'سجل دخولك للوصول إلى لوحة تحكم العقارات. تتبع الإيجارات وأدر الصيانة ونمِ محفظتك.')}
          </p>
          <div className="grid grid-cols-3 gap-4 mt-10">
            {[
              { value: '500+', label: tr('Properties', 'العقارات') },
              { value: '12K+', label: tr('Units', 'الوحدات') },
              { value: 'QAR 2M+', label: tr('Monthly Rent', 'الإيجار الشهري') },
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-2xl font-extrabold text-[#D97757]">{stat.value}</div>
                <div className="text-xs text-slate-400 mt-1 font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-10 space-y-3">
            {[
              { icon: Sparkles, e: 'AI Tenant Support — 24/7', ar: '🤖 دعم المستأجرين بالذكاء الاصطناعي — 24/7' },
              { icon: Zap, e: 'Marketing & Lead Analytics', ar: '📊 تحليلات التسويق والعملاء المحتملين' },
              { icon: HeartHandshake, e: 'Smart Maintenance Dispatch', ar: '🔧 توجيه الصيانة الذكي' },
              { icon: ShieldCheck, e: 'PDC & Payment Tracking', ar: '💰 تتبع الشيكات والمدفوعات' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                <feature.icon className="w-4 h-4 text-[#D97757] shrink-0" />
                <span>{tr(feature.e, feature.ar)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-[#132B25] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl font-extrabold">P</span>
            </div>
            <span className="text-2xl font-extrabold text-[#132B25]">PropertyEase</span>
          </div>

          {/* Language Toggle */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="text-xs text-slate-500 hover:text-slate-700 font-bold border border-slate-200 rounded-lg px-2.5 py-1.5 transition-all hover:bg-white"
            >
              {lang === 'en' ? 'العربية' : 'English'}
            </button>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/60">
            <h2 className="text-2xl font-extrabold text-[#132B25] mb-2">
              {tr('Sign In', 'تسجيل الدخول')}
            </h2>
            <p className="text-slate-500 text-sm mb-6 font-medium">
              {tr('Enter your credentials to access your dashboard', 'أدخل بياناتك للوصول إلى لوحة التحكم')}
            </p>

            {authError && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-medium mb-6">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {tr('Sign-in error. Please try again.', 'خطأ في تسجيل الدخول. يرجى المحاولة مرة أخرى.')}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-medium mb-6">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {tr('Full Name', 'الاسم الكامل')}
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder={tr('e.g. Mamun Mia', 'مثلاُ: مامون ميّا')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {tr('Email', 'البريد الإلكتروني')}
                </label>
                <div className="relative">
                  <Mail className="absolute top-3.5 ltr:right-3 rtl:left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    className="input-field ps-10"
                    placeholder={tr('you@company.com', 'أنت@شركتك.com')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {tr('Password', 'كلمة المرور')}
                </label>
                <div className="relative">
                  <Lock className="absolute top-3.5 ltr:right-3 rtl:left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field ps-10 pe-10"
                    placeholder={tr('••••••••', '••••••••')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-3.5 ltr:left-3 rtl:right-3 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#132B25] focus:ring-[#132B25]" />
                  <span className="text-sm text-slate-600 font-medium">{tr('Remember me', 'تذكرني')}</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-[#D97757] hover:underline font-semibold"
                >
                  {tr('Forgot password?', 'نسيت كلمة المرور؟')}
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#132B25] text-white rounded-xl font-extrabold text-base hover:bg-[#1A3831] active:scale-[0.98] hover:shadow-xl hover:shadow-[#132B25]/25 hover:-translate-y-0.5 transition-all duration-200 shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {tr('Signing in...', 'جارٍ تسجيل الدخول...')}
                  </span>
                ) : (
                  <>
                    {tr('Sign In', 'تسجيل الدخول')}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Google Sign-In */}
            {providers?.google && (
              <>
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{tr('or continue with', 'أو تابع مع')}</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full mt-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-[#D97757] hover:bg-orange-50 hover:text-[#D97757] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Chrome className="w-4 h-4" />
                  {tr('Continue with Google', 'متابعة عبر جوجل')}
                </button>
              </>
            )}

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{tr('or', 'أو')}</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full mt-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:border-[#D97757] hover:text-[#D97757] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {tr('Try Demo — No Account Needed', 'جرّب العرض التجريبي — بدون حساب')}
            </button>
          </div>

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-slate-500 font-medium">
              {tr("Don't have an account?", 'ليس لديك حساب؟')}{' '}
              <Link href="/signup" className="text-[#D97757] font-bold hover:underline">
                {tr('Start Free Trial', 'ابدأ تجربة مجانية')}
              </Link>
            </p>
            <p className="text-xs text-slate-400 font-semibold">
              {'© 2024 PropertyEase. '}{tr('All rights reserved.', 'جميع الحقوق محفوظة.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
