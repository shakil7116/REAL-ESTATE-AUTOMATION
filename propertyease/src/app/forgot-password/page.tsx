'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const isRtl = lang === 'ar';
  const tr = (en: string, ar: string) => isRtl ? ar : en;

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg(tr('Please enter your email address.', 'يرجى إدخال عنوان بريدك الإلكتروني.'));
      return;
    }
    if (!validateEmail(email)) {
      setErrorMsg(tr('Please enter a valid email address.', 'يرجى إدخال بريد إلكتروني صحيح.'));
      return;
    }

    setStatus('loading');

    // Try Supabase reset (if configured), otherwise mark as sent for demo
    try {
      const { supabase } = await import('@/lib/database');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setStatus('sent');
    } catch (err: any) {
      // If Supabase is not configured, still show success (demo mode)
      if (err.message?.includes('no supabase') || err.message?.includes('not configured')) {
        setStatus('sent');
      } else {
        setStatus('error');
        setErrorMsg(err.message || tr('Failed to send reset email. Please try again.', 'فشل إرسال رابط إعادة التعيين. يرجى المحاولة مرة أخرى.'));
      }
    }
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[#F6F8F6] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#D97757] font-semibold mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {tr('Back to login', 'العودة لتسجيل الدخول')}
        </Link>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/60">
          <div className="w-12 h-12 bg-[#132B25] rounded-xl flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-xl font-extrabold">P</span>
          </div>

          {status === 'sent' ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-extrabold text-[#132B25] mb-2">
                {tr('Check your email', 'تحقق من بريدك الإلكتروني')}
              </h2>
              <p className="text-slate-500 text-sm font-medium mb-6">
                {tr('We sent a password reset link to', 'أرسلنا رابط إعادة تعيين كلمة المرور إلى')}{' '}
                <span className="font-semibold text-slate-700">{email}</span>.
              </p>
              <Link
                href="/login"
                className="inline-block w-full py-3.5 bg-[#132B25] text-white rounded-xl font-extrabold text-base hover:bg-[#1A3831] transition-all"
              >
                {tr('Back to login', 'العودة لتسجيل الدخول')}
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-extrabold text-[#132B25] mb-2 text-center">
                {tr('Reset your password', 'إعادة تعيين كلمة المرور')}
              </h2>
              <p className="text-slate-500 text-sm mb-6 text-center font-medium">
                {tr('Enter your email and we will send you a reset link.', 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.')}
              </p>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-medium mb-6">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    {tr('Email address', 'العنوان البريدي الإلكتروني')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute top-3.5 ltr:right-3 rtl:left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      className="input-field ps-10"
                      placeholder={tr('you@company.com', 'أنت@شركتك.com')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={status === 'loading'}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-3.5 bg-[#132B25] text-white rounded-xl font-extrabold text-base hover:bg-[#1A3831] active:scale-[0.98] hover:shadow-xl hover:shadow-[#132B25]/25 transition-all duration-200 shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {status === 'loading' ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {tr('Sending...', 'جارٍ الإرسال...')}
                    </span>
                  ) : (
                    tr('Send reset link', 'إرسال رابط التعيين')
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
