# ⚠️  DEPRECATED — DO NOT IMPLEMENT FROM THIS FILE

This file was written for an earlier **UAE-targeted** version of PropertyEase.
The active product is **Qatar-first** (per `CLAUDE.md` §2 and `memory/business.md`).

**Do not use this file as a design spec.** The currency (AED), market (UAE,
Dubai), and copy ("across the UAE and beyond") are wrong for v1.

**For the canonical style reference, see:**
- `docs/STYLE.md` (single source of truth for tokens, typography, layout, i18n)
- `memory/business.md` (brand identity, pricing tiers, voice)
- `contracts/prompts/*.md` (AI prompt contracts)

This file is kept in the repo for historical reference only. It will be removed
once the v1 landing page is built from the Qatar brand spec.

---

# PropertyEase — Landing Page Design Prompt (UAE — historical)

Copy-paste this into any AI design tool (Figma AI, Galileo AI, Midjourney, V0, etc.) to generate the exact landing page:

---

## Design Brief

**Product:** PropertyEase — a SaaS property management platform for the UAE & GCC market
**Brand Colors:**
- Primary Dark Green: `#132B25` (deep forest green, headers, nav, side panels)
- Accent Coral: `#D97757` (warm terracotta, CTAs, highlights)
- Workspace BG: `#F6F8F6` (off-white, section backgrounds)
- Text Dark: `#0D2A24`
- Success Green: `#22C55E`

**Typography:**
- Font: "Cairo" (Google Fonts) — modern Arabic/Latin geometric sans-serif
- Headings: Bold / Extra Bold, tight letter-spacing
- Body: Regular, 16px, line-height 1.6

**Direction:** English (LTR) by default; fully RTL-compatible (Arabic)

---

## Page Structure (Top → Bottom)

### 1. Navigation Bar
- Left: Logo — dark green rounded square with white "P" lettermark, next to "PropertyEase" in bold dark green text
- Center (desktop only): Links — Features, Pricing, How It Works, Testimonials
- Right: "Sign In" (text link, dark green), "Start Free Trial" (filled coral button, rounded-xl)
- Mobile: Hamburger menu icon; language toggle (EN/AR) visible at all sizes
- Style: White bg, subtle bottom border `#E2E8F0`, sticky on scroll

### 2. Hero Section (Full viewport height)
- **Background:** Auto-advancing slideshow (8-second intervals) of high-end property photography — modern villas, luxury apartments, commercial buildings, rooftop terraces. Photos should crossfade smoothly (2s transition).
- **Overlay:** Dark green gradient from bottom (60% opacity at top → 90% at bottom) so text is readable
- **Left-aligned content** (offset 80px from left):
  - Badge: Coral pill with white text "Now with AI Copilot ✨"
  - H1 (72px, extra bold, white): "Manage Every Property — Effortlessly"
  - Subtitle (20px, slate-300, 1.6 line-height): "From rent collection to maintenance, marketing to tenant communication. PropertyEase is the all-in-one platform built for modern property managers in the UAE and beyond."
  - Two CTAs side by side:
    - Primary: Coral button "Start Your Free Trial" (white text, shadow, hover: slightly darker coral)
    - Secondary: Glassmorphism button (white border, transparent bg, white text) "Watch Demo →"
  - Trust strip below CTAs: 4 small logos/icons (Supabase, Stripe, etc.) + "Trusted by 500+ property managers across the UAE"

- **Right side** (floating card, white bg, rounded-2xl, shadow-2xl, offset over the slideshow):
  - Mini dashboard preview: 3 stat cards (Occupancy 93%, Rent Collected AED 2.4M, Active Tenants 147)
  - Below: A small property card mockup with tenant avatar, unit number, rent amount

### 3. Stats Bar
- Full-width dark green bar (`#132B25`)
- 4 stat items in a row, evenly spaced:
  - "500+" with label "Properties Managed"
  - "12,000+" with label "Units Tracked"
  - "AED 2M+" with label "Monthly Rent"
  - "93%" with label "Average Occupancy"
- Each stat: large white bold number (36px), smaller grey label below (14px)
- Thin coral divider line between each stat

### 4. How It Works (3 Steps)
- Section bg: `#F6F8F6`
- Section title (centered, dark green, 40px bold): "Get Started in 3 Minutes"
- Subtitle (centered, slate-500): "No setup fees. No contracts. Just sign up and start managing."
- 3 cards in a row:
  - **Step 1** (large coral number "01" watermark): "Answer a Few Questions" — "Tell us about your portfolio. We personalize your dashboard automatically."
  - **Step 2** (coral "02"): "Start Your Free Trial" — "3 full days, no credit card. Explore every feature risk-free."
  - **Step 3** (coral "03"): "Manage Everything" — "Rent collection, maintenance, tenants, marketing — all in one place."
- Card style: White bg, rounded-2xl, subtle shadow, hover lifts up 4px

### 5. Features Grid (2×3 or 3×2)
- Section title (dark green, 40px bold): "Everything You Need to Run Your Portfolio"
- 6 feature cards in a grid, each with:
  - Colored icon circle (coral or dark green variant)
  - Feature name (bold, dark green)
  - Short description (slate-500)
  - Features: AI Tenant Support, Smart Marketing, PDC Check Tracking, Maintenance Dispatch, Multi-Property Dashboard, Mobile App
- Card style: White bg, rounded-2xl, left border accent in coral (4px), hover: shadow increase

### 6. Property Types Showcase
- Section title: "Built for Every Property Type"
- 4 cards in a row with property photos as backgrounds (dark overlay + white text):
  - Residential — Apartments, Villas, Townhouses
  - Commercial — Offices, Retail, Warehouses
  - Mixed-Use — Residential + Commercial
  - Hospitality — Hotels, Serviced Apartments
- Card style: Rounded-2xl, aspect-ratio 4:3, gradient overlay, white text centered

### 7. Pricing Section
- 3 pricing cards side by side, centered:
  - **Starter (Free)**: AED 0/month — up to 10 units, basic dashboard
  - **Growth (Popular)**: AED 299/month — up to 50 units, AI chatbot, marketing tools — highlight with coral border and "RECOMMENDED" badge
  - **Enterprise**: AED 799/month — unlimited units, full AI Copilot, priority support
- Each card: white bg, rounded-2xl, shadow, feature list with checkmark icons
- CTA button on each card (coral for Growth, outlined for others)

### 8. Testimonials
- 3 testimonial cards in a row
- Each: quote text (italic, slate-600), author name (bold, dark green), role/company (small, slate-400), 5-star rating (coral stars), small avatar circle
- Section bg: white, alternating with `#F6F8F6`

### 9. Final CTA
- Full-width gradient section (dark green to slightly lighter green)
- Centered content:
  - H2 (white, 48px bold): "Ready to Transform Your Property Management?"
  - Subtitle (white/70%): "Join 500+ property managers who saved an average of 15 hours per week."
  - Single coral CTA button: "Start Your Free Trial — No Credit Card Required"
- Decorative floating property illustration or abstract geometric shapes in coral at 20% opacity

---

## Animation & Interaction Notes

- **Hero slideshow:** Crossfade between 5–6 high-quality property photos every 8 seconds
- **Scroll animations:** Each section fades in (opacity 0 → 1) as it enters viewport (Intersection Observer)
- **Buttons:** Hover scale 1.02, shadow deepens
- **Cards:** Hover lift 4px with enhanced shadow
- **Progress bar** on onboarding: thin coral line that fills as user progresses through steps
- **Micro-interactions:** Number counters animate (count up) when stats section scrolls into view

---

## Image Specifications

Use these Unsplash photo IDs for the hero slideshow (high-end residential/commercial properties):
1. `photo-1600596542815` — Modern luxury villa exterior
2. `photo-1600585154340` — Contemporary home facade
3. `photo-1600607687939` — Elegant interior living space
4. `photo-1600566753190` — Premium apartment building
5. `photo-1600047509807` — Modern residential complex
6. `photo-1600573472550` — Luxury property exterior at dusk

Image aspect ratio: 16:9, min 1920px wide, WebP format, lazy-loaded.

---

## Tech Stack (for implementation reference)

- **Framework:** Next.js 14 App Router
- **Styling:** Tailwind CSS with custom config (dark green + coral tokens)
- **Icons:** lucide-react
- **Animations:** Framer Motion (optional) or pure CSS keyframes
- **Slideshow:** CSS animation with `object-fit: cover`, opacity crossfade
- **Fonts:** Google Fonts — Cairo (variable weight 300–900)

---

## Key Design Principles

1. **Confidence through design** — Dark green = trust & stability; coral = action & warmth
2. **Local first** — Arabic RTL support from day one, UAE-specific copy (AED, Dubai examples)
3. **Social proof everywhere** — Stats, testimonials, trust badges throughout
4. **Risk reversal** — "No credit card required" messaging in every CTA area
5. **Clarity over cleverness** — Every section communicates one clear value proposition
