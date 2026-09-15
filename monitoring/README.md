# PropertyEase — Monitoring & Observability
# ──────────────────────────────────────────
# How we know when something is broken, who to call, and what to do.
# Engine-agnostic. The contracts in this folder define behavior, not tools.

```
monitoring/
├── README.md             ← you are here (the runbook)
├── sentry-setup.md       ← error tracking contract
├── analytics-setup.md    ← product analytics contract
└── alerts.md             ← what to alert on, who paged
```

## The three signals

We monitor three things. If you add a fourth, write a contract for it here.

1. **Errors (Sentry)** — code threw an exception in prod. A user hit a bug.
2. **Product analytics (Vercel Analytics)** — user behavior. What features
   get used, where do they drop off.
3. **LLM quality (eval harness)** — `npm run eval` against the active
   engine. See `evals/README.md`.

## Severity matrix

| Severity | Definition | Response | Example |
|---|---|---|---|
| **S0** | Data loss, security breach, payments broken | Page on-call immediately, hotfix within 1 hour | Auth bypass, double-charge |
| **S1** | Major feature broken for >10% of users | Fix within 4 hours, post-incident within 24h | Dashboard won't load, SW v4 bug |
| **S2** | Minor feature broken or major feature degraded | Fix within 1 business day | One form not saving |
| **S3** | Cosmetic, edge case, low-impact | Fix in next sprint | RTL layout off by 2px in one component |

## Alert routing

- **S0/S1:** page on-call (Sentry → PagerDuty), post in #incidents Slack
- **S2:** auto-create Linear issue, post in #engineering
- **S3:** auto-create Linear issue, no notification

## On-call

Until we're big enough to have a rotation, @devops is on-call 24/7.
Document your unavailability in the team calendar.

## Postmortem rule

Every S0 and S1 must have a postmortem written to
`memory/incidents/YYYY-MM-DD-slug.md` within 24 hours. The
postmortem must include the regression test that prevents the bug
from coming back.

## When you change monitoring

1. Update the contract file
2. Add a row to the relevant "Last updated" line
3. Write a `memory/decisions/` ADR if the change is non-trivial
4. Test the alert fires end-to-end before merging

---

**Last updated:** 2026-08-26
**Maintained by:** @devops
