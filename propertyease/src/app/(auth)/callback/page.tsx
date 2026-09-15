'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      console.error('Auth error:', error, errorDescription);
      router.replace('/signup?auth_error=' + encodeURIComponent(errorDescription || error));
      return;
    }

    // Success — redirect to dashboard
    router.replace('/dashboard');
  }, [searchParams, router]);

  return null;
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-[#F6F8F6] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#D97757]/30 border-t-[#D97757] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Signing you in with Google...</p>
      </div>
      <Suspense fallback={null}>
        <CallbackInner />
      </Suspense>
    </div>
  );
}
