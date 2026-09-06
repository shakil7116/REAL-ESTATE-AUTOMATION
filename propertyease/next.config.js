/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  // Turbo mode for faster builds and SSR
  transpilePackages: [
    'react',
    'react-dom',
    'react-is',
    'scheduler',
    'lucide-react',
  ],

  // Compress responses
  compress: true,

  // Re-enable React StrictMode — catches real bugs (double-invocation, state mutations)
  reactStrictMode: true,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // Headers — API must never be cached immutably (was wiping views after deploy)
  async headers() {
    return [
      {
        // Hashed static assets are immutable for 1 year — the filename hash
        // is the cache buster, so a new deploy produces new filenames. This
        // is the Next.js recommended setting; previously set to `no-store`
        // which forced a revalidation round-trip on every chunk every nav
        // and caused ~10s page transitions.
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};

// Wrap with Sentry — uploads source maps automatically during `next build`
// See monitoring/sentry-setup.md
module.exports = withSentryConfig(nextConfig, {
  // Suppress warnings about Sentry SDK setup (DSN is optional; we init conditionally)
  org: process.env.SENTRY_ORG || 'propertyease',
  project: process.env.SENTRY_PROJECT || 'propertyease-web',
  suppressWarnings: true,
});
