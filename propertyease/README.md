# PropertyEase 🏢

**Smart Property Management SaaS for the Middle East**

Manage properties, tenants, payments, maintenance, and advertising — all from one bilingual dashboard.

## Features

- 🏢 **Property Management** — Manage 50+ properties with unit tracking
- 👥 **Tenant Management** — Full tenant profiles and lead pipeline
- 💰 **Payment Tracking** — PDC cheques, bank transfers, cash payments
- 🔧 **Maintenance** — Ticket system with team assignment
- 📢 **Ad Integration** — Meta & Google Ads tracking with ROI reporting
- 🌐 **Bilingual** — Full Arabic/English support with RTL
- 📱 **Mobile-First** — Works on any device, anywhere
- 🤖 **AI-Powered** — Tenant chatbot, lead scoring, ad generation

## Tech Stack

- **Frontend:** Next.js 14 + Tailwind CSS
- **Database:** PostgreSQL (Prisma ORM)
- **Auth:** NextAuth.js
- **AI:** OpenAI API
- **Hosting:** Vercel (free tier)

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Dev Server Notes

- **First request to a new route is slow** (30–60s on Windows). Next.js dev
  compiles each route on demand. Subsequent requests are fast.
- **If port 3000 is already taken**, a stale process is binding it. Find and kill it:
  ```bash
  # Git Bash on Windows — find PID
  netstat -ano | grep ":3000.*LISTENING"
  # then kill it (use PowerShell, not Git Bash, to avoid flag parsing issues)
  powershell -Command "Stop-Process -Id <PID> -Force"
  ```
- **The home page (`/`) is the only route that compiles quickly**. Use it
  to verify the server is up before testing other routes.
- **`.env.local` is not committed** — it holds live Supabase + auth secrets.
  See `docs/ENV.md` for what each variable does.

## Deployment

```bash
# Deploy to Vercel (recommended)
npx vercel

# Or connect your GitHub repo to Vercel for auto-deploy
```

## Project Structure

```
propertyease/
├── prisma/           # Database schema
├── src/
│   ├── app/          # Next.js App Router pages
│   │   ├── (dashboard)/  # Dashboard layout group
│   │   │   ├── dashboard/
│   │   │   ├── properties/
│   │   │   ├── units/
│   │   │   ├── tenants/
│   │   │   ├── payments/
│   │   │   └── ...
│   │   ├── page.tsx  # Login page
│   │   └── layout.tsx
│   ├── components/   # Reusable components
│   └── lib/          # Utilities (i18n, prisma, etc.)
├── .env.example      # Environment variables template
└── package.json
```

## License

Private — PropertyEase
