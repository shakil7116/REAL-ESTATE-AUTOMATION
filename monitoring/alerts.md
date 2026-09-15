# Alert Rules
# ───────────
# What fires, who it pages, and what to do.
# Engine-agnostic. These are behavioral rules, not vendor configs.

## S0 — Page on-call immediately

| Alert | Source | Condition | Response |
|---|---|---|---|
| Auth bypass | Sentry | Any successful login without valid session | Page @devops, hotfix in 1h |
| Payment double-charge | Stripe webhook log | Same payment_intent fired twice | Page @devops, refund + hotfix |
| Data exfiltration | Sentry / Vercel logs | Response payload > 10MB | Page @devops, investigate |
| Production DB unreachable | Sentry | All Supabase calls fail for >2 min | Page @devops + @backend-eng |

## S1 — Page within 4 hours

| Alert | Source | Condition | Response |
|---|---|---|---|
| Error rate > 1% | Sentry | > 1% of sessions errored in 5 min | Page @devops |
| Dashboard won't load | Sentry | `/dashboard` errored ≥ 10 times in 5 min | Page @frontend-eng + @devops |
| API route 5xx spike | Vercel Analytics | > 5% of API calls 5xx in 5 min | Page @backend-eng |
| SW v4 fallback regression | Sentry | Any `sw.js` reference with `?v<5` | Page @devops, see `memory/sw-v5-cache-fix.md` |
| Eval regression | `npm run eval` | Score drops ≥ 0.05 | Page @ai-eng |

## S2 — Auto-create Linear issue, no page

| Alert | Source | Condition | Response |
|---|---|---|---|
| New error type | Sentry | First-seen error | Linear issue, no notify |
| Slow API route | Vercel Analytics | p95 latency > 3s for 15 min | Linear issue, no notify |
| Memory note missing | CI | PR adds API route but no i18n keys | Block PR |
| Contract violation | CI | PR changes contract without ADR | Block PR |

## S3 — Backlog

- RTL layout off by ≤4px in one component
- Console warning in dev mode
- Deprecation warning from a library
- TypeScript `any` introduced
- TODO comment in new code (must convert to Linear issue)

## Manual alerts (someone notices)

- Customer support ticket
- Social media complaint
- Founder observation
- Competitor launched a feature we're missing

These are routed via the support inbox → @product-owner triages weekly.

## Alert de-duplication

- Same error type within 1 hour → 1 Slack message, not 100
- Use Sentry's "alert frequency" config
- Auto-resolve alerts when error stops firing for 30 min

## Suppressing alerts during deploy

Every deploy triggers a small error spike. To avoid noise:

- Mark deploys in Sentry (`release: <sha>`)
- Suppress alerts for 5 min after each deploy
- If a real S0 fires during deploy, the suppression doesn't apply

## When an alert is wrong (false positive)

1. Mark the alert as "resolved" in Sentry
2. Add a rule to silence it: `Sentry.setTag('known_issue', 'true')`
3. Write a follow-up to fix the root cause within 1 week
4. If the same false positive fires 3 times, rewrite the alert

## On-call rotation (when we have one)

- Primary: @devops
- Secondary: @backend-eng
- Manager: @product-owner
- Out-of-office: documented in team calendar

For v1 with 1 person, just @devops 24/7.

## Changelog

- **1.0.0** (2026-08-26) — Initial alert rules
