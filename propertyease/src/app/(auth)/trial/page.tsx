'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard, ShieldCheck, CheckCircle2,
  ArrowRight, Lock, Sparkles, Building2, Calendar, Smartphone,
} from 'lucide-react';
import { useOnboarding } from '@/context/OnboardingContext';
import { useCountry } from '@/context/CountryContext';

export default function TrialPage() {
  const router = useRouter();
  const { data } = useOnboarding();
  const { currencySymbol } = useCountry();
  const [isLoading, setIsLoading] = useState(false);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const isRtl = lang === 'ar';

  const t = (en: string, ar: string) => isRtl ? ar : en;

  useEffect(() => {
    const trialActive = sessionStorage.getItem('propertyease_trial_active');
    if (trialActive === 'true') {
      router.push('/dashboard');
    }
  }, []);

  const handleActivateTrial = async () => {
    setIsLoading(true);
    sessionStorage.setItem('propertyease_trial_active', 'true');
    const trialEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    sessionStorage.setItem('propertyease_trial_end', trialEnd);
    sessionStorage.setItem('propertyease_onboarding', JSON.stringify(data));
    router.push('/dashboard');
  };

  const handleSkip = () => {
    sessionStorage.setItem('propertyease_trial_active', 'true');
    const trialEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    sessionStorage.setItem('propertyease_trial_end', trialEnd);
    router.push('/dashboard');
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[#F6F8F6] flex relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0B2440] via-[#123A5C] to-[#0A3049] relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 right-10 w-72 h-72 bg-sky-400/15 rounded-full blur-3xl animate-float-blob" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl animate-float-blob-reverse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-sky-300/10 rounded-full blur-3xl animate-parallax-drift" />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

        <div className="relative z-10 flex flex-col justify-center px-12 text-white w-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-sky-300 text-2xl font-extrabold">P</span>
            </div>
            <span className="text-2xl font-extrabold">PropertyEase</span>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight mb-6 text-boost">
            {isRtl ? (
              <>
                تجربتك المجانية<br />
                <span className="text-sky-300">لمدة ٣ أيام</span><br />
                تبدأ الآن
              </>
            ) : (
              <>
                Your 3-day<br />
                <span className="text-sky-300">free trial</span><br />
                starts now
              </>
            )}
          </h1>

          <p className="text-slate-200 text-lg leading-relaxed font-medium mb-10">
            {t('No credit card required. Explore the full platform, add your properties, and see how PropertyEase transforms your property management.', 'لا نطلب بطاقة ائتمان. استكشف المنصة كاملة، أضف عقاراتك، وشاهد كيف يحوّل PropertyEase إدارة عقاراتك.')}
          </p>

          <div className="space-y-4">
            {[
              { icon: Building2, text: t('Full dashboard access — all modules', 'لوحة تحكم كاملة — جميع الوحدات') },
              { icon: Sparkles, text: t('AI Copilot with real-time insights', 'مساعد ذكي مع رؤى مباشرة') },
              { icon: ShieldCheck, text: t('PDC tracking, maintenance dispatch, marketing tools', 'تتبع الشيكات، الصيانة، أدوات التسويق') },
              { icon: Smartphone, text: t('Mobile app access included', 'تطبيق الجوال متضمن') },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-md">
                  <item.icon className="w-4 h-4 text-sky-300" />
                </div>
                <span className="text-sm text-slate-200 font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <div className="text-xs font-extrabold uppercase tracking-widest text-slate-300 mb-3">{t('Trial period', 'فترة التجربة')}</div>
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-sky-300" />
              <div>
                <div className="text-lg font-extrabold">{t('3 days full access', '3 أيام وصول كامل')}</div>
                <div className="text-xs text-slate-400 font-medium">{t('No payment required to start', 'لا نطلب الدفع للبدء')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-[#0B2440] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl font-extrabold">P</span>
            </div>
            <span className="text-2xl font-extrabold text-[#0B2440]">PropertyEase</span>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-widest text-sky-600 mb-1">{t('Step 3 of 3', 'الخطوة 3 من 3')}</div>
              <h2 className="text-2xl font-extrabold text-[#0B2440] text-boost">{t('Activate your trial', 'فعّل تجربتك')}</h2>
            </div>
            <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="text-xs text-slate-500 hover:text-slate-700 font-bold">
              {lang === 'en' ? 'العربية' : 'English'}
            </button>
          </div>

          <div className="card p-6 space-y-6">
            <div>
              <div className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-4">{t('How would you like to start?', 'كيف تريد البدء؟')}</div>

              <div className="space-y-3">
                <label className="flex items-start gap-4 p-4 rounded-xl border-2 border-sky-500 bg-sky-50/70 cursor-pointer transition-all duration-150 hover:shadow-md ring-4 ring-sky-500/10">
                  <input type="radio" name="payment" defaultChecked className="mt-1 accent-sky-500" />
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                    <CreditCard className="w-5 h-5 text-sky-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-extrabold text-sm text-[#0B2440]">{t('Credit card — 3-day free trial', 'بطاقة ائتمان — تجربة مجانية 3 أيام')}</div>
                    <div className="text-xs text-slate-500 mt-0.5 font-medium">{t('Start now, pay after 3 days. Cancel anytime.', 'ابدأ الآن، ادفع بعد 3 أيام. ألغِ في أي وقت.')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-emerald-600">{currencySymbol} 0</div>
                    <div className="text-[10px] text-slate-400 font-medium">{t('today', 'اليوم')}</div>
                  </div>
                </label>

                <label className="flex items-start gap-4 p-4 rounded-xl border-2 border-slate-200 cursor-pointer transition-all duration-150 hover:border-sky-200 hover:shadow-md bg-white">
                  <input type="radio" name="payment" className="mt-1 accent-sky-500" />
                  <div className="w-10 h-10 rounded-xl bg-[#F6F8F6] border border-slate-200 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-extrabold text-sm text-[#0B2440]">{t('Skip payment — basic access', 'تخطي الدفع — وصول أساسي')}</div>
                    <div className="text-xs text-slate-500 mt-0.5 font-medium">{t('Get limited access now. Upgrade later.', 'احصل على وصول محدود الآن. رقِّ لاحقاً.')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-slate-400">FREE</div>
                    <div className="text-[10px] text-slate-400 font-medium">{t('forever', 'أبداً')}</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <Lock className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs text-slate-600 font-medium">{t('Your payment info is encrypted and secure. We never store full card details.', 'معلومات الدفع مشفرة وآمنة. لا نخزن تفاصيل البطاقة الكاملة.')}</div>
            </div>

            <div className="space-y-3">
              <button onClick={handleActivateTrial} disabled={isLoading} className="w-full py-4 bg-sky-500 text-white rounded-xl font-bold text-base hover:bg-sky-400 active:scale-[0.98] hover:shadow-xl hover:shadow-sky-500/30 hover:-translate-y-0.5 transition-all duration-150 shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 disabled:opacity-70">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('Activating...', 'جارِ التفعيل...')}
                  </span>
                ) : (
                  <>{t('Start my free trial', 'ابدأ تجربتي المجانية')}<ArrowRight className="w-5 h-5" /></>
                )}
              </button>

              <button onClick={handleSkip} className="w-full py-3 bg-white text-slate-600 rounded-xl font-bold text-sm border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150">
                {t('Continue with basic access', 'متابعة بالوصول الأساسي')}
              </button>
            </div>
          </div>

          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-slate-500 font-medium">{t(`After your trial, plans start at ${currencySymbol} 299/month. Cancel anytime.`, `بعد تجربتك، تبدأ الخطط من 299 ${currencySymbol}/شهر. ألغِ في أي وقت.`)}</p>
            <Link href="/login" className="text-xs text-sky-600 font-bold hover:underline">{t('Already have an account? Sign in', 'لديك حساب بالفعل؟ سجل الدخول')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
