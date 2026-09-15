// ─────────────────────────────────────────────────────────────────────
// PropertyEase — Sentry client config
// Loaded by Next.js on the client. Initializes Sentry before any React
// code runs. See monitoring/sentry-setup.md for the contract.
// ─────────────────────────────────────────────────────────────────────

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NEXT_PUBLIC_VERCEL_ENV || 'development';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

    // Sample rates per monitoring/sentry-setup.md
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0,             // no session replay per contract
    replaysOnErrorSampleRate: 0,

    // Engine tag — helps debug LLM-related errors
    initialScope: {
      tags: {
        engine: process.env.ANTHROPIC_DEFAULT_OPUS_MODEL || 'unknown',
        country: 'QA',                       // v1 Qatar-only per ADR-002
        product: 'propertyease-web',
      },
    },

    // Strip PII before sending per contract
    beforeSend(event) {
      if (event.user) {
        // Strip identifiable fields, keep only opaque id
        event.user = { id: event.user.id };
      }
      if (event.request?.cookies) delete event.request.cookies;
      if (event.request?.data) {
        // Never send request bodies from prod
        if (ENVIRONMENT === 'production') {
          event.request.data = undefined;
        }
      }
      return event;
    },

    // Ignore noisy errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Network request failed',
      /^AbortError/,
    ],
  });
}
