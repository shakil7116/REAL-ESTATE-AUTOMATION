'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/database';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const accessTok = hash.slice(1).split('&').find(p => p.startsWith('access_token='))?.split('=')[1];
      if (accessTok) {
        // Supabase redirects with token in hash — set it manually
        supabase.auth.setSession({
          access_token: accessTok,
          refresh_token: '',
        }).catch(() => {});
      }
    }
  }, []);

  const validatePassword = (pw: string) => pw.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#F6F8F6] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border border-white/60 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#132B25] mb-2">Password reset successful!</h2>
          <p className="text-slate-500 text-sm font-medium mb-6">Redirecting you to login...</p>
          <Link href="/login" className="text-[#D97757] font-bold text-sm hover:underline">
            Go to login →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8F6] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#D97757] font-semibold mb-8 transition-colors">
          ← Back to login
        </Link>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/60">
          <div className="w-12 h-12 bg-[#132B25] rounded-xl flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-xl font-extrabold">P</span>
          </div>

          <h2 className="text-2xl font-extrabold text-[#132B25] mb-2 text-center">Set new password</h2>
          <p className="text-slate-500 text-sm mb-6 text-center font-medium">Choose a strong password for your account.</p>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-medium mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">New password</label>
              <div className="relative">
                <Lock className="absolute top-3.5 right-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field ps-10 pe-10"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-3.5 left-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 font-semibold">At least 8 characters with letters and numbers</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Confirm password</label>
              <div className="relative">
                <Lock className="absolute top-3.5 right-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  className="input-field ps-10"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#132B25] text-white rounded-xl font-extrabold text-base hover:bg-[#1A3831] active:scale-[0.98] hover:shadow-xl hover:shadow-[#132B25]/25 transition-all duration-200 shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating...
                </span>
              ) : (
                'Update password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
