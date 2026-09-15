// ==========================================
// DATABASE LAYER — Supabase + persistent fallback
// ==========================================
// - Supabase when valid env is present (sync guard, no race)
// - Fallback: globalThis memory (survives HMR) + JSON file on disk + localStorage sync
//   so data NEVER vanishes on reload, HMR, or serverless restart.
// ==========================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ensureRichDemoData } from './seed';
// NOTE: 'fs' and 'path' must NOT be top-level imports here — they crash
// webpack on the client side. Any file-system access is done via dynamic
// require() inside Server Components / API routes only.

// ── Supabase — synchronous env guard (no async race) ──
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));

// Startup banner — makes the active backend impossible to miss.
// This prevents the 2026-09-08 incident (stale Supabase data silently served
// while fallback.json edits appeared to do nothing) from recurring.
// If you see "[PropertyEase] Mode: SUPABASE" during local dev, remove
// NEXT_PUBLIC_SUPABASE_URL from .env.local and restart.
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  console.log(
    `[PropertyEase] Mode: ${hasSupabaseEnv ? 'SUPABASE (live DB)' : 'FALLBACK (local .data/fallback.json)'}`,
    hasSupabaseEnv ? `(url: ${supabaseUrl.slice(0, 32)}…)` : '',
  );
}

// Lazily create client only when env is valid — prevents createClient('', '') crash
let _supabase: SupabaseClient | null = null;
export const supabase: SupabaseClient = (() => {
  if (hasSupabaseEnv) {
    try { _supabase = createClient(supabaseUrl, supabaseAnonKey); } catch { _supabase = null; }
  }
  // dummy client that always errors — withFallback will then use local fallback
  if (!_supabase) {
    const emptyErr = () => ({ data: null, error: { message: 'no supabase' } } as any);
    const emptyErrConfig = () => ({ data: null, error: { message: 'supabase not configured' } } as any);
    _supabase = {
      from() {
        return {
          select() {
            return {
              order() { return Promise.resolve(emptyErrConfig()); },
              eq() { return this as any; },
              limit() { return Promise.resolve(emptyErr()); },
              single() { return Promise.resolve(emptyErr()); },
              then(r: any) { return Promise.resolve(emptyErr()).then(r); },
            } as any;
          },
          insert() {
            return {
              select() {
                return { single() { return Promise.resolve(emptyErr()); } } as any;
              },
            } as any;
          },
          update() {
            return {
              eq() {
                return {
                  select() {
                    return { single() { return Promise.resolve(emptyErr()); } } as any;
                  },
                } as any;
              },
            } as any;
          },
          delete() {
            return {
              eq() { return Promise.resolve({ error: { message: 'no supabase' } } as any); },
            } as any;
          },
        } as any;
      }
    } as unknown as SupabaseClient;
  }
  return _supabase;
})();

const useSupabase = hasSupabaseEnv;

// ==========================================
// TYPES (matches database schema)
// ==========================================

export interface Property {
  id: string;
  name: string;
  name_ar?: string | null;
  address: string;
  address_ar?: string | null;
  city: string;
  country: string;
  property_type: 'residential' | 'commercial' | 'mixed';
  total_units: number;
  description?: string | null;
  description_ar?: string | null;
  status: 'active' | 'under_renovation' | 'inactive';
  monthly_maintenance_fee?: number | null;
  images?: string[];
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  floor?: number | null;
  floor_label?: string | null;   // "Basement" | "Ground" | "1st Floor" | "Penthouse" | ...
  bedrooms: number;
  bathrooms: number;
  living_rooms?: number | null;
  kitchens?: number | null;
  has_maid_room?: boolean | null;
  has_driver_room?: boolean | null;
  balconies?: number | null;
  parking_spaces?: number | null;
  has_storage?: boolean | null;
  area_sqft?: number | null;
  monthly_rent: number;
  security_deposit?: number | null;
  furnishing: 'unfurnished' | 'semi_furnished' | 'fully_furnished';
  status: 'vacant' | 'occupied' | 'maintenance' | 'reserved';
  description?: string | null;
  description_ar?: string | null;
  amenities: string[];
  images?: string[];
  created_at: string;
  updated_at: string;
  property?: Property;
}

export interface Tenant {
  id: string;
  name: string;
  name_ar?: string | null;
  email?: string | null;
  phone: string;
  phone2?: string | null;
  id_type?: string | null;
  id_number?: string | null;
  nationality?: string | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;
  company?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lease {
  id: string;
  lease_number: string;
  tenant_id: string;
  unit_id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  payment_day: number;
  payment_method: 'pdc' | 'bank_transfer' | 'cash' | 'online';
  security_deposit: number;
  status: 'active' | 'expired' | 'terminated' | 'pending_renewal';
  contract_url?: string | null;
  special_terms?: string | null;
  created_at: string;
  updated_at: string;
  tenant?: Tenant;
  unit?: Unit;
}

export interface Payment {
  id: string;
  lease_id: string;
  tenant_id: string;
  amount: number;
  payment_date: string | null;
  due_date: string;
  payment_type: 'rent' | 'security_deposit' | 'maintenance_fee' | 'late_fee' | 'other';
  payment_method: 'pdc' | 'bank_transfer' | 'cash' | 'online';
  cheque_number?: string | null;
  cheque_date?: string | null;
  bank_reference?: string | null;
  status: 'pending' | 'received' | 'overdue' | 'bounced' | 'cancelled';
  notes?: string | null;
  created_at: string;
  updated_at: string;
  tenant?: Tenant;
  lease?: Lease;
}

export interface MaintenanceTicket {
  id: string;
  ticket_number: string;
  unit_id: string;
  tenant_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string | null;
  status: 'open' | 'in_progress' | 'waiting_parts' | 'completed' | 'cancelled';
  images: string[];
  resolution?: string | null;
  resolution_images: string[];
  estimated_cost?: number | null;
  actual_cost?: number | null;
  scheduled_date?: string | null;
  completed_date?: string | null;
  assigned_to_id?: string | null;
  created_at: string;
  updated_at: string;
  unit?: Unit;
  tenant?: Tenant;
}

export interface Lead {
  id: string;
  name: string;
  name_ar?: string | null;
  phone: string;
  email?: string | null;
  source: 'direct' | 'phone_call' | 'whatsapp' | 'meta_ads' | 'google_ads' | 'bayut' | 'property_finder' | 'referral' | 'other';
  source_detail?: string | null;
  property_interest?: string | null;
  budget?: number | null;
  status: 'new' | 'contacted' | 'interested' | 'visited' | 'negotiating' | 'converted' | 'lost';
  notes?: string | null;
  contacted_at?: string | null;
  visited_at?: string | null;
  converted_at?: string | null;
  tenant_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdCampaign {
  id: string;
  name: string;
  platform: 'meta' | 'google' | 'bayut' | 'property_finder' | 'local_agency';
  campaign_id_external?: string | null;
  start_date: string;
  end_date?: string | null;
  budget: number;
  spent: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  target_audience?: string | null;
  objective?: string | null;
  created_at: string;
  updated_at: string;
}

// ==========================================
// PAYOUTS
// ==========================================

export interface OwnerPayout {
  id: string;
  property_id: string;
  amount: number;
  payout_date: string;
  period: string; // e.g. "July 2024"
  method: 'pdc' | 'bank_transfer' | 'cash' | 'online';
  cheque_number?: string | null;
  bank_reference?: string | null;
  status: 'pending' | 'sent' | 'cleared' | 'bounced' | 'cancelled';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// ==========================================
// MAINTENANCE TASKS
// ==========================================

export interface MaintenanceTask {
  id: string;
  title: string;
  description?: string | null;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  next_due_date: string;
  last_completed?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==========================================
// AD METRICS
// ==========================================

export interface AdMetric {
  id: string;
  campaign_id: string;
  date: string;
  impressions: number;
  clicks: number;
  leads: number;
  cost: number;
  cpc?: number | null;
  cpl?: number | null;
  conversions: number;
  created_at: string;
}

// ==========================================
// ACTIVITY LOG
// ==========================================

export interface Activity {
  id: string;
  action: string; // 'created', 'updated', 'deleted', etc.
  entity: string; // 'property', 'unit', 'tenant', etc.
  entity_id: string;
  details?: string | null; // JSON with changes
  user_id: string;
  created_at: string;
}

// ==========================================
// STORAGE — globalThis + file + localStorage
// Survives HMR, survives soft-restart, never wipes to default.
// ==========================================

const LS_PREFIX = 'propertyease_';

type FallbackBundle = {
  properties: Property[];
  units: Unit[];
  tenants: Tenant[];
  leases: Lease[];
  payments: Payment[];
  maintenance: MaintenanceTicket[];
  leads: Lead[];
  ad_campaigns: AdCampaign[];
  owner_payouts: OwnerPayout[];
  maintenance_tasks: MaintenanceTask[];
  ad_metrics: AdMetric[];
  activities: Activity[];
  users?: any[];
};

const EMPTY_BUNDLE: FallbackBundle = {
  properties: [], units: [], tenants: [], leases: [], payments: [], maintenance: [], leads: [], ad_campaigns: [],
  owner_payouts: [], maintenance_tasks: [], ad_metrics: [], activities: [],
};

// ── Activity feed seed ─────────────────────────────────────────────────
// The disk fallback (`fallback.json`) ships with an empty `activities`
// array, but the dashboard's "Recent activity" panel needs SOMETHING to
// show on first render. Rather than rely on mutating the gitignored
// JSON file (fragile — see `memory/incidents/2025-08-15-cache-fallback-bug.md`
// for the UTF-8 corruption pitfall on Windows), we keep a static backfill
// here in TypeScript source. UTF-8 safe, git-tracked, recoverable.
//
// Each entry references a REAL seed entity (Al Mansura / Asmaco / Pearl
// / Thumama tenants, units, leases, tickets). No fictional property
// names. `details` is JSON-stringified per the Activity interface.
//
// Idempotency: applied at bundle-load time when the loaded activities
// list is empty. Once any real activity is logged via `logActivity()`,
// the list is non-empty and the seed is never reapplied.
const SEED_ACTIVITIES: Activity[] = [
  { id: 'act-001', action: 'payment_received', entity: 'payment', entity_id: 'pay-008',
    details: JSON.stringify({ amount: 13500, tenant: 'Hiroshi Tanaka', unit: 'P-1402', property: 'The Pearl Residences' }),
    user_id: 'system', created_at: '2025-08-15T09:00:00.000Z' },
  { id: 'act-002', action: 'maintenance_created', entity: 'maintenance', entity_id: 'mt-004',
    details: JSON.stringify({ title: 'Elevator making grinding noise', unit: 'B-201', property: 'Al Mansura Complex', priority: 'urgent' }),
    user_id: 'system', created_at: '2025-08-27T08:00:00.000Z' },
  { id: 'act-003', action: 'lease_signed', entity: 'lease', entity_id: 'l-010',
    details: JSON.stringify({ tenant: 'Khalid Al-Mansoori', unit: 'P-1502', property: 'The Pearl Residences', term_months: 12 }),
    user_id: 'system', created_at: '2025-05-25T08:00:00.000Z' },
  { id: 'act-004', action: 'lead_created', entity: 'lead', entity_id: 'ld-004',
    details: JSON.stringify({ name: 'Fatima H.', interest: '2BR, Al Mansura', source: 'Walk-in' }),
    user_id: 'system', created_at: '2025-08-27T09:00:00.000Z' },
  { id: 'act-005', action: 'payment_overdue', entity: 'payment', entity_id: 'pay-006',
    details: JSON.stringify({ amount: 7800, tenant: 'Priya Sharma', unit: '303', property: 'Asmaco Residence', reason: 'PDC returned' }),
    user_id: 'system', created_at: '2025-08-15T07:00:00.000Z' },
  { id: 'act-006', action: 'maintenance_completed', entity: 'maintenance', entity_id: 'mt-005',
    details: JSON.stringify({ title: 'Bathroom exhaust fan noisy', unit: '202', property: 'Asmaco Residence', resolution: 'Tightened mounting bracket' }),
    user_id: 'system', created_at: '2025-08-15T16:00:00.000Z' },
  { id: 'act-007', action: 'payment_received', entity: 'payment', entity_id: 'pay-009',
    details: JSON.stringify({ amount: 18000, tenant: 'Doha Boutique LLC', unit: 'R-001', property: 'The Pearl Residences' }),
    user_id: 'system', created_at: '2025-08-01T12:00:00.000Z' },
  { id: 'act-008', action: 'lease_renewed', entity: 'lease', entity_id: 'l-002',
    details: JSON.stringify({ tenant: 'Mariam Al-Kuwari', unit: 'A-102', property: 'Al Mansura Complex' }),
    user_id: 'system', created_at: '2025-02-20T09:00:00.000Z' },
  { id: 'act-009', action: 'maintenance_created', entity: 'maintenance', entity_id: 'mt-002',
    details: JSON.stringify({ title: 'Kitchen sink blocked', unit: '303', property: 'Asmaco Residence', priority: 'medium' }),
    user_id: 'system', created_at: '2025-08-26T14:00:00.000Z' },
  { id: 'act-010', action: 'lead_converted', entity: 'lead', entity_id: 'ld-005',
    details: JSON.stringify({ name: 'Chen W.', property: 'The Pearl Residences', signed_lease: 'l-009' }),
    user_id: 'system', created_at: '2025-05-20T09:00:00.000Z' },
];

// globalThis singleton — survives Next.js HMR where module state would reset
declare global {
  // eslint-disable-next-line no-var
  var __PE_FALLBACK__: FallbackBundle | undefined;
  // eslint-disable-next-line no-var
  var __PE_FILE_LOADED__: boolean | undefined;
  // eslint-disable-next-line no-var
  var __PE_LAST_LOAD__: number | undefined;
}

// Time threshold: re-read from disk every 5 seconds to pick up file changes
const DISK_RELOAD_INTERVAL_MS = 5000;

function getBundle(): FallbackBundle {
  const now = Date.now();
  // TEMP: log to trace disk reload in dev
  if (typeof process !== 'undefined') {
  }
  // Re-read from disk every DISK_RELOAD_INTERVAL_MS on server side
  // This ensures API routes (different process from debug/reset) pick up fresh data
  if (typeof window === 'undefined' && typeof process !== 'undefined') {
    const lastLoad = (globalThis as any).__PE_LAST_LOAD__ as number | undefined;
    const needsReload = !lastLoad || (now - lastLoad) > DISK_RELOAD_INTERVAL_MS;
    if (needsReload) {
      (globalThis as any).__PE_LAST_LOAD__ = now;
      try {
        // Resolve fallback.json — CWD varies by worker: could be project root
        // (real estete automation) or the subdirectory (propertyease).
        // Check both parents and children to cover all cases.
        const cwd = process.cwd();
        const pj = require('path').join;
        const fs  = require('fs');
        const candidates = [
          pj(cwd, '.data', 'fallback.json'),       // cwd is propertyease/
          pj(cwd, 'propertyease', '.data', 'fallback.json'), // cwd is repo root
          pj(__dirname, '..', '.data', 'fallback.json'),     // __dirname near src/lib/
          pj(__dirname, '..', '..', '.data', 'fallback.json'), // deeper nesting
        ];
        let file = '';
        for (const c of candidates) {
          const e = fs.existsSync(c);
          if (e) { file = c; break; }
        }
        if (file) {
          const raw = fs.readFileSync(file, 'utf8');
          const parsed = JSON.parse(raw) as Partial<FallbackBundle>;
          const hasAny = parsed.properties?.length || parsed.units?.length || parsed.tenants?.length;
          if (hasAny) {
            globalThis.__PE_FALLBACK__ = {
              properties: (parsed.properties as Property[]) || [],
              units: (parsed.units as Unit[]) || [],
              tenants: (parsed.tenants as Tenant[]) || [],
              leases: (parsed.leases as Lease[]) || [],
              payments: (parsed.payments as Payment[]) || [],
              maintenance: (parsed.maintenance as MaintenanceTicket[]) || [],
              leads: (parsed.leads as Lead[]) || [],
              ad_campaigns: (parsed.ad_campaigns as AdCampaign[]) || [],
              owner_payouts: (parsed.owner_payouts as OwnerPayout[]) || [],
              maintenance_tasks: (parsed.maintenance_tasks as MaintenanceTask[]) || [],
              ad_metrics: (parsed.ad_metrics as AdMetric[]) || [],
              // Backfill activities from the static seed if the disk bundle
              // shipped with an empty list. Idempotent — never overrides
              // existing entries.
              activities: ((parsed.activities as Activity[]) || []).length
                ? ((parsed.activities as Activity[]) || [])
                : [...SEED_ACTIVITIES],
            };
            return globalThis.__PE_FALLBACK__;
          }
        }
      } catch { /* ignore — keep existing bundle */ }
    }
  }
  if (!globalThis.__PE_FALLBACK__) globalThis.__PE_FALLBACK__ = { ...EMPTY_BUNDLE, properties: [...EMPTY_BUNDLE.properties], units: [...EMPTY_BUNDLE.units], tenants: [...EMPTY_BUNDLE.tenants], leases: [...EMPTY_BUNDLE.leases], payments: [...EMPTY_BUNDLE.payments], maintenance: [...EMPTY_BUNDLE.maintenance], leads: [...EMPTY_BUNDLE.leads], ad_campaigns: [...EMPTY_BUNDLE.ad_campaigns], owner_payouts: [...EMPTY_BUNDLE.owner_payouts], maintenance_tasks: [...EMPTY_BUNDLE.maintenance_tasks], ad_metrics: [...EMPTY_BUNDLE.ad_metrics], activities: [...EMPTY_BUNDLE.activities] };
  // On browser, also merge localStorage if memory is empty (first load after API wrote nothing)
  if (typeof window !== 'undefined') {
    const b = globalThis.__PE_FALLBACK__!;
    const isEmpty = !b.properties.length && !b.units.length && !b.tenants.length;
    if (isEmpty) {
      try {
        const p = localStorage.getItem(LS_PREFIX + 'properties');
        if (p) {
          const arr = JSON.parse(p);
          if (Array.isArray(arr) && arr.length) b.properties = arr;
        }
        const u = localStorage.getItem(LS_PREFIX + 'units'); if (u) { const a = JSON.parse(u); if (Array.isArray(a) && a.length) b.units = a; }
        const t = localStorage.getItem(LS_PREFIX + 'tenants'); if (t) { const a = JSON.parse(t); if (Array.isArray(a) && a.length) b.tenants = a; }
        const l = localStorage.getItem(LS_PREFIX + 'leases'); if (l) { const a = JSON.parse(l); if (Array.isArray(a) && a.length) b.leases = a; }
        const pay = localStorage.getItem(LS_PREFIX + 'payments'); if (pay) { const a = JSON.parse(pay); if (Array.isArray(a) && a.length) b.payments = a; }
        const m = localStorage.getItem(LS_PREFIX + 'maintenance'); if (m) { const a = JSON.parse(m); if (Array.isArray(a) && a.length) b.maintenance = a; }
        const ld = localStorage.getItem(LS_PREFIX + 'leads'); if (ld) { const a = JSON.parse(ld); if (Array.isArray(a) && a.length) b.leads = a; }
        const camp = localStorage.getItem(LS_PREFIX + 'ad_campaigns'); if (camp) { const a = JSON.parse(camp); if (Array.isArray(a) && a.length) b.ad_campaigns = a; }
        const po = localStorage.getItem(LS_PREFIX + 'owner_payouts'); if (po) { const a = JSON.parse(po); if (Array.isArray(a) && a.length) b.owner_payouts = a; }
        const mt = localStorage.getItem(LS_PREFIX + 'maintenance_tasks'); if (mt) { const a = JSON.parse(mt); if (Array.isArray(a) && a.length) b.maintenance_tasks = a; }
        const am = localStorage.getItem(LS_PREFIX + 'ad_metrics'); if (am) { const a = JSON.parse(am); if (Array.isArray(a) && a.length) b.ad_metrics = a; }
        const act = localStorage.getItem(LS_PREFIX + 'activities'); if (act) { const a = JSON.parse(act); if (Array.isArray(a) && a.length) b.activities = a; }
      } catch { /* ignore */ }
    }
  }
  return globalThis.__PE_FALLBACK__!;
}

function persistBundle() {
  const b = getBundle();
  // client: localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LS_PREFIX + 'properties', JSON.stringify(b.properties));
      localStorage.setItem(LS_PREFIX + 'units', JSON.stringify(b.units));
      localStorage.setItem(LS_PREFIX + 'tenants', JSON.stringify(b.tenants));
      localStorage.setItem(LS_PREFIX + 'leases', JSON.stringify(b.leases));
      localStorage.setItem(LS_PREFIX + 'payments', JSON.stringify(b.payments));
      localStorage.setItem(LS_PREFIX + 'maintenance', JSON.stringify(b.maintenance));
      localStorage.setItem(LS_PREFIX + 'leads', JSON.stringify(b.leads));
      localStorage.setItem(LS_PREFIX + 'ad_campaigns', JSON.stringify(b.ad_campaigns));
      localStorage.setItem(LS_PREFIX + 'owner_payouts', JSON.stringify(b.owner_payouts));
      localStorage.setItem(LS_PREFIX + 'maintenance_tasks', JSON.stringify(b.maintenance_tasks));
      localStorage.setItem(LS_PREFIX + 'ad_metrics', JSON.stringify(b.ad_metrics));
      localStorage.setItem(LS_PREFIX + 'activities', JSON.stringify(b.activities));
    } catch { /* quota or SSR */ }
  }
  // server: JSON file (best-effort, try multiple plausible locations)
  if (typeof window !== 'undefined' || typeof process === 'undefined') return;
  try {
    const fs = require('fs');
    const path = require('path');
    const cwd = process.cwd();
    const targets = [
      path.join(cwd, 'propertyease', '.data'),   // cwd = repo root
      path.join(cwd, '.data'),                   // cwd = propertyease/
    ];
    for (const dir of targets) {
      const file = path.join(dir, 'fallback.json');
      if (fs.existsSync(dir)) {
        fs.writeFileSync(file, JSON.stringify(b), 'utf8');
        return;
      }
    }
  } catch { /* ignore */ }
}

// convenience accessors
function getPropertiesStorage(): Property[] { return getBundle().properties; }
function setPropertiesStorage(data: Property[]) { getBundle().properties = data; persistBundle(); }
function getUnitsStorage(): Unit[] { return getBundle().units; }
function setUnitsStorage(data: Unit[]) { getBundle().units = data; persistBundle(); }
function getTenantsStorage(): Tenant[] { return getBundle().tenants; }
function setTenantsStorage(data: Tenant[]) { getBundle().tenants = data; persistBundle(); }
function getLeasesStorage(): Lease[] { return getBundle().leases; }
function setLeasesStorage(data: Lease[]) { getBundle().leases = data; persistBundle(); }
function getPaymentsStorage(): Payment[] { return getBundle().payments; }
function setPaymentsStorage(data: Payment[]) { getBundle().payments = data; persistBundle(); }
function getMaintenanceStorage(): MaintenanceTicket[] { return getBundle().maintenance; }
function setMaintenanceStorage(data: MaintenanceTicket[]) { getBundle().maintenance = data; persistBundle(); }
function getLeadsStorage(): Lead[] { return getBundle().leads; }
function setLeadsStorage(data: Lead[]) { getBundle().leads = data; persistBundle(); }
function getAdCampaignsStorage(): AdCampaign[] { return getBundle().ad_campaigns; }
function setAdCampaignsStorage(data: AdCampaign[]) { getBundle().ad_campaigns = data; persistBundle(); }
function getOwnerPayoutsStorage(): OwnerPayout[] { return getBundle().owner_payouts; }
function setOwnerPayoutsStorage(data: OwnerPayout[]) { getBundle().owner_payouts = data; persistBundle(); }
function getMaintenanceTasksStorage(): MaintenanceTask[] { return getBundle().maintenance_tasks; }
function setMaintenanceTasksStorage(data: MaintenanceTask[]) { getBundle().maintenance_tasks = data; persistBundle(); }
function getAdMetricsStorage(): AdMetric[] { return getBundle().ad_metrics; }
function setAdMetricsStorage(data: AdMetric[]) { getBundle().ad_metrics = data; persistBundle(); }
function getActivitiesStorage(): Activity[] { return getBundle().activities; }
function setActivitiesStorage(data: Activity[]) { getBundle().activities = data; persistBundle(); }

function generateId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') return (crypto as any).randomUUID();
  } catch { /* fallback */ }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ==========================================
// HELPER: Try Supabase first, fall back to memory/file
// Validates Supabase response — if it errored or returned empty unexpectedly, use fallback.
// ==========================================

async function withFallback<T>(
  supabaseFn: () => Promise<T>,
  fallbackFn: () => T,
): Promise<T> {
  if (!useSupabase) return fallbackFn();
  try {
    const result: any = await supabaseFn();
    // Supabase errors come as { error } — treat as fallback instead of crashing
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      return fallbackFn();
    }
    // If Supabase returned null/undefined data for a list, use fallback
    if (result == null) return fallbackFn();
    // If it's { data: ... } wrapper, unwrap — but we already return data above
    return result as T;
  } catch {
    return fallbackFn();
  }
}

// wrap Supabase list calls so withFallback receives raw data not {data,error}
async function sbList<T>(fn: () => Promise<{ data: T | null; error: any }>, fallback: T): Promise<T> {
  if (!useSupabase) return fallback;
  try {
    const { data, error } = await fn();
    if (error) return fallback;
    // Supabase returns { data: [] } when table is empty — treat as "no result" and use fallback
    if (Array.isArray(data) && data.length === 0) return fallback;
    return (data as T) ?? fallback;
  } catch { return fallback; }
}

// supabaseDataOk — returns false for null/undefined/empty-array (all mean "nothing in DB")
function supabaseDataOk<T>(data: T | null): data is T {
  if (data == null) return false;
  if (Array.isArray(data)) return data.length > 0;
  return true;
}

// ==========================================
// PROPERTIES
// ==========================================

export async function getProperties(): Promise<Property[]> {
  if (!useSupabase) return getPropertiesStorage();
  return sbList(() => (supabase.from('properties').select('*').order('created_at', { ascending: false }) as any), getPropertiesStorage());
}

export async function getProperty(id: string): Promise<Property | null> {
  if (!useSupabase) return getPropertiesStorage().find(p => p.id === id) ?? null;
  try {
    const { data, error } = await (supabase.from('properties').select('*').eq('id', id).single() as any);
    if (error || !supabaseDataOk(data)) return getPropertiesStorage().find(p => p.id === id) ?? null;
    return data as Property;
  } catch { return getPropertiesStorage().find(p => p.id === id) ?? null; }
}

export async function createProperty(property: Partial<Property>): Promise<Property> {
  const now = new Date().toISOString();
  const newProperty: Property = {
    id: generateId(),
    name: property.name ?? '',
    name_ar: property.name_ar ?? null,
    address: property.address ?? '',
    address_ar: property.address_ar ?? null,
    city: property.city ?? '',
    country: property.country ?? 'Qatar',
    property_type: property.property_type ?? 'residential',
    total_units: property.total_units ?? 0,
    description: property.description ?? null,
    description_ar: property.description_ar ?? null,
    status: property.status ?? 'active',
    monthly_maintenance_fee: property.monthly_maintenance_fee ?? null,
    images: property.images ?? [],
    created_at: now,
    updated_at: now,
  };

  if (!useSupabase) {
    setPropertiesStorage([...getPropertiesStorage(), newProperty]);
    return newProperty;
  }
  try {
    const { data, error } = await (supabase.from('properties').insert(newProperty).select().single() as any);
    if (error) throw error;
    if (data?.id) newProperty.id = data.id;
    // also keep fallback in sync
    setPropertiesStorage([...getPropertiesStorage(), newProperty]);
    return newProperty;
  } catch {
    setPropertiesStorage([...getPropertiesStorage(), newProperty]);
    return newProperty;
  }
}

export async function updateProperty(id: string, updates: Partial<Property>): Promise<Property> {
  if (!useSupabase) {
    const list = getPropertiesStorage();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Property not found');
    const updated: Property = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    list[idx] = updated;
    setPropertiesStorage([...list]);
    return updated;
  }
  try {
    const { data, error } = await (supabase.from('properties').update(updates).eq('id', id).select().single() as any);
    if (error) throw error;
    // sync fallback
    const list = getPropertiesStorage(); const idx = list.findIndex(p=>p.id===id);
    if (idx !== -1) { list[idx] = data as Property; setPropertiesStorage([...list]); }
    return data as Property;
  } catch {
    const list = getPropertiesStorage();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Property not found');
    const updated: Property = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    list[idx] = updated;
    setPropertiesStorage([...list]);
    return updated;
  }
}

export async function deleteProperty(id: string): Promise<void> {
  if (!useSupabase) {
    setPropertiesStorage(getPropertiesStorage().filter(p => p.id !== id));
    setUnitsStorage(getUnitsStorage().filter(u => u.property_id !== id));
    return;
  }
  try { await (supabase.from('properties').delete().eq('id', id) as any); } catch { /* ignore */ }
  setPropertiesStorage(getPropertiesStorage().filter(p => p.id !== id));
  setUnitsStorage(getUnitsStorage().filter(u => u.property_id !== id));
}

// ==========================================
// UNITS
// ==========================================

export async function getUnits(propertyId?: string): Promise<Unit[]> {
  if (!useSupabase) {
    const all = getUnitsStorage();
    if (propertyId) return all.filter(u => u.property_id === propertyId);
    return all;
  }
  try {
    let query: any = supabase.from('units').select('*, property:properties(*)').order('created_at', { ascending: false });
    if (propertyId) query = query.eq('property_id', propertyId);
    const { data, error } = await query;
    if (error || !supabaseDataOk(data)) {
      const all = getUnitsStorage();
      return propertyId ? all.filter(u => u.property_id === propertyId) : all;
    }
    return data as Unit[];
  } catch {
    const all = getUnitsStorage();
    return propertyId ? all.filter(u => u.property_id === propertyId) : all;
  }
}

export async function createUnit(unit: Partial<Unit>): Promise<Unit> {
  const now = new Date().toISOString();
  const newUnit: Unit = {
    id: generateId(),
    property_id: unit.property_id ?? '',
    unit_number: unit.unit_number ?? '',
    floor: unit.floor ?? null,
    floor_label: unit.floor_label ?? null,
    bedrooms: unit.bedrooms ?? 0,
    bathrooms: unit.bathrooms ?? 1,
    living_rooms: unit.living_rooms ?? 0,
    kitchens: unit.kitchens ?? 1,
    has_maid_room: unit.has_maid_room ?? false,
    has_driver_room: unit.has_driver_room ?? false,
    balconies: unit.balconies ?? 0,
    parking_spaces: unit.parking_spaces ?? 0,
    has_storage: unit.has_storage ?? false,
    area_sqft: unit.area_sqft ?? null,
    monthly_rent: Number(unit.monthly_rent) || 0,
    security_deposit: unit.security_deposit ?? null,
    furnishing: unit.furnishing ?? 'unfurnished',
    status: unit.status ?? 'vacant',
    description: unit.description ?? null,
    description_ar: unit.description_ar ?? null,
    amenities: unit.amenities ?? [],
    created_at: now,
    updated_at: now,
  };

  if (!useSupabase) { setUnitsStorage([...getUnitsStorage(), newUnit]); return newUnit; }
  try {
    const { data, error } = await (supabase.from('units').insert(newUnit).select('*, property:properties(*)').single() as any);
    if (error) throw error;
    if (data?.id) newUnit.id = data.id;
    setUnitsStorage([...getUnitsStorage(), newUnit]);
    return data ? (data as Unit) : newUnit;
  } catch { setUnitsStorage([...getUnitsStorage(), newUnit]); return newUnit; }
}

export async function updateUnit(id: string, updates: Partial<Unit>): Promise<Unit> {
  if (!useSupabase) {
    const list = getUnitsStorage();
    const idx = list.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('Unit not found');
    const updated: Unit = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    list[idx] = updated;
    setUnitsStorage([...list]);
    return updated;
  }
  try {
    const { data, error } = await (supabase.from('units').update(updates).eq('id', id).select('*, property:properties(*)').single() as any);
    if (error) throw error;
    const list = getUnitsStorage(); const idx = list.findIndex(u=>u.id===id); if(idx!==-1){ list[idx]=data as Unit; setUnitsStorage([...list]);}
    return data as Unit;
  } catch {
    const list = getUnitsStorage();
    const idx = list.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('Unit not found');
    const updated: Unit = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    list[idx] = updated;
    setUnitsStorage([...list]);
    return updated;
  }
}

export async function deleteUnit(id: string): Promise<void> {
  if (!useSupabase) { setUnitsStorage(getUnitsStorage().filter(u => u.id !== id)); return; }
  try { await (supabase.from('units').delete().eq('id', id) as any); } catch {}
  setUnitsStorage(getUnitsStorage().filter(u => u.id !== id));
}

// ==========================================
// TENANTS
// ==========================================

export async function getTenants(): Promise<Tenant[]> {
  const bundle = getBundle();
  if (!useSupabase) return getTenantsStorage();
  return sbList(() => (supabase.from('tenants').select('*').order('created_at', { ascending: false }) as any), getTenantsStorage());
}

export async function createTenant(tenant: Partial<Tenant>): Promise<Tenant> {
  const now = new Date().toISOString();
  const newTenant: Tenant = {
    id: generateId(),
    name: tenant.name ?? '',
    name_ar: tenant.name_ar ?? null,
    email: tenant.email ?? null,
    phone: tenant.phone ?? '',
    phone2: tenant.phone2 ?? null,
    id_type: tenant.id_type ?? null,
    id_number: tenant.id_number ?? null,
    nationality: tenant.nationality ?? null,
    emergency_contact: tenant.emergency_contact ?? null,
    emergency_phone: tenant.emergency_phone ?? null,
    company: tenant.company ?? null,
    notes: tenant.notes ?? null,
    created_at: now,
    updated_at: now,
  };
  if (!useSupabase) { setTenantsStorage([...getTenantsStorage(), newTenant]); return newTenant; }
  try {
    const { data, error } = await (supabase.from('tenants').insert(newTenant).select().single() as any);
    if (error) throw error;
    if (data?.id) newTenant.id = data.id;
    setTenantsStorage([...getTenantsStorage(), newTenant]);
    return newTenant;
  } catch { setTenantsStorage([...getTenantsStorage(), newTenant]); return newTenant; }
}

export async function updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant> {
  if (!useSupabase) {
    const list = getTenantsStorage();
    const idx = list.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Tenant not found');
    const updated: Tenant = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    list[idx] = updated;
    setTenantsStorage([...list]);
    return updated;
  }
  try {
    const { data, error } = await (supabase.from('tenants').update(updates).eq('id', id).select().single() as any);
    if (error) throw error;
    const list = getTenantsStorage(); const idx=list.findIndex(t=>t.id===id); if(idx!==-1){ list[idx]=data as Tenant; setTenantsStorage([...list]);}
    return data as Tenant;
  } catch {
    const list = getTenantsStorage();
    const idx = list.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Tenant not found');
    const updated: Tenant = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    list[idx] = updated;
    setTenantsStorage([...list]);
    return updated;
  }
}

export async function deleteTenant(id: string): Promise<void> {
  if (!useSupabase) { setTenantsStorage(getTenantsStorage().filter(t => t.id !== id)); return; }
  try { await (supabase.from('tenants').delete().eq('id', id) as any); } catch {}
  setTenantsStorage(getTenantsStorage().filter(t => t.id !== id));
}

// ==========================================
// LEASES
// ==========================================

export async function getLeases(): Promise<Lease[]> {
  if (!useSupabase) return getLeasesStorage();
  try {
    const { data, error } = await (supabase.from('leases').select('*, tenant:tenants(*), unit:units(*, property:properties(*))').order('created_at', { ascending: false }) as any);
    if (error || !supabaseDataOk(data)) return getLeasesStorage();
    return data as Lease[];
  } catch { return getLeasesStorage(); }
}

export async function createLease(lease: Partial<Lease>): Promise<Lease> {
  const now = new Date().toISOString();
  const newLease: Lease = {
    id: generateId(),
    lease_number: `LEASE-${Date.now().toString().slice(-6)}`,
    tenant_id: lease.tenant_id ?? '',
    unit_id: lease.unit_id ?? '',
    start_date: lease.start_date ?? now,
    end_date: lease.end_date ?? now,
    monthly_rent: Number(lease.monthly_rent) || 0,
    payment_day: lease.payment_day ?? 1,
    payment_method: lease.payment_method ?? 'pdc',
    security_deposit: Number(lease.security_deposit) || 0,
    status: lease.status ?? 'active',
    contract_url: lease.contract_url ?? null,
    special_terms: lease.special_terms ?? null,
    created_at: now,
    updated_at: now,
  };
  if (!useSupabase) { setLeasesStorage([...getLeasesStorage(), newLease]); return newLease; }
  try {
    const { data, error } = await (supabase.from('leases').insert(newLease).select().single() as any);
    if (error) throw error;
    if (data?.id) newLease.id = data.id;
    setLeasesStorage([...getLeasesStorage(), newLease]);
    return newLease;
  } catch { setLeasesStorage([...getLeasesStorage(), newLease]); return newLease; }
}

export async function updateLease(id: string, updates: Partial<Lease>): Promise<Lease> {
  if (!useSupabase) {
    const list = getLeasesStorage();
    const idx = list.findIndex(l => l.id === id);
    if (idx === -1) throw new Error('Lease not found');
    const updated: Lease = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    list[idx] = updated;
    setLeasesStorage([...list]);
    return updated;
  }
  try {
    const { data, error } = await (supabase.from('leases').update(updates).eq('id', id).select().single() as any);
    if (error) throw error;
    const list=getLeasesStorage(); const idx=list.findIndex(l=>l.id===id); if(idx!==-1){ list[idx]=data as Lease; setLeasesStorage([...list]);}
    return data as Lease;
  } catch {
    const list = getLeasesStorage();
    const idx = list.findIndex(l => l.id === id);
    if (idx === -1) throw new Error('Lease not found');
    const updated: Lease = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    list[idx] = updated;
    setLeasesStorage([...list]);
    return updated;
  }
}

export async function deleteLease(id: string): Promise<void> {
  if (!useSupabase) { setLeasesStorage(getLeasesStorage().filter(l => l.id !== id)); return; }
  try { await (supabase.from('leases').delete().eq('id', id) as any); } catch {}
  setLeasesStorage(getLeasesStorage().filter(l => l.id !== id));
}

// ==========================================
// PAYMENTS
// ==========================================

export async function getPayments(): Promise<Payment[]> {
  if (!useSupabase) return getPaymentsStorage();
  try {
    const { data, error } = await (supabase.from('payments').select('*, tenant:tenants(*), lease:leases(*)').order('created_at', { ascending: false }) as any);
    if (error || !supabaseDataOk(data)) return getPaymentsStorage();
    return data as Payment[];
  } catch { return getPaymentsStorage(); }
}

export async function createPayment(payment: Partial<Payment>): Promise<Payment> {
  const now = new Date().toISOString();
  const newPayment: Payment = {
    id: generateId(),
    lease_id: payment.lease_id ?? '',
    tenant_id: payment.tenant_id ?? '',
    amount: Number(payment.amount) || 0,
    payment_date: payment.payment_date ?? now,
    due_date: payment.due_date ?? now,
    payment_type: payment.payment_type ?? 'rent',
    payment_method: payment.payment_method ?? 'pdc',
    cheque_number: payment.cheque_number ?? null,
    cheque_date: payment.cheque_date ?? null,
    bank_reference: payment.bank_reference ?? null,
    status: payment.status ?? 'pending',
    notes: payment.notes ?? null,
    created_at: now,
    updated_at: now,
  };
  if (!useSupabase) { setPaymentsStorage([...getPaymentsStorage(), newPayment]); return newPayment; }
  try {
    const { data, error } = await (supabase.from('payments').insert(newPayment).select().single() as any);
    if (error) throw error;
    if (data?.id) newPayment.id = data.id;
    setPaymentsStorage([...getPaymentsStorage(), newPayment]);
    return newPayment;
  } catch { setPaymentsStorage([...getPaymentsStorage(), newPayment]); return newPayment; }
}

export async function updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
  if (!useSupabase) {
    const list = getPaymentsStorage();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Payment not found');
    const updated: Payment = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    list[idx] = updated;
    setPaymentsStorage([...list]);
    return updated;
  }
  try {
    const { data, error } = await (supabase.from('payments').update(updates).eq('id', id).select().single() as any);
    if (error) throw error;
    const list=getPaymentsStorage(); const idx=list.findIndex(p=>p.id===id); if(idx!==-1){ list[idx]=data as Payment; setPaymentsStorage([...list]);}
    return data as Payment;
  } catch {
    const list = getPaymentsStorage();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Payment not found');
    const updated: Payment = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    list[idx] = updated;
    setPaymentsStorage([...list]);
    return updated;
  }
}

export async function deletePayment(id: string): Promise<void> {
  if (!useSupabase) { setPaymentsStorage(getPaymentsStorage().filter(p => p.id !== id)); return; }
  try { await (supabase.from('payments').delete().eq('id', id) as any); } catch {}
  setPaymentsStorage(getPaymentsStorage().filter(p => p.id !== id));
}

// ==========================================
// MAINTENANCE TICKETS
// ==========================================

export async function getMaintenanceTickets(): Promise<MaintenanceTicket[]> {
  if (!useSupabase) return getMaintenanceStorage();
  try {
    const { data, error } = await (supabase.from('maintenance_tickets').select('*, unit:units(*, property:properties(*)), tenant:tenants(*)').order('created_at', { ascending: false }) as any);
    if (error || !supabaseDataOk(data)) return getMaintenanceStorage();
    return data as MaintenanceTicket[];
  } catch { return getMaintenanceStorage(); }
}

export async function createMaintenanceTicket(ticket: Partial<MaintenanceTicket>): Promise<MaintenanceTicket> {
  const now = new Date().toISOString();
  const newTicket: MaintenanceTicket = {
    id: generateId(),
    ticket_number: `MT-${Date.now().toString().slice(-6)}`,
    unit_id: ticket.unit_id ?? '',
    tenant_id: ticket.tenant_id ?? '',
    title: ticket.title ?? '',
    description: ticket.description ?? '',
    priority: ticket.priority ?? 'medium',
    category: ticket.category ?? null,
    status: ticket.status ?? 'open',
    images: ticket.images ?? [],
    resolution: ticket.resolution ?? null,
    resolution_images: ticket.resolution_images ?? [],
    estimated_cost: ticket.estimated_cost ?? null,
    actual_cost: ticket.actual_cost ?? null,
    scheduled_date: ticket.scheduled_date ?? null,
    completed_date: ticket.completed_date ?? null,
    assigned_to_id: ticket.assigned_to_id ?? null,
    created_at: now,
    updated_at: now,
  };
  if (!useSupabase) { setMaintenanceStorage([...getMaintenanceStorage(), newTicket]); return newTicket; }
  try {
    const { data, error } = await (supabase.from('maintenance_tickets').insert(newTicket).select('*, unit:units(*, property:properties(*)), tenant:tenants(*)').single() as any);
    if (error) throw error;
    if (data?.id) newTicket.id = data.id;
    setMaintenanceStorage([...getMaintenanceStorage(), newTicket]);
    return newTicket;
  } catch { setMaintenanceStorage([...getMaintenanceStorage(), newTicket]); return newTicket; }
}

export async function updateMaintenanceTicket(id: string, updates: Partial<MaintenanceTicket>): Promise<MaintenanceTicket> {
  if (!useSupabase) {
    const list = getMaintenanceStorage();
    const idx = list.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Ticket not found');
    const updated: MaintenanceTicket = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    list[idx] = updated;
    setMaintenanceStorage([...list]);
    return updated;
  }
  try {
    const { data, error } = await (supabase.from('maintenance_tickets').update(updates).eq('id', id).select('*, unit:units(*, property:properties(*)), tenant:tenants(*)').single() as any);
    if (error) throw error;
    const list=getMaintenanceStorage(); const idx=list.findIndex(t=>t.id===id); if(idx!==-1){ list[idx]=data as MaintenanceTicket; setMaintenanceStorage([...list]);}
    return data as MaintenanceTicket;
  } catch {
    const list = getMaintenanceStorage();
    const idx = list.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Ticket not found');
    const updated: MaintenanceTicket = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    list[idx] = updated;
    setMaintenanceStorage([...list]);
    return updated;
  }
}

export async function deleteMaintenanceTicket(id: string): Promise<void> {
  if (!useSupabase) { setMaintenanceStorage(getMaintenanceStorage().filter(t => t.id !== id)); return; }
  try { await (supabase.from('maintenance_tickets').delete().eq('id', id) as any); } catch {}
  setMaintenanceStorage(getMaintenanceStorage().filter(t => t.id !== id));
}

// ==========================================
// LEADS
// ==========================================

export async function getLeads(): Promise<Lead[]> {
  if (!useSupabase) return getLeadsStorage();
  return sbList(() => (supabase.from('leads').select('*').order('created_at', { ascending: false }) as any), getLeadsStorage());
}

export async function createLead(lead: Partial<Lead>): Promise<Lead> {
  const now = new Date().toISOString();
  const newLead: Lead = {
    id: generateId(),
    name: lead.name ?? '',
    name_ar: lead.name_ar ?? null,
    phone: lead.phone ?? '',
    email: lead.email ?? null,
    source: lead.source ?? 'direct',
    source_detail: lead.source_detail ?? null,
    property_interest: lead.property_interest ?? null,
    budget: lead.budget ?? null,
    status: lead.status ?? 'new',
    notes: lead.notes ?? null,
    contacted_at: lead.contacted_at ?? null,
    visited_at: lead.visited_at ?? null,
    converted_at: lead.converted_at ?? null,
    tenant_id: lead.tenant_id ?? null,
    created_at: now,
    updated_at: now,
  };
  if (!useSupabase) { setLeadsStorage([...getLeadsStorage(), newLead]); return newLead; }
  try {
    const { data, error } = await (supabase.from('leads').insert(newLead).select().single() as any);
    if (error) throw error;
    if (data?.id) newLead.id = data.id;
    setLeadsStorage([...getLeadsStorage(), newLead]);
    return newLead;
  } catch { setLeadsStorage([...getLeadsStorage(), newLead]); return newLead; }
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
  if (!useSupabase) {
    const list = getLeadsStorage();
    const idx = list.findIndex(l => l.id === id);
    if (idx === -1) throw new Error('Lead not found');
    const updated: Lead = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    list[idx] = updated;
    setLeadsStorage([...list]);
    return updated;
  }
  try {
    const { data, error } = await (supabase.from('leads').update(updates).eq('id', id).select().single() as any);
    if (error) throw error;
    const list=getLeadsStorage(); const idx=list.findIndex(l=>l.id===id); if(idx!==-1){ list[idx]=data as Lead; setLeadsStorage([...list]);}
    return data as Lead;
  } catch {
    const list = getLeadsStorage();
    const idx = list.findIndex(l => l.id === id);
    if (idx === -1) throw new Error('Lead not found');
    const updated: Lead = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    list[idx] = updated;
    setLeadsStorage([...list]);
    return updated;
  }
}

export async function deleteLead(id: string): Promise<void> {
  if (!useSupabase) { setLeadsStorage(getLeadsStorage().filter(l => l.id !== id)); return; }
  try { await (supabase.from('leads').delete().eq('id', id) as any); } catch {}
  setLeadsStorage(getLeadsStorage().filter(l => l.id !== id));
}

// ==========================================
// AD CAMPAIGNS
// ==========================================

export async function getAdCampaigns(): Promise<AdCampaign[]> {
  if (!useSupabase) return getAdCampaignsStorage();
  return sbList(() => (supabase.from('ad_campaigns').select('*').order('created_at', { ascending: false }) as any), getAdCampaignsStorage());
}

export async function createAdCampaign(campaign: Partial<AdCampaign>): Promise<AdCampaign> {
  const now = new Date().toISOString();
  const newCampaign: AdCampaign = {
    id: generateId(),
    name: campaign.name ?? '',
    platform: campaign.platform ?? 'meta',
    campaign_id_external: campaign.campaign_id_external ?? null,
    start_date: campaign.start_date ?? now,
    end_date: campaign.end_date ?? null,
    budget: campaign.budget ?? 0,
    spent: campaign.spent ?? 0,
    status: campaign.status ?? 'active',
    target_audience: campaign.target_audience ?? null,
    objective: campaign.objective ?? null,
    created_at: now,
    updated_at: now,
  };
  if (!useSupabase) { setAdCampaignsStorage([...getAdCampaignsStorage(), newCampaign]); return newCampaign; }
  try {
    const { data, error } = await (supabase.from('ad_campaigns').insert(newCampaign).select().single() as any);
    if (error) throw error;
    if (data?.id) newCampaign.id = data.id;
    setAdCampaignsStorage([...getAdCampaignsStorage(), newCampaign]);
    return newCampaign;
  } catch { setAdCampaignsStorage([...getAdCampaignsStorage(), newCampaign]); return newCampaign; }
}

export async function updateAdCampaign(id: string, updates: Partial<AdCampaign>): Promise<AdCampaign> {
  if (!useSupabase) {
    const list = getAdCampaignsStorage();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Campaign not found');
    const updated: AdCampaign = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    list[idx] = updated;
    setAdCampaignsStorage([...list]);
    return updated;
  }
  try {
    const { data, error } = await (supabase.from('ad_campaigns').update(updates).eq('id', id).select().single() as any);
    if (error) throw error;
    const list=getAdCampaignsStorage(); const idx=list.findIndex(c=>c.id===id); if(idx!==-1){ list[idx]=data as AdCampaign; setAdCampaignsStorage([...list]);}
    return data as AdCampaign;
  } catch {
    const list = getAdCampaignsStorage();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Campaign not found');
    const updated: AdCampaign = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    list[idx] = updated;
    setAdCampaignsStorage([...list]);
    return updated;
  }
}

export async function deleteAdCampaign(id: string): Promise<void> {
  if (!useSupabase) { setAdCampaignsStorage(getAdCampaignsStorage().filter(c => c.id !== id)); return; }
  try { await (supabase.from('ad_campaigns').delete().eq('id', id) as any); } catch {}
  setAdCampaignsStorage(getAdCampaignsStorage().filter(c => c.id !== id));
}

// ==========================================
// DASHBOARD STATS
// ==========================================

export async function getDashboardStats() {
  const [properties, units, tenants, payments, tickets, leads] = await Promise.all([
    getProperties(),
    getUnits(),
    getTenants(),
    getPayments(),
    getMaintenanceTickets(),
    getLeads(),
  ]);

  const occupiedUnits = units.filter(u => u.status === 'occupied').length;
  const vacantUnits = units.filter(u => u.status === 'vacant').length;
  const totalRevenue = payments
    .filter(p => p.status === 'received')
    .reduce((sum, p) => sum + p.amount, 0);
  // `pendingPayments` is rendered as QAR currency on the dashboard, so it must
  // be the SUM of pending+overdue amounts — not a COUNT. Returning the count
  // formatted as currency produced "QAR 1".
  const pendingRentAmount = payments
    .filter(p => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0);
  const overdueCount = payments.filter(p => p.status === 'overdue').length;
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

  return {
    totalProperties: properties.length,
    totalUnits: units.length,
    occupiedUnits,
    vacantUnits,
    occupancyRate: units.length > 0 ? Math.round((occupiedUnits / units.length) * 100) : 0,
    totalRevenue,
    pendingPayments: pendingRentAmount,
    overduePayments: overdueCount,
    openTickets,
    totalLeads: leads.length,
    activeLeads: leads.filter(l => l.status !== 'converted' && l.status !== 'lost').length,
  };
}

// Re-export bundle helpers for seed
export function getFallbackBundle(): FallbackBundle { return getBundle(); }
export function setFallbackBundle(b: FallbackBundle) { globalThis.__PE_FALLBACK__ = b; persistBundle(); }
// ==========================================
// OWNER PAYOUTS
// ==========================================

export async function getOwnerPayouts(propertyId?: string): Promise<OwnerPayout[]> {
  if (!useSupabase) {
    let list = getOwnerPayoutsStorage();
    if (propertyId) list = list.filter((p: OwnerPayout) => p.property_id === propertyId);
    return list;
  }
  const list = await sbList(
    () => (supabase.from('owner_payouts').select('*').order('payout_date', { ascending: false }) as any),
    getOwnerPayoutsStorage(),
  );
  if (propertyId) return list.filter((p: OwnerPayout) => p.property_id === propertyId);
  return list;
}

export async function createOwnerPayout(data: Partial<OwnerPayout>): Promise<OwnerPayout> {
  const now = new Date().toISOString();
  const record: OwnerPayout = {
    id: generateId(),
    property_id: data.property_id ?? '',
    amount: data.amount ?? 0,
    payout_date: data.payout_date ?? now,
    period: data.period ?? '',
    method: data.method ?? 'bank_transfer',
    cheque_number: data.cheque_number ?? null,
    bank_reference: data.bank_reference ?? null,
    status: data.status ?? 'pending',
    notes: data.notes ?? null,
    created_at: now,
    updated_at: now,
  };
  if (!useSupabase) { setOwnerPayoutsStorage([...getOwnerPayoutsStorage(), record]); return record; }
  try {
    const { data: saved } = await (supabase.from('owner_payouts').insert(record).select().single() as any);
    if (saved?.id) record.id = saved.id;
    setOwnerPayoutsStorage([...getOwnerPayoutsStorage(), record]);
    return record;
  } catch { setOwnerPayoutsStorage([...getOwnerPayoutsStorage(), record]); return record; }
}

export async function updateOwnerPayout(id: string, updates: Partial<OwnerPayout>): Promise<OwnerPayout> {
  if (!useSupabase) {
    const list = getOwnerPayoutsStorage();
    const idx = list.findIndex((p: OwnerPayout) => p.id === id);
    if (idx === -1) throw new Error('Payout not found');
    const updated: OwnerPayout = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    list[idx] = updated;
    setOwnerPayoutsStorage([...list]);
    return updated;
  }
  try {
    const { data: saved } = await (supabase.from('owner_payouts').update(updates).eq('id', id).select().single() as any);
    return (saved ?? updates) as OwnerPayout;
  } catch {
    const list = getOwnerPayoutsStorage();
    const idx = list.findIndex((p: OwnerPayout) => p.id === id);
    if (idx === -1) throw new Error('Payout not found');
    const updated: OwnerPayout = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    list[idx] = updated;
    setOwnerPayoutsStorage([...list]);
    return updated;
  }
}

export async function deleteOwnerPayout(id: string): Promise<void> {
  if (!useSupabase) { setOwnerPayoutsStorage(getOwnerPayoutsStorage().filter(p => p.id !== id)); return; }
  try { await (supabase.from('owner_payouts').delete().eq('id', id) as any); } catch { /* ignore */ }
  setOwnerPayoutsStorage(getOwnerPayoutsStorage().filter(p => p.id !== id));
}

// ==========================================
// MAINTENANCE TASKS
// ==========================================

export async function getMaintenanceTasks(): Promise<MaintenanceTask[]> {
  if (!useSupabase) return getMaintenanceTasksStorage();
  return sbList(
    () => (supabase.from('maintenance_tasks').select('*').order('next_due_date') as any),
    getMaintenanceTasksStorage(),
  );
}

export async function createMaintenanceTask(data: Partial<MaintenanceTask>): Promise<MaintenanceTask> {
  const now = new Date().toISOString();
  const record: MaintenanceTask = {
    id: generateId(),
    title: data.title ?? '',
    description: data.description ?? null,
    frequency: data.frequency ?? 'monthly',
    next_due_date: data.next_due_date ?? now,
    last_completed: data.last_completed ?? null,
    is_active: data.is_active ?? true,
    created_at: now,
    updated_at: now,
  };
  if (!useSupabase) { setMaintenanceTasksStorage([...getMaintenanceTasksStorage(), record]); return record; }
  try {
    const { data: saved } = await (supabase.from('maintenance_tasks').insert(record).select().single() as any);
    if (saved?.id) record.id = saved.id;
    setMaintenanceTasksStorage([...getMaintenanceTasksStorage(), record]);
    return record;
  } catch { setMaintenanceTasksStorage([...getMaintenanceTasksStorage(), record]); return record; }
}

export async function updateMaintenanceTask(id: string, updates: Partial<MaintenanceTask>): Promise<MaintenanceTask> {
  if (!useSupabase) {
    const list = getMaintenanceTasksStorage();
    const idx = list.findIndex((t: MaintenanceTask) => t.id === id);
    if (idx === -1) throw new Error('Task not found');
    const updated: MaintenanceTask = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    list[idx] = updated;
    setMaintenanceTasksStorage([...list]);
    return updated;
  }
  try {
    const { data: saved } = await (supabase.from('maintenance_tasks').update(updates).eq('id', id).select().single() as any);
    return (saved ?? updates) as MaintenanceTask;
  } catch {
    const list = getMaintenanceTasksStorage();
    const idx = list.findIndex((t: MaintenanceTask) => t.id === id);
    if (idx === -1) throw new Error('Task not found');
    const updated: MaintenanceTask = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    list[idx] = updated;
    setMaintenanceTasksStorage([...list]);
    return updated;
  }
}

export async function deleteMaintenanceTask(id: string): Promise<void> {
  if (!useSupabase) { setMaintenanceTasksStorage(getMaintenanceTasksStorage().filter(t => t.id !== id)); return; }
  try { await (supabase.from('maintenance_tasks').delete().eq('id', id) as any); } catch { /* ignore */ }
  setMaintenanceTasksStorage(getMaintenanceTasksStorage().filter(t => t.id !== id));
}

// ==========================================
// AD METRICS
// ==========================================

export async function getAdMetrics(campaignId?: string): Promise<AdMetric[]> {
  if (!useSupabase) {
    let list = getAdMetricsStorage();
    if (campaignId) list = list.filter((m: AdMetric) => m.campaign_id === campaignId);
    return list;
  }
  const list = await sbList(
    () => (supabase.from('ad_metrics').select('*').order('date', { ascending: false }) as any),
    getAdMetricsStorage(),
  );
  if (campaignId) return list.filter((m: AdMetric) => m.campaign_id === campaignId);
  return list;
}

export async function createAdMetric(data: Partial<AdMetric>): Promise<AdMetric> {
  const now = new Date().toISOString();
  const record: AdMetric = {
    id: generateId(),
    campaign_id: data.campaign_id ?? '',
    date: data.date ?? now,
    impressions: data.impressions ?? 0,
    clicks: data.clicks ?? 0,
    leads: data.leads ?? 0,
    cost: data.cost ?? 0,
    cpc: data.cpc ?? null,
    cpl: data.cpl ?? null,
    conversions: data.conversions ?? 0,
    created_at: now,
  };
  if (!useSupabase) { setAdMetricsStorage([...getAdMetricsStorage(), record]); return record; }
  try {
    const { data: saved } = await (supabase.from('ad_metrics').insert(record).select().single() as any);
    if (saved?.id) record.id = saved.id;
    setAdMetricsStorage([...getAdMetricsStorage(), record]);
    return record;
  } catch { setAdMetricsStorage([...getAdMetricsStorage(), record]); return record; }
}

export async function getActivityLog(entity?: string, limit = 50): Promise<Activity[]> {
  // Backfill: if storage is empty, seed from the static list above.
  // This is idempotent — once any real activity is logged, we never
  // overwrite it.
  if (!useSupabase) {
    let list = getActivitiesStorage();
    if (list.length === 0) {
      setActivitiesStorage([...SEED_ACTIVITIES]);
      list = SEED_ACTIVITIES;
    }
    if (entity) list = list.filter((a: Activity) => a.entity === entity);
    return list
      .slice()
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      .slice(0, limit);
  }
  const list = await sbList(
    () => (supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(limit) as any),
    getActivitiesStorage(),
  );
  if (entity) return (list as Activity[]).filter((a: Activity) => a.entity === entity);
  return list as Activity[];
}

export async function logActivity(data: Partial<Activity>): Promise<Activity> {
  const now = new Date().toISOString();
  const record: Activity = {
    id: generateId(),
    action: data.action ?? 'unknown',
    entity: data.entity ?? '',
    entity_id: data.entity_id ?? '',
    details: data.details ?? null,
    user_id: data.user_id ?? 'system',
    created_at: now,
  };
  if (!useSupabase) { setActivitiesStorage([...getActivitiesStorage(), record]); return record; }
  try {
    const { data: saved } = await (supabase.from('activities').insert(record).select().single() as any);
    if (saved?.id) record.id = saved.id;
    setActivitiesStorage([...getActivitiesStorage(), record]);
    return record;
  } catch { setActivitiesStorage([...getActivitiesStorage(), record]); return record; }
}
