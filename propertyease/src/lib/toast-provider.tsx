// ─── Client-only Toaster to avoid hydration SSR mismatch ─────────────────────
'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#132B25',
          color: '#fff',
          fontWeight: '600',
          fontSize: '13px',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        },
        success: {
          iconTheme: { primary: '#10B981', secondary: '#fff' },
        },
        error: {
          style: { background: '#DC2626' },
          iconTheme: { primary: '#fff', secondary: '#DC2626' },
        },
      }}
    />
  );
}
