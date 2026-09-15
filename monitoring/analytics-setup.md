# Contract: Vercel Analytics + Product Telemetry
# ──────────────────────────────────────────────
# Version: 1.0.0
# Status: Accepted
# Last updated: 2026-08-26
# Owner: @product-owner

## Purpose

Track user behavior to answer business questions. NOT to spy on users,
NOT to sell data, NOT to do session replay. The goal is product insight:
which features are used, where do users drop off, are we hitting the
success metrics in `memory/business.md`.

## What we track

| Event | When | Properties |
|---|---|---|
| `signup_completed` | After successful signup | source, plan |
| `login` | After successful login | method (email/google/etc) |
| `property_created` | After property saved | property_type |
| `unit_created` | After unit saved | bedrooms |
| `lease_signed` | After lease created | duration_months, monthly_rent_band |
| `payment_recorded` | After payment saved | amount_band, method |
| `maintenance_ticket_opened` | After ticket created | priority, category |
| `maintenance_ticket_resolved` | After ticket closed | time_to_resolve_hours |
| `lead_received` | After lead captured | source, unit_id |
| `copilot_message_sent` | After user sends Copilot message | engine (LLM model) |
| `copilot_message_received` | After Copilot responds | latency_ms, score (if eval'd) |
| `eval_regression` | After /eval detects regression | prompt, score_delta |

## What we DO NOT track

- ❌ Page views (Vercel Analytics handles this automatically, no PII)
- ❌ Form field values (only submit events, with counts)
- ❌ Click coordinates or heatmaps (no session replay)
- ❌ Identifiable user data (always `userId` as opaque ID, never email)
- ❌ Any data subject to GDPR right-to-erasure complications (no IP)

## Required env vars

| Var | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_ANALYTICS_ID` | Yes (prod) | Vercel Analytics project ID |
| `NEXT_PUBLIC_POSTHOG_KEY` | No (v2) | PostHog for richer analytics later |

Vercel Analytics is enabled by default on Vercel deploys, so the
project ID is usually auto-set. Custom events need the `@vercel/analytics`
package's `track` function.

## Implementation

```typescript
// propertyease/src/lib/analytics.ts
import { track } from '@vercel/analytics';

export const analytics = {
  signupCompleted: (source: string) => track('signup_completed', { source }),
  propertyCreated: (type: string) => track('property_created', { type }),
  leaseSigned: (months: number, rentBand: string) =>
    track('lease_signed', { months, rentBand }),
  // ... etc
};
```

## Data warehouse (v2)

For v1, Vercel Analytics dashboard is enough. When we outgrow it (90+ days
post-launch), export to a warehouse via Vercel's BigQuery integration
and build dashboards in Metabase.

## Tests

- [ ] Each event fires on the right trigger
- [ ] No PII in any property value
- [ ] Events still fire when the user is offline (queue + retry)
- [ ] Sample rate is 100% for business events, 10% for perf traces

## Changelog

- **1.0.0** (2026-08-26) — Initial contract
