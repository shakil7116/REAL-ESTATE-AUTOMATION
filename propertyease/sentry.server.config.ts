// ─────────────────────────────────────────────────────────────────────
// PropertyEase — Sentry server config
// Loaded by Next.js on the server. Captures API route errors, server
// actions, and unhandled exceptions in route handlers.
// ─────────────────────────────────────────────────────────────────────

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.VERCEL_ENV || 'development';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: process.env.VERCEL_GIT_COMMIT_SHA,

    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

    initialScope: {
      tags: {
        engine: process.env.ANTHROPIC_DEFAULT_OPUS_MODEL || 'unknown',
        country: 'QA',
        product: 'propertyease-web-server',
      },
    },

    beforeSendTransaction(event) {
      // Don't trace health checks, they pollute the dashboard
      if (event.transaction === 'GET /api/health') return null;
      return event;
    },

    beforeSend(event) {
      // Strip auth headers — they may contain JWTs
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      // Strip env values — agents may have logged them
      if (event.extra) {
        delete event.extra.env;
        delete event.extra.config;
      }
      return event;
    },
  });
}
