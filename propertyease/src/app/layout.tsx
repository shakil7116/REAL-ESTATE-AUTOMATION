import type { Metadata } from 'next';
import './globals.css';
import ToastProvider from '@/lib/toast-provider';
import { CountryProvider } from '@/context/CountryContext';

export const metadata: Metadata = {
  title: 'PropertyEase - Smart Property Management for Qatar',
  description: 'PropertyEase is the #1 AI-powered property management platform in Qatar. Manage rent collection, maintenance, tenant support, and marketing from one dashboard. Trusted by 500+ property managers.',
  keywords: ['property management', 'real estate Qatar', 'rent management', 'tenant management', 'property software', 'Doha property management', 'Qatar property', 'property management software', 'rent collection', 'property ease', 'بروبرتي', 'إدارة عقارات'],
  authors: [{ name: 'PropertyEase' }],
  creator: 'PropertyEase',
  publisher: 'PropertyEase',
  robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
  alternates: {
    canonical: 'https://propertyease.qa',
    languages: {
      'en-US': 'https://propertyease.qa',
      'ar-AE': 'https://propertyease.qa/ar',
    },
    types: {
      'application/rss+xml': [
        { title: 'PropertyEase Blog', url: 'https://propertyease.qa/blog/rss' },
      ],
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://propertyease.qa',
    siteName: 'PropertyEase',
    title: 'PropertyEase - Smart Property Management for Qatar',
    description: 'AI-powered property management platform. Manage rent, maintenance, tenants & marketing from one dashboard. Free 3-day trial — no credit card required.',
    images: [
      {
        url: 'https://propertyease.qa/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PropertyEase Dashboard Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@propertyease',
    creator: '@propertyease',
    title: 'PropertyEase - Smart Property Management for Qatar',
    description: 'AI-powered property management platform. Manage rent, maintenance, tenants & marketing from one dashboard. Free 3-day trial.',
    images: ['https://propertyease.qa/og-image.jpg'],
  },
  verification: {
    google: 'your-google-site-verification',
    yandex: 'your-yandex-verification',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <head>
        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#132B25" />
        <meta name="msapplication-TileColor" content="#132B25" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PropertyEase" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="shortcut icon" href="/icon.svg" />

        {/* Preload fonts for faster text rendering */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

        {/* Note: lang and dir are handled entirely by components after mount
            to avoid hydration mismatches. No inline script here. */}
      </head>
      <body suppressHydrationWarning>
        <CountryProvider>
          {children}
          <ToastProvider />
        </CountryProvider>
        {/* PWA Service Worker Registration — v5 */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              // Force re-register every time to pick up sw.js version bumps
              navigator.serviceWorker.getRegistrations().then(regs => {
                Promise.all(regs.map(r => r.unregister())).catch(() => {});
              }).finally(() => {
                navigator.serviceWorker.register('/sw.js?v=5', { scope: '/' })
                  .then(reg => console.log('[SW] Registered v5:', reg.scope))
                  .catch(err => console.warn('[SW] Registration failed:', err));
              });
            });
          }
        `}} />
      </body>
    </html>
  );
}
