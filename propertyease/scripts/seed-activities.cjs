// One-off seed script: injects a believable activity feed that ties to
// real seed entities (Mansura/Asmaco/Thumama/Pearl tenants + units).
// Run: node scripts/seed-activities.cjs
const fs = require('fs');
const path = require('path');

const fallbackPath = path.resolve(__dirname, '..', '.data', 'fallback.json');
const bundle = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));

// ── Activity feed ──────────────────────────────────────────────────────
// Each entry: { action, entity, entity_id, details: { ... } }
// `details` is what the dashboard will format into a human-readable string.
bundle.activities = [
  {
    id: 'act-001',
    action: 'payment_received',
    entity: 'payment',
    entity_id: 'pay-008',
    details: { amount: 13500, tenant: 'Hiroshi Tanaka', unit: 'P-1402', property: 'The Pearl Residences' },
    user_id: 'system',
    created_at: '2025-08-15T09:00:00.000Z',
  },
  {
    id: 'act-002',
    action: 'maintenance_created',
    entity: 'maintenance',
    entity_id: 'mt-004',
    details: { title: 'Elevator making grinding noise', unit: 'B-201', property: 'Al Mansura Complex', priority: 'urgent' },
    user_id: 'system',
    created_at: '2025-08-27T08:00:00.000Z',
  },
  {
    id: 'act-003',
    action: 'lease_signed',
    entity: 'lease',
    entity_id: 'l-010',
    details: { tenant: 'Khalid Al-Mansoori', unit: 'P-1502', property: 'The Pearl Residences', term_months: 12 },
    user_id: 'system',
    created_at: '2025-05-25T08:00:00.000Z',
  },
  {
    id: 'act-004',
    action: 'lead_created',
    entity: 'lead',
    entity_id: 'ld-004',
    details: { name: 'Fatima H.', interest: '2BR, Al Mansura', source: 'Walk-in' },
    user_id: 'system',
    created_at: '2025-08-27T09:00:00.000Z',
  },
  {
    id: 'act-005',
    action: 'payment_overdue',
    entity: 'payment',
    entity_id: 'pay-006',
    details: { amount: 7800, tenant: 'Priya Sharma', unit: '303', property: 'Asmaco Residence', reason: 'PDC returned' },
    user_id: 'system',
    created_at: '2025-08-15T07:00:00.000Z',
  },
  {
    id: 'act-006',
    action: 'maintenance_completed',
    entity: 'maintenance',
    entity_id: 'mt-005',
    details: { title: 'Bathroom exhaust fan noisy', unit: '202', property: 'Asmaco Residence', resolution: 'Tightened mounting bracket' },
    user_id: 'system',
    created_at: '2025-08-15T16:00:00.000Z',
  },
  {
    id: 'act-007',
    action: 'payment_received',
    entity: 'payment',
    entity_id: 'pay-009',
    details: { amount: 18000, tenant: 'Doha Boutique LLC', unit: 'R-001', property: 'The Pearl Residences' },
    user_id: 'system',
    created_at: '2025-08-01T12:00:00.000Z',
  },
  {
    id: 'act-008',
    action: 'lease_renewed',
    entity: 'lease',
    entity_id: 'l-002',
    details: { tenant: 'Mariam Al-Kuwari', unit: 'A-102', property: 'Al Mansura Complex' },
    user_id: 'system',
    created_at: '2025-02-20T09:00:00.000Z',
  },
  {
    id: 'act-009',
    action: 'maintenance_created',
    entity: 'maintenance',
    entity_id: 'mt-002',
    details: { title: 'Kitchen sink blocked', unit: '303', property: 'Asmaco Residence', priority: 'medium' },
    user_id: 'system',
    created_at: '2025-08-26T14:00:00.000Z',
  },
  {
    id: 'act-010',
    action: 'lead_converted',
    entity: 'lead',
    entity_id: 'ld-005',
    details: { name: 'Chen W.', property: 'The Pearl Residences', signed_lease: 'l-009' },
    user_id: 'system',
    created_at: '2025-05-20T09:00:00.000Z',
  },
];

// details is stored as JSON-string per the Activity interface — match it
bundle.activities.forEach((a) => {
  if (a.details && typeof a.details !== 'string') {
    a.details = JSON.stringify(a.details);
  }
});

fs.writeFileSync(fallbackPath, JSON.stringify(bundle, null, 2));
console.log(`OK: ${bundle.activities.length} activity entries seeded.`);
