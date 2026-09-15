// PropertyEase — Analytics
// ────────────────────────
// Wraps Vercel Analytics + custom business events.
// See monitoring/analytics-setup.md for the contract.

import { track } from '@vercel/analytics';

// ── Bucketing helpers (no PII, just ranges) ──────────────────────
const rentBand = (amount: number): string => {
  if (amount < 2000) return 'under_2k';
  if (amount < 4000) return '2k_4k';
  if (amount < 6000) return '4k_6k';
  if (amount < 10000) return '6k_10k';
  return 'over_10k';
};

const amountBand = (amount: number): string => rentBand(amount);

// ── Event types — must match monitoring/analytics-setup.md ──────
export const analytics = {
  // Auth
  signupCompleted: (source: string) => track('signup_completed', { source }),
  login: (method: 'email' | 'google' | 'github') => track('login', { method }),

  // Core entities
  propertyCreated: (type: string) => track('property_created', { type }),
  propertyUpdated: (id: string) => track('property_updated', { id_prefix: id.slice(0, 6) }),
  unitCreated: (bedrooms: number) => track('unit_created', { bedrooms }),
  tenantCreated: () => track('tenant_created'),
  leaseSigned: (months: number, rentQar: number) =>
    track('lease_signed', { months, rent_band: rentBand(rentQar) }),
  paymentRecorded: (amountQar: number, method: string) =>
    track('payment_recorded', { amount_band: amountBand(amountQar), method }),

  // Maintenance
  ticketOpened: (priority: string, category: string) =>
    track('maintenance_ticket_opened', { priority, category }),
  ticketResolved: (hours: number) =>
    track('maintenance_ticket_resolved', { hours_band: hours < 24 ? 'same_day' : hours < 168 ? 'within_week' : 'over_week' }),

  // Leads
  leadReceived: (source: string, unitId: string) =>
    track('lead_received', { source, unit_prefix: unitId.slice(0, 6) }),

  // AI
  copilotMessageSent: () => track('copilot_message_sent', {
    engine: process.env.NEXT_PUBLIC_ANALYTICS_ENGINE || 'unknown',
  }),
  copilotMessageReceived: (latencyMs: number) =>
    track('copilot_message_received', { latency_band: latencyMs < 1000 ? 'fast' : latencyMs < 3000 ? 'normal' : 'slow' }),

  // Eval (for the AI-OS)
  evalRun: (engine: string, aggregateScore: number) =>
    track('eval_run', { engine, score_band: aggregateScore >= 0.85 ? 'green' : aggregateScore >= 0.7 ? 'yellow' : 'red' }),
  evalRegression: (prompt: string, scoreDelta: number) =>
    track('eval_regression', { prompt, delta_band: scoreDelta <= -0.1 ? 'severe' : 'moderate' }),
};
