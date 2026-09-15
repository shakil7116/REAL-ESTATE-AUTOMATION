// ─────────────────────────────────────────────────────────────────────
// PropertyEase — Sentry edge runtime config
// For middleware and edge API routes. Minimal — edge can't do much.
// ─────────────────────────────────────────────────────────────────────

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.VERCEL_ENV || 'development';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.05 : 1.0,
    initialScope: {
      tags: {
        engine: process.env.ANTHROPIC_DEFAULT_OPUS_MODEL || 'unknown',
        product: 'propertyease-web-edge',
      },
    },
  });
}
