// ==========================================
// SAMPLE DATA SEEDER — crash-safe, never wipes
// ==========================================
// - Idempotent: does NOTHING if any real data exists
// - Writes to both localStorage (browser) and the persistent
//   fallback bundle (globalThis + .data/fallback.json) so API
//   routes never return empty after reload/HMR
// - Never crashes on SSR / missing window / bad JSON
// ==========================================

import { Property, Unit, Tenant, Lease, Payment, MaintenanceTicket, Lead, AdCampaign } from './database';

function now(): string {
  return new Date().toISOString();
}

function hasExistingData(): boolean {
  // 1) browser: check localStorage
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('propertyease_properties');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) return true;
      }
      // also check other keys — if user created tenants/units etc, don't reseed
      for (const k of ['propertyease_units','propertyease_tenants','propertyease_leads']) {
        try { const v = localStorage.getItem(k); if (v && JSON.parse(v)?.length) return true; } catch {}
      }
    } catch {}
  }
  // 2) server / globalThis bundle (API fallback) — check via dynamic import to avoid circular
  try {
    // Access global directly without importing database (avoids circular at load time)
    const b: any = (globalThis as any).__PE_FALLBACK__;
    if (b && (b.properties?.length || b.units?.length || b.tenants?.length || b.leads?.length)) return true;
    // Also check file fallback on server
    if (typeof window === 'undefined' && typeof process !== 'undefined') {
      try {
        const fs = require('fs');
        const path = require('path');
        const file = path.join(process.cwd(), '.data', 'fallback.json');
        if (fs.existsSync(file)) {
          const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
          if (parsed?.properties?.length || parsed?.units?.length) return true;
        }
      } catch {}
    }
  } catch {}
  return false;
}

// Legacy UAE/Dubai seeder REMOVED — it was writing the wrong market
// (Palm Jumeirah, Dubai Marina, DIFC, Sharjah) into localStorage and
// `.data/fallback.json`, and then the dashboard's recent-activity
// panel would show events at "Marina Tower 4B", "Palm Residence 12A",
// and "Business Hub 3A" — properties the user never created.
//
// The canonical Qatar-market seed is `ensureRichDemoData()` below.
// It is called server-side from `database.ts` and writes Al Mansura /
// Asmaco / Al Thumama / The Pearl (Marina Tower, Qatar).
//
// This shim remains so existing import sites (`use-seed.ts`,
// `login/page.tsx`) keep compiling — but it is a no-op.
export function seedSampleData(): void {
  // Intentionally empty. Do not re-introduce the Dubai seed here; it
  // conflicts with the Qatar seed and is the root cause of the
  // fictional "Marina Tower 4B" activity feed on the dashboard.
  return;
}

// (Legacy UAE seed body removed — was lines 56–157. Kept as a comment
// block in git history via `git log -p propertyease/src/lib/seed.ts` if
// anyone ever needs the Dubai data for an export test.)
//
//   const properties: Property[] = [
//     { id: 'prop_001', name: 'Palm Residence', ... city: 'Dubai', country: 'UAE' ... },
//     ... etc
//   ];
//
// Replaced by `ensureRichDemoData()` (Qatar) below.

// ==========================================
// RICH DEMO DATA — Qatar market, with images
// ==========================================
// Distinct from seedSampleData() so the user can re-trigger it
// after a manual edit. Uses free-to-use stock photo URLs from
// Unsplash and picsum.photos (no API key required).
// Idempotent: only writes if the existing bundle is missing
// images (i.e. the user has the bare "no-image" seed).
// ==========================================
// RICH DEMO DATA — Qatar market, with images
// ==========================================
// Distinct from seedSampleData() so the user can re-trigger it
// after a manual edit. Uses free-to-use stock photo URLs from
// Unsplash and picsum.photos (no API key required).
// Idempotent: only writes if the existing bundle is missing
// images (i.e. the user has the bare "no-image" seed).
// ==========================================

/** Curated cover images per property name — deterministic via picsum seed.
 *  Only the Qatar-market properties from ensureRichDemoData() are listed.
 *  The legacy Dubai/UAE names were removed along with the Dubai seed. */
const COVERS: Record<string, string> = {
  'Al Mansura Complex':   'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=80&auto=format&fit=crop', // modern Doha tower
  'Asmaco Residence':     'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1600&q=80&auto=format&fit=crop', // sandy residential
  'Al Thumama 103':       'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=1600&q=80&auto=format&fit=crop', // desert-modern villa
  'Marina Tower':         'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1600&q=80&auto=format&fit=crop', // Pearl-Qatar seafront tower
};

/** Unit gallery — pick 4 stable images per unit. */
const GALLERY = [
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80&auto=format&fit=crop', // living room
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80&auto=format&fit=crop', // bedroom
  'https://images.unsplash.com/photo-1556909190-eccf4a8bf97a?w=1200&q=80&auto=format&fit=crop', // kitchen
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80&auto=format&fit=crop', // bathroom
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80&auto=format&fit=crop', // view / exterior
];

/** Fallback generator when a name isn't in COVERS. */
function coverFor(name: string, i: number): string {
  if (COVERS[name]) return COVERS[name];
  return `https://picsum.photos/seed/${encodeURIComponent(name)}/1600/1000?${i}`;
}

function unitGallery(seed: string): string[] {
  // Stable pick: hash seed → 4 distinct images
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const out: string[] = [];
  for (let i = 0; i < 4; i++) {
    out.push(`${GALLERY[(h + i) % GALLERY.length]}&sig=${h}-${i}`);
  }
  return out;
}

function hasImages(bundle: any): boolean {
  const props = bundle?.properties || [];
  if (props.length === 0) return false;
  return props.some((p: any) => Array.isArray(p.images) && p.images.length > 0);
}

export function ensureRichDemoData(): void {
  if (typeof window !== 'undefined' || typeof process === 'undefined') return;

  try {
    const fs = require('fs');
    const path = require('path');
  const dir = path.join(process.cwd(), '.data');
  const file = path.join(dir, 'fallback.json');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let existing: any = {};
  if (fs.existsSync(file)) {
    try { existing = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { existing = {}; }
  }

  // Skip if existing data already has images — don't clobber user edits.
  if (hasImages(existing)) return;

  // ── Build the rich bundle ──────────────────────────────────
  const nowISO = now();

  // 4 Qatar properties (matches the user's "Al Mansura / Asmaco / Al Thumama" theme)
  const properties: Property[] = [
    {
      id: 'prop_almansura',
      name: 'Al Mansura Complex',
      name_ar: 'مجمع المنصورة',
      address: 'Najma Street, Al Mansura',
      address_ar: 'شارع النجمة، المنصورة',
      city: 'Doha',
      country: 'Qatar',
      property_type: 'residential',
      total_units: 48,
      description: 'Modern residential complex in the heart of Al Mansura. Walking distance to the metro and Corniche.',
      status: 'active',
      monthly_maintenance_fee: 350,
      images: [coverFor('Al Mansura Complex', 0)],
      created_at: nowISO,
      updated_at: nowISO,
    },
    {
      id: 'prop_asmaco',
      name: 'Asmaco Residence',
      name_ar: 'إسماكو ريزيدنس',
      address: 'Al Salihya, Building 7',
      address_ar: 'الصالحية، مبنى ٧',
      city: 'Doha',
      country: 'Qatar',
      property_type: 'residential',
      total_units: 32,
      description: 'Family-friendly low-rise residence with pool, gym, and 24/7 security.',
      status: 'active',
      monthly_maintenance_fee: 280,
      images: [coverFor('Asmaco Residence', 1)],
      created_at: nowISO,
      updated_at: nowISO,
    },
    {
      id: 'prop_thumama',
      name: 'Al Thumama 103',
      name_ar: 'الثمامة ١٠٣',
      address: 'Street 24, Bldg No.103, Nafa Street, Al Thumama',
      address_ar: 'شارع ٢٤، مبنى ١٠٣، شارع نفاع، الثمامة',
      city: 'Doha',
      country: 'Qatar',
      property_type: 'residential',
      total_units: 24,
      description: 'Premium villa-style units in Al Thumama, near FIFA-stadium district.',
      status: 'under_renovation',
      monthly_maintenance_fee: 450,
      images: [coverFor('Al Thumama 103', 2)],
      created_at: nowISO,
      updated_at: nowISO,
    },
    {
      id: 'prop_marina',
      name: 'Marina Tower',
      name_ar: 'برج المارينا',
      address: 'The Pearl-Qatar, Tower 12',
      address_ar: 'اللؤلؤة-قطر، برج ١٢',
      city: 'Doha',
      country: 'Qatar',
      property_type: 'mixed',
      total_units: 86,
      description: 'Mixed-use tower on The Pearl — residential and retail units with sea views.',
      status: 'active',
      monthly_maintenance_fee: 600,
      images: [coverFor('Marina Tower', 3)],
      created_at: nowISO,
      updated_at: nowISO,
    },
  ];

  // Units: every property gets 3-5 units with realistic QAR rents
  const units: Unit[] = [
    // Al Mansura
    { id: 'u_mansura_a1', property_id: 'prop_almansura', unit_number: 'A-101', floor: 1,  bedrooms: 2, bathrooms: 2, area_sqft: 102, monthly_rent: 6500,  security_deposit: 6500,  furnishing: 'unfurnished',     status: 'occupied', description: 'Spacious 2BR with balcony facing the courtyard.', amenities: ['parking','gym','security'], images: unitGallery('mansura-a1'), created_at: nowISO, updated_at: nowISO },
    { id: 'u_mansura_a2', property_id: 'prop_almansura', unit_number: 'A-102', floor: 1,  bedrooms: 1, bathrooms: 1, area_sqft: 67,  monthly_rent: 4800,  security_deposit: 4800,  furnishing: 'semi_furnished',  status: 'occupied', description: 'Bright 1BR near elevator.',                       amenities: ['parking','security'],     images: unitGallery('mansura-a2'), created_at: nowISO, updated_at: nowISO },
    { id: 'u_mansura_b1', property_id: 'prop_almansura', unit_number: 'B-201', floor: 2,  bedrooms: 3, bathrooms: 2, area_sqft: 135, monthly_rent: 8500,  security_deposit: 8500,  furnishing: 'fully_furnished', status: 'occupied', description: 'Premium 3BR with sea glimpse.',                    amenities: ['parking','gym','pool'],   images: unitGallery('mansura-b1'), created_at: nowISO, updated_at: nowISO },
    { id: 'u_mansura_b2', property_id: 'prop_almansura', unit_number: 'B-202', floor: 2,  bedrooms: 2, bathrooms: 2, area_sqft: 111, monthly_rent: 7000,  security_deposit: 7000,  furnishing: 'unfurnished',     status: 'vacant',   description: 'Vacant — recently painted, new AC.',               amenities: ['parking','gym'],         images: unitGallery('mansura-b2'), created_at: nowISO, updated_at: nowISO },
    { id: 'u_mansura_c1', property_id: 'prop_almansura', unit_number: 'C-301', floor: 3,  bedrooms: 2, bathrooms: 2, area_sqft: 107, monthly_rent: 6800,  security_deposit: 6800,  furnishing: 'unfurnished',     status: 'reserved', description: 'Reserved by corporate tenant.',                   amenities: ['parking','security'],     images: unitGallery('mansura-c1'), created_at: nowISO, updated_at: nowISO },

    // Asmaco
    { id: 'u_asmaco_1', property_id: 'prop_asmaco', unit_number: '101', floor: 1, bedrooms: 1, bathrooms: 1, area_sqft: 63,  monthly_rent: 4200, security_deposit: 4200, furnishing: 'unfurnished', status: 'occupied', description: 'Cozy 1BR, ground floor.',        amenities: ['parking','security'], images: unitGallery('asmaco-1'), created_at: nowISO, updated_at: nowISO },
    { id: 'u_asmaco_2', property_id: 'prop_asmaco', unit_number: '202', floor: 2, bedrooms: 2, bathrooms: 2, area_sqft: 98, monthly_rent: 5800, security_deposit: 5800, furnishing: 'semi_furnished', status: 'occupied', description: 'Family 2BR, pool view.',         amenities: ['parking','gym','pool'], images: unitGallery('asmaco-2'), created_at: nowISO, updated_at: nowISO },
    { id: 'u_asmaco_3', property_id: 'prop_asmaco', unit_number: '303', floor: 3, bedrooms: 3, bathrooms: 2, area_sqft: 128, monthly_rent: 7800, security_deposit: 7800, furnishing: 'fully_furnished', status: 'occupied', description: 'Top-floor 3BR, fully furnished.', amenities: ['parking','gym','pool'], images: unitGallery('asmaco-3'), created_at: nowISO, updated_at: nowISO },
    { id: 'u_asmaco_4', property_id: 'prop_asmaco', unit_number: '404', floor: 4, bedrooms: 2, bathrooms: 2, area_sqft: 100, monthly_rent: 6000, security_deposit: 6000, furnishing: 'unfurnished', status: 'maintenance', description: 'Under AC maintenance.',         amenities: ['parking','gym'],       images: unitGallery('asmaco-4'), created_at: nowISO, updated_at: nowISO },

    // Al Thumama
    { id: 'u_thumama_1', property_id: 'prop_thumama', unit_number: 'V-1', floor: 1, bedrooms: 4, bathrooms: 3, area_sqft: 223, monthly_rent: 14000, security_deposit: 14000, furnishing: 'fully_furnished', status: 'vacant', description: 'Standalone villa, 4BR + maid room.', amenities: ['parking','garden','pool'], images: unitGallery('thumama-1'), created_at: nowISO, updated_at: nowISO },
    { id: 'u_thumama_2', property_id: 'prop_thumama', unit_number: 'V-2', floor: 1, bedrooms: 3, bathrooms: 2, area_sqft: 177, monthly_rent: 11000, security_deposit: 11000, furnishing: 'unfurnished',     status: 'vacant', description: '3BR villa, end of compound.',      amenities: ['parking','garden'],     images: unitGallery('thumama-2'), created_at: nowISO, updated_at: nowISO },

    // Marina Tower
    { id: 'u_marina_p1', property_id: 'prop_marina', unit_number: 'P-1201', floor: 12, bedrooms: 1, bathrooms: 1, area_sqft: 73,  monthly_rent: 9500,  security_deposit: 9500,  furnishing: 'fully_furnished', status: 'occupied', description: 'Sea-view 1BR on The Pearl.',          amenities: ['parking','gym','pool','beach'], images: unitGallery('marina-p1'), created_at: nowISO, updated_at: nowISO },
    { id: 'u_marina_p2', property_id: 'prop_marina', unit_number: 'P-1402', floor: 14, bedrooms: 2, bathrooms: 2, area_sqft: 116, monthly_rent: 13500, security_deposit: 13500, furnishing: 'fully_furnished', status: 'occupied', description: 'Marina-facing 2BR.',                  amenities: ['parking','gym','pool','beach'], images: unitGallery('marina-p2'), created_at: nowISO, updated_at: nowISO },
    { id: 'u_marina_r1', property_id: 'prop_marina', unit_number: 'R-001', floor: 1,  bedrooms: 0, bathrooms: 1, area_sqft: 39,  monthly_rent: 18000, security_deposit: 36000, furnishing: 'unfurnished',     status: 'occupied', description: 'Ground-floor retail unit.',           amenities: ['parking'],                  images: unitGallery('marina-r1'), created_at: nowISO, updated_at: nowISO },
    { id: 'u_marina_p3', property_id: 'prop_marina', unit_number: 'P-1801', floor: 18, bedrooms: 3, bathrooms: 3, area_sqft: 177, monthly_rent: 21000, security_deposit: 21000, furnishing: 'fully_furnished', status: 'vacant', description: 'Penthouse-level 3BR.',                amenities: ['parking','gym','pool','concierge'], images: unitGallery('marina-p3'), created_at: nowISO, updated_at: nowISO },
  ];

  // Tenants
  const tenants: Tenant[] = [
    { id: 't_qa_001', name: 'Ahmed Al-Sulaiti',    name_ar: 'أحمد السليطي',     email: 'ahmed.sulaiti@example.qa', phone: '+974 5555 1234', nationality: 'Qatar',     company: null,             notes: 'Long-term tenant (3+ years).', created_at: nowISO, updated_at: nowISO },
    { id: 't_qa_002', name: 'Mariam Al-Kuwari',    name_ar: 'مريم الكواري',     email: 'mariam.k@example.qa',     phone: '+974 5555 5678', nationality: 'Qatar',     company: null,             notes: null,                       created_at: nowISO, updated_at: nowISO },
    { id: 't_qa_003', name: 'Khalid Al-Mansoori',  name_ar: 'خالد المنصوري',    email: 'khalid.m@example.qa',     phone: '+974 6666 1111', nationality: 'Qatar',     company: 'Al Mansoori Trading', notes: null,                       created_at: nowISO, updated_at: nowISO },
    { id: 't_qa_004', name: 'Sarah Mitchell',      name_ar: 'سارة ميتشل',       email: 'sarah.m@example.com',     phone: '+974 7777 2222', nationality: 'UK',        company: null,             notes: 'Diplomatic tenant.',          created_at: nowISO, updated_at: nowISO },
    { id: 't_qa_005', name: 'Hiroshi Tanaka',      name_ar: 'هيروشي تاناكا',    email: 'h.tanaka@example.com',    phone: '+974 7777 3333', nationality: 'Japan',     company: 'Marubeni Corp',     notes: null,                       created_at: nowISO, updated_at: nowISO },
    { id: 't_qa_006', name: 'Priya Sharma',        name_ar: 'بريا شارما',       email: 'priya.s@example.com',     phone: '+974 7777 4444', nationality: 'India',     company: null,             notes: null,                       created_at: nowISO, updated_at: nowISO },
    { id: 't_qa_007', name: 'Doha Boutique LLC',   name_ar: 'دوحة بوتيك ش.ش.و', email: 'lease@dohaboutique.qa',  phone: '+974 4444 5555', nationality: 'Corporate', company: 'Doha Boutique LLC', notes: 'Retail tenant, Marina Tower.', created_at: nowISO, updated_at: nowISO },
  ];

  // Leases
  const leases: Lease[] = [
    { id: 'l_001', lease_number: 'L-2025-001', tenant_id: 't_qa_001', unit_id: 'u_mansura_a1', start_date: '2025-01-15', end_date: '2026-01-14', monthly_rent: 6500,  payment_day: 15, payment_method: 'bank_transfer', security_deposit: 6500,  status: 'active',  created_at: nowISO, updated_at: nowISO },
    { id: 'l_002', lease_number: 'L-2025-002', tenant_id: 't_qa_002', unit_id: 'u_mansura_a2', start_date: '2025-03-01', end_date: '2026-02-28', monthly_rent: 4800,  payment_day: 1,  payment_method: 'pdc',           security_deposit: 4800,  status: 'active',  created_at: nowISO, updated_at: nowISO },
    { id: 'l_003', lease_number: 'L-2025-003', tenant_id: 't_qa_003', unit_id: 'u_mansura_b1', start_date: '2024-09-01', end_date: '2025-08-31', monthly_rent: 8500,  payment_day: 1,  payment_method: 'bank_transfer', security_deposit: 8500,  status: 'active',  created_at: nowISO, updated_at: nowISO },
    { id: 'l_004', lease_number: 'L-2025-004', tenant_id: 't_qa_004', unit_id: 'u_asmaco_1',   start_date: '2025-02-01', end_date: '2026-01-31', monthly_rent: 4200,  payment_day: 1,  payment_method: 'pdc',           security_deposit: 4200,  status: 'active',  created_at: nowISO, updated_at: nowISO },
    { id: 'l_005', lease_number: 'L-2025-005', tenant_id: 't_qa_005', unit_id: 'u_asmaco_2',   start_date: '2025-04-15', end_date: '2026-04-14', monthly_rent: 5800,  payment_day: 15, payment_method: 'bank_transfer', security_deposit: 5800,  status: 'active',  created_at: nowISO, updated_at: nowISO },
    { id: 'l_006', lease_number: 'L-2025-006', tenant_id: 't_qa_006', unit_id: 'u_asmaco_3',   start_date: '2024-11-01', end_date: '2025-10-31', monthly_rent: 7800,  payment_day: 1,  payment_method: 'pdc',           security_deposit: 7800,  status: 'pending_renewal', created_at: nowISO, updated_at: nowISO },
    { id: 'l_007', lease_number: 'L-2025-007', tenant_id: 't_qa_004', unit_id: 'u_marina_p1',  start_date: '2025-01-01', end_date: '2025-12-31', monthly_rent: 9500,  payment_day: 1,  payment_method: 'bank_transfer', security_deposit: 9500,  status: 'active',  created_at: nowISO, updated_at: nowISO },
    { id: 'l_008', lease_number: 'L-2025-008', tenant_id: 't_qa_005', unit_id: 'u_marina_p2',  start_date: '2025-02-15', end_date: '2026-02-14', monthly_rent: 13500, payment_day: 15, payment_method: 'bank_transfer', security_deposit: 13500, status: 'active',  created_at: nowISO, updated_at: nowISO },
    { id: 'l_009', lease_number: 'L-2025-009', tenant_id: 't_qa_007', unit_id: 'u_marina_r1',  start_date: '2024-09-01', end_date: '2027-08-31', monthly_rent: 18000, payment_day: 1,  payment_method: 'bank_transfer', security_deposit: 36000, status: 'active',  created_at: nowISO, updated_at: nowISO },
    { id: 'l_010', lease_number: 'L-2024-088', tenant_id: 't_qa_001', unit_id: 'u_asmaco_4',   start_date: '2024-06-01', end_date: '2025-05-31', monthly_rent: 6000,  payment_day: 1,  payment_method: 'pdc',           security_deposit: 6000,  status: 'expired', created_at: nowISO, updated_at: nowISO },
  ];

  // Payments — mix of received, pending, overdue
  const payments: Payment[] = [
    // August 2025
    { id: 'pay_001', lease_id: 'l_001', tenant_id: 't_qa_001', amount: 6500,  due_date: '2025-08-15', payment_date: '2025-08-14', payment_type: 'rent',            payment_method: 'bank_transfer', bank_reference: 'TXN-A82193', status: 'received', created_at: nowISO, updated_at: nowISO },
    { id: 'pay_002', lease_id: 'l_002', tenant_id: 't_qa_002', amount: 4800,  due_date: '2025-08-01', payment_date: '2025-08-01', payment_type: 'rent',            payment_method: 'pdc',           cheque_number: 'CHQ-33921',    status: 'received', created_at: nowISO, updated_at: nowISO },
    { id: 'pay_003', lease_id: 'l_003', tenant_id: 't_qa_003', amount: 8500,  due_date: '2025-08-01', payment_date: null,         payment_type: 'rent',            payment_method: 'bank_transfer', bank_reference: null,           status: 'pending',  created_at: nowISO, updated_at: nowISO },
    { id: 'pay_004', lease_id: 'l_004', tenant_id: 't_qa_004', amount: 4200,  due_date: '2025-08-01', payment_date: '2025-08-01', payment_type: 'rent',            payment_method: 'pdc',           cheque_number: 'CHQ-33922',    status: 'received', created_at: nowISO, updated_at: nowISO },
    { id: 'pay_005', lease_id: 'l_005', tenant_id: 't_qa_005', amount: 5800,  due_date: '2025-08-15', payment_date: '2025-08-13', payment_type: 'rent',            payment_method: 'bank_transfer', bank_reference: 'TXN-A83001',   status: 'received', created_at: nowISO, updated_at: nowISO },
    { id: 'pay_006', lease_id: 'l_006', tenant_id: 't_qa_006', amount: 7800,  due_date: '2025-08-01', payment_date: null,         payment_type: 'rent',            payment_method: 'pdc',           cheque_number: 'CHQ-33923',    status: 'overdue',  created_at: nowISO, updated_at: nowISO },
    { id: 'pay_007', lease_id: 'l_007', tenant_id: 't_qa_004', amount: 9500,  due_date: '2025-08-01', payment_date: '2025-08-01', payment_type: 'rent',            payment_method: 'bank_transfer', bank_reference: 'TXN-A83214',   status: 'received', created_at: nowISO, updated_at: nowISO },
    { id: 'pay_008', lease_id: 'l_008', tenant_id: 't_qa_005', amount: 13500, due_date: '2025-08-15', payment_date: '2025-08-15', payment_type: 'rent',            payment_method: 'bank_transfer', bank_reference: 'TXN-A83301',   status: 'received', created_at: nowISO, updated_at: nowISO },
    { id: 'pay_009', lease_id: 'l_009', tenant_id: 't_qa_007', amount: 18000, due_date: '2025-08-01', payment_date: '2025-08-01', payment_type: 'rent',            payment_method: 'bank_transfer', bank_reference: 'TXN-A83450',   status: 'received', created_at: nowISO, updated_at: nowISO },

    // July 2025
    { id: 'pay_010', lease_id: 'l_001', tenant_id: 't_qa_001', amount: 6500,  due_date: '2025-07-15', payment_date: '2025-07-15', payment_type: 'rent',            payment_method: 'bank_transfer', bank_reference: 'TXN-A79012',   status: 'received', created_at: nowISO, updated_at: nowISO },
    { id: 'pay_011', lease_id: 'l_003', tenant_id: 't_qa_003', amount: 8500,  due_date: '2025-07-01', payment_date: '2025-07-02', payment_type: 'rent',            payment_method: 'bank_transfer', bank_reference: 'TXN-A79013',   status: 'received', created_at: nowISO, updated_at: nowISO },
    { id: 'pay_012', lease_id: 'l_007', tenant_id: 't_qa_004', amount: 9500,  due_date: '2025-07-01', payment_date: '2025-07-01', payment_type: 'rent',            payment_method: 'bank_transfer', bank_reference: 'TXN-A79015',   status: 'received', created_at: nowISO, updated_at: nowISO },
    { id: 'pay_013', lease_id: 'l_009', tenant_id: 't_qa_007', amount: 18000, due_date: '2025-07-01', payment_date: '2025-07-01', payment_type: 'rent',            payment_method: 'bank_transfer', bank_reference: 'TXN-A79017',   status: 'received', created_at: nowISO, updated_at: nowISO },

    // Bounced & fees
    { id: 'pay_014', lease_id: 'l_010', tenant_id: 't_qa_001', amount: 6000,  due_date: '2025-05-01', payment_date: '2025-05-01', payment_type: 'rent',            payment_method: 'pdc',           cheque_number: 'CHQ-31800',    status: 'bounced',  created_at: nowISO, updated_at: nowISO },
    { id: 'pay_015', lease_id: 'l_005', tenant_id: 't_qa_005', amount: 250,   due_date: '2025-08-15', payment_date: '2025-08-15', payment_type: 'maintenance_fee', payment_method: 'bank_transfer', bank_reference: 'TXN-A83501',   status: 'received', created_at: nowISO, updated_at: nowISO },
  ];

  // Maintenance tickets
  const tickets: MaintenanceTicket[] = [
    { id: 'mt_001', ticket_number: 'MT-1001', unit_id: 'u_mansura_a1', tenant_id: 't_qa_001', title: 'AC not cooling in master bedroom', description: 'Unit blowing room-temp air since yesterday morning.', priority: 'high',     category: 'HVAC',      status: 'in_progress',  images: [], resolution_images: [], resolution: null,           estimated_cost: 450, actual_cost: null,  scheduled_date: '2025-08-20', completed_date: null,           created_at: nowISO, updated_at: nowISO },
    { id: 'mt_002', ticket_number: 'MT-1002', unit_id: 'u_asmaco_3',   tenant_id: 't_qa_006', title: 'Kitchen sink blocked',             description: 'Water draining very slowly.',                          priority: 'medium',   category: 'Plumbing',  status: 'open',         images: [], resolution_images: [], resolution: null,           estimated_cost: 200, actual_cost: null,  scheduled_date: null,           completed_date: null,           created_at: nowISO, updated_at: nowISO },
    { id: 'mt_003', ticket_number: 'MT-1003', unit_id: 'u_marina_p1',  tenant_id: 't_qa_004', title: 'Smart lock battery low',           description: 'Lock beeping red, needs battery replacement.',        priority: 'low',      category: 'Electrical', status: 'completed',    images: [], resolution_images: [], resolution: 'Replaced batteries', estimated_cost: 80,  actual_cost: 65,   scheduled_date: '2025-08-10', completed_date: '2025-08-10', created_at: nowISO, updated_at: nowISO },
    { id: 'mt_004', ticket_number: 'MT-1004', unit_id: 'u_mansura_b1', tenant_id: 't_qa_003', title: 'Elevator making grinding noise',   description: 'Audible grinding when descending from floor 8.',       priority: 'urgent',   category: 'Mechanical',status: 'open',         images: [], resolution_images: [], resolution: null,           estimated_cost: 1800,actual_cost: null,  scheduled_date: null,           completed_date: null,           created_at: nowISO, updated_at: nowISO },
    { id: 'mt_005', ticket_number: 'MT-1005', unit_id: 'u_asmaco_2',   tenant_id: 't_qa_005', title: 'Bathroom exhaust fan noisy',       description: 'Loud rattling noise from bathroom fan.',                priority: 'low',      category: 'Electrical', status: 'completed',    images: [], resolution_images: [], resolution: 'Tightened mounting', estimated_cost: 120, actual_cost: 90,   scheduled_date: '2025-08-05', completed_date: '2025-08-05', created_at: nowISO, updated_at: nowISO },
  ];

  // Leads
  const leads: Lead[] = [
    { id: 'ld_001', name: 'Mohammed K.',   phone: '+974 5555 8888', email: 'mohammed.k@example.qa', source: 'meta_ads',     source_detail: 'Facebook — Pearl-Qatar campaign', property_interest: '2BR, Marina Tower', budget: 12000, status: 'interested', notes: 'Wants to view next weekend.',           created_at: nowISO, updated_at: nowISO },
    { id: 'ld_002', name: 'Priya S.',      phone: '+974 5555 7777', email: 'priya.s@example.com',  source: 'google_ads',   source_detail: 'Google Search — Al Sadd',            property_interest: '1BR, Asmaco',       budget: 5000,  status: 'contacted',  notes: null,                                  created_at: nowISO, updated_at: nowISO },
    { id: 'ld_003', name: 'James L.',      phone: '+974 5555 6666', email: null,                 source: 'property_finder', source_detail: null,                          property_interest: '3BR, Al Thumama',   budget: 14000, status: 'visited',    notes: 'Visited with family on 12 Aug.',         created_at: nowISO, updated_at: nowISO },
    { id: 'ld_004', name: 'Fatima H.',     phone: '+974 5555 5555', email: null,                 source: 'direct',       source_detail: 'Walk-in',                            property_interest: '2BR, Al Mansura',   budget: 6500,  status: 'new',        notes: null,                                  created_at: nowISO, updated_at: nowISO },
    { id: 'ld_005', name: 'Chen W.',       phone: '+974 5555 4444', email: 'chen.w@example.com',  source: 'meta_ads',     source_detail: 'Instagram — Pearl-Qatar',             property_interest: 'Retail, Marina Tower', budget: 22000, status: 'converted',  notes: 'Converted — signed lease l_009.',       created_at: nowISO, updated_at: nowISO },
    { id: 'ld_006', name: 'Layla N.',      phone: '+974 5555 3333', email: 'layla.n@example.qa',  source: 'referral',     source_detail: 'Referred by Ahmed Al-Sulaiti',        property_interest: '3BR, Al Mansura',   budget: 9000,  status: 'interested', notes: 'Wants to move in by October.',          created_at: nowISO, updated_at: nowISO },
  ];

  // Ad campaigns
  const campaigns: AdCampaign[] = [
    { id: 'c_001', name: 'Marina Tower — Pearl Living',     platform: 'meta',            campaign_id_external: '2385000001', start_date: '2025-07-01', end_date: '2025-09-30', budget: 8000,  spent: 5200, status: 'active',    target_audience: 'Expats, 30-50, Pearl-Qatar area',   objective: 'Leads', created_at: nowISO, updated_at: nowISO },
    { id: 'c_002', name: 'Al Mansura — Family Residences',  platform: 'google',          campaign_id_external: 'G-7781001',  start_date: '2025-07-15', end_date: '2025-10-15', budget: 5000,  spent: 3100, status: 'active',    target_audience: 'Qatari nationals, families',          objective: 'Leads', created_at: nowISO, updated_at: nowISO },
    { id: 'c_003', name: 'Al Thumama Villas — Premium',     platform: 'property_finder', campaign_id_external: 'PF-209',      start_date: '2025-08-01', end_date: '2025-11-30', budget: 6000,  spent: 1800, status: 'active',    target_audience: 'HNI, 4BR+ seekers',                  objective: 'Leads', created_at: nowISO, updated_at: nowISO },
    { id: 'c_004', name: 'Asmaco — Affordable Units',       platform: 'meta',            campaign_id_external: '2385000042', start_date: '2025-06-01', end_date: '2025-08-31', budget: 3500,  spent: 3500, status: 'completed', target_audience: 'Budget renters, 25-35',              objective: 'Leads', created_at: nowISO, updated_at: nowISO },
  ];

  const bundle: any = {
    properties,
    units,
    tenants,
    leases,
    payments,
    maintenance: tickets,
    leads,
    ad_campaigns: campaigns,
  };

  try { fs.writeFileSync(file, JSON.stringify(bundle, null, 2), 'utf8'); } catch {}
  // Hydrate in-process memory too (in case the server is already running)
  try { (globalThis as any).__PE_FALLBACK__ = bundle; } catch {}
  } catch { /* never crash server startup */ }
}
