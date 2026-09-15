# PropertyEase — Environment Variables
# ──────────────────────────────────────
# Source of truth for every env var in the project. Update this file
# whenever you add, remove, or rename a variable. Per-app examples:
# - `.env.example` (web, root)
# - `propertyease/.env.example` (Next.js specifics)
# - `propertyease-mobile/.env.example` (Expo specifics, when added)

## Quick start

1. Copy `.env.example` (root) to `.env.local`
2. Copy `propertyease/.env.example` to `propertyease/.env.local`
3. Fill in the values below
4. Restart dev servers

NEVER commit `.env*` files. The pre-commit hook blocks them.

## Engine / LLM

| Var | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | Yes (dev) | `minimax-m3-free` | LLM engine for complex reasoning |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | No | `minimax-m3-free` | LLM engine for balanced tasks |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | No | `minimax-m3-free` | LLM engine for fast/cheap tasks |
| `ANTHROPIC_BASE_URL` | No | (empty) | Proxy URL if routing via third party |
| `ANTHROPIC_AUTH_TOKEN` | Yes (if BASE_URL set) | (empty) | Auth token for the proxy |
| `PE_EVAL_STUB` | No | `0` | Set `1` to run `/eval` without real LLM calls (CI) |

**Note:** Per ADR-002 and `memory/sw-v5-cache-fix.md`, do NOT change the
service worker version query string without explicit user approval.

## Database (Supabase / Postgres)

| Var | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string (e.g. from your Supabase dashboard) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (web/mobile) | `https://PROJECT.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes (web/mobile) | Public anon key, safe in client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Bypasses RLS. NEVER expose to client. |

**Bootstrap procedure:** see `memory/decisions/001-prisma-as-source-of-truth.md`.
Use `npx prisma db push` against the Supabase URL, not the old `supabase-schema.sql`.

## NextAuth

| Var | Required | Description |
|---|---|---|
| `NEXTAUTH_URL` | Yes | `http://localhost:3000` (dev) or `https://propertyease.qa` (prod) |
| `NEXTAUTH_SECRET` | Yes | Random 32+ char string. Generate: `openssl rand -base64 32` |

## OpenAI (production AI features)

| Var | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes (prod) | Used by Copilot, ad-copy, lead-scoring |

## Email (Resend)

| Var | Required | Description |
|---|---|---|
| `RESEND_API_KEY` | Yes (prod) | Free tier: 100 emails/day |
| `RESEND_FROM` | No | Default sender, e.g. `hello@propertyease.qa` |

## File Uploads (Cloudinary)

| Var | Required | Description |
|---|---|---|
| `CLOUDINARY_CLOUD_NAME` | Yes (prod) | |
| `CLOUDINARY_API_KEY` | Yes (prod) | |
| `CLOUDINARY_API_SECRET` | Yes (prod) | |

## Ad Platforms (Meta + Google)

| Var | Required | Description |
|---|---|---|
| `META_ACCESS_TOKEN` | Yes (if running ads) | Facebook/Instagram Ads API |
| `META_AD_ACCOUNT_ID` | Yes (if running ads) | |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Yes (if running Google Ads) | |
| `GOOGLE_ADS_CLIENT_ID` | Yes (if running Google Ads) | |
| `GOOGLE_ADS_CLIENT_SECRET` | Yes (if running Google Ads) | |

## App info (public, exposed to client)

| Var | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | `PropertyEase` | |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `en` | |
| `NEXT_PUBLIC_CURRENCY` | `QAR` | Per ADR-002: Qatar-only v1 |
| `NEXT_PUBLIC_DOMAIN` | `propertyease.qa` | |

## MCP tokens (consumed by `.mcp.json`)

| Var | Used by | Description |
|---|---|---|
| `GITHUB_TOKEN` | github MCP | Personal access token for PR/issue automation |
| `VERCEL_TOKEN` | vercel MCP | Deploy + env-var management |
| `LINEAR_API_KEY` | linear MCP | Backlog management |

## Local dev stubs

For local dev without a real Supabase project, you can use:

For local dev without a real Supabase project, run `npx supabase start` and use the generated URL from `.supabase/.temp/.env`.

## Rotation policy

- `NEXTAUTH_SECRET` — rotate every 90 days
- `SUPABASE_SERVICE_ROLE_KEY` — rotate every 90 days, requires re-deploy
- `OPENAI_API_KEY` — rotate every 180 days
- `RESEND_API_KEY` — rotate every 180 days
- `ANTHROPIC_AUTH_TOKEN` — rotate on engine swap (see `CLAUDE.md` §12)

## If a secret leaks

1. **Revoke it immediately** (provider dashboard)
2. Generate a new one
3. Update the secret in the production env (Vercel dashboard)
4. Force-redeploy
5. Write a `memory/incidents/YYYY-MM-DD-secret-leak.md` postmortem
6. Notify @devops

---

**Last updated:** 2026-08-26
**Maintained by:** @devops
