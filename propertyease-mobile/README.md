# PropertyEase Mobile App (Expo + React Native)

Native iOS & Android app built with **Expo SDK 52**.

## What's Included

| Screen | File | Description |
|--------|------|-------------|
| Dashboard | `app/dashboard.tsx` | Stats cards, quick actions, health score, activity feed |
| Properties | `app/properties.tsx` | Property cards with search, type filter, status badges |
| Tenants | `app/tenants.tsx` | Tenant directory + lead pipeline with tabs |
| AI Copilot | `app/copilot.tsx` | Chat interface with portfolio pulse, quick prompts, demo responses |
| Settings | `app/settings.tsx` | Profile card, settings list, plan info, logout |
| Login | `app/login.tsx` | Email/password form + Google SSO button |
| Layout | `app/_layout.tsx` | Bottom tab navigation (Dashboard / Properties / Tenants / Copilot / Settings) |

## Tech Stack

- **Framework:** Expo SDK 52 · React Native 0.76
- **Navigation:** Expo Router (file-based)
- **State:** Zustand (ready to wire up)
- **Styling:** Native StyleSheet (brand colors centralized in `app/colors.ts`)
- **API:** Connects to PropertyEase Next.js backend

## Brand Colors (synced with web app)

```
Primary Dark Green : #132B25
Accent Coral       : #D97757
Workspace BG       : #F6F8F6
Success Green      : #10B981
Warning Amber      : #F59E0B
```

## Quick Start

```bash
cd propertyease-mobile
npm install
npx expo start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## Build for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build iOS (requires Apple Developer account)
eas build --platform ios

# Build Android
eas build --platform android --profile preview
```

## How It Connects to the Web App

The mobile app is designed to share the same API as the PropertyEase web app:

```typescript
// In production, replace mock data with real API calls:
const API_BASE = 'https://api.propertyease.ae'; // or your Vercel URL

// Example: fetch dashboard stats
const res = await fetch(`${API_BASE}/api/dashboard`);
const data = await res.json();
```

Both apps share:
- Same authentication (Supabase / NextAuth)
- Same REST API endpoints (`/api/properties`, `/api/tenants`, etc.)
- Same design system (colors, spacing, typography hierarchy)
