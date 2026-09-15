# Contract: Sentry Error Tracking
# ───────────────────────────────
# Version: 1.0.0
# Status: Accepted
# Last updated: 2026-08-26
# Owner: @devops

## Purpose

Every unhandled exception in production is captured by Sentry with
enough context to reproduce, root-cause, and fix it. This contract
defines what MUST be sent, what MUST NOT be sent, and the rules
for grouping, sampling, and alerting.

## Required env vars

| Var | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Yes (prod) | Public DSN for client-side |
| `SENTRY_DSN` | Yes (prod) | Server-side DSN |
| `SENTRY_AUTH_TOKEN` | Yes (CI) | For source-map upload |
| `SENTRY_ORG` | Yes (CI) | Org slug |
| `SENTRY_PROJECT` | Yes (CI) | Project slug |

In dev, leave DSN empty to disable Sentry.

## What MUST be captured

- ✅ Unhandled exceptions (try/catch that re-throws)
- ✅ Unhandled promise rejections
- ✅ React error boundary fallbacks
- ✅ Next.js API route errors
- ✅ 4xx and 5xx API responses (with envelope payload)
- ✅ Network failures calling Supabase / OpenAI
- ✅ Validation errors that escape zod

## What MUST NOT be captured

- ❌ User passwords, session tokens, JWT contents
- ❌ Credit card numbers, bank account numbers
- ❌ API keys or env values
- ❌ Tenant personal data (full name + email + phone)
- ❌ Payment amounts tied to a specific user (aggregate is OK)
- ❌ Request bodies in production (sample at 0% by default)

Sentry's `beforeSend` hook is the choke point. It MUST scrub PII.

## Sample rates

- **Traces:** 10% in prod, 100% in staging, 100% in dev
- **Sessions:** 100% in prod
- **Errors:** 100% (every error counted)

## Tagging

Every event MUST include:

```typescript
Sentry.setTag('locale', locale);            // 'en' | 'ar'
Sentry.setTag('engine', ENGINE_NAME);       // from .claude/settings.json
Sentry.setTag('country', 'QA');             // v1: always QA
Sentry.setTag('plan', user?.plan);          // 'starter' | 'growth' | 'enterprise' | 'free'
Sentry.setTag('release', process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA);
```

## Alert rules

| Rule | Severity | Action |
|---|---|---|
| Any S0 error | PagerDuty page | @devops on-call |
| Same error ≥ 10 times in 5 min | Slack #incidents | @devops |
| New error type (first-seen) | Slack #engineering | Linear issue auto-created |
| Error rate > 1% of sessions | Slack #incidents | @devops |
| Eval score drops > 0.05 | Slack #ai-eng | @ai-eng |

## Source maps

CI must upload source maps on every release:

```yaml
# .github/workflows/ci.yml (add this step)
- name: Upload Sentry source maps
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  uses: getsentry/sentry-action@v1
  with:
    auth_token: ${{ secrets.SENTRY_AUTH_TOKEN }}
    org: ${{ secrets.SENTRY_ORG }}
    project: ${{ secrets.SENTRY_PROJECT }}
    release: ${{ github.sha }}
```

## Files this contract requires

- `propertyease/sentry.client.config.ts` — client init
- `propertyease/sentry.server.config.ts` — server init
- `propertyease/sentry.edge.config.ts` — edge runtime init
- `propertyease/next.config.js` — withSentryConfig wrapper

## Tests

- [ ] Triggering a test exception in dev sends an event to local Sentry
- [ ] `beforeSend` strips all PII fields
- [ ] Sample rate in dev = 100%, in prod = 10% for traces
- [ ] Tagging fires on every event

## Changelog

- **1.0.0** (2026-08-26) — Initial contract
