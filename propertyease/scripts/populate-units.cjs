/* eslint-disable */
// Populate 5 units per live property, with images and QAR rent.
// Writes to .data/fallback.json. Restart the dev server to rehydrate.

const fs = require('node:fs');
const path = require('node:path');

const FALLBACK = path.join(__dirname, '..', '.data', 'fallback.json');

const GALLERY = [
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1556909190-eccf4a8bf97a?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80&auto=format&fit=crop',
];

function gallery(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return [0, 1, 2, 3].map((i) => `${GALLERY[(h + i) % GALLERY.length]}&sig=${h}-${i}`);
}

const data = JSON.parse(fs.readFileSync(FALLBACK, 'utf8'));

// Live properties (per the user's screenshot + the dev server's in-memory store):
//   3b0a5842-f294-4f89-87a5-8a47c5c5ceab  AL MANUSRA COMPLEX    (Doha, has cover image)
//   3b436a28-6f4a-400b-b7b7-a3225a6ac8e7  My Test Property      (Dubai)
//   3cf3ff0f-5f84-43ad-ab9a-bf7f5e8fd186  Asmaco Residence      (Doha)
//   a4d1f24b-b77d-4227-8723-9213e9f3fd3d  AL THUMAMA 103 UPDATED(Doha)
const PROP_MANSURA = '3b0a5842-f294-4f89-87a5-8a47c5c5ceab';
const PROP_TEST    = '3b436a28-6f4a-400b-b7b7-a3225a6ac8e7';
const PROP_ASMACO  = '3cf3ff0f-5f84-43ad-ab9a-bf7f5e8fd186';
const PROP_THUMAMA = 'a4d1f24b-b77d-4227-8723-9213e9f3fd3d';

const now = new Date().toISOString();

const UNITS = [
  // AL MANUSRA COMPLEX (Doha) — residential mid-range
  { id: 'u_m1', property_id: PROP_MANSURA, unit_number: 'A-101', floor: 1, bedrooms: 2, bathrooms: 2, area_sqft: 1100, monthly_rent: 6500,  security_deposit: 6500,  furnishing: 'unfurnished',     status: 'occupied',   description: 'Spacious 2BR with balcony facing the courtyard.', amenities: ['parking', 'gym', 'security'],          images: gallery('mansura-a101') },
  { id: 'u_m2', property_id: PROP_MANSURA, unit_number: 'A-102', floor: 1, bedrooms: 1, bathrooms: 1, area_sqft: 720,  monthly_rent: 4800,  security_deposit: 4800,  furnishing: 'semi_furnished',  status: 'occupied',   description: 'Bright 1BR near elevator.',                       amenities: ['parking', 'security'],               images: gallery('mansura-a102') },
  { id: 'u_m3', property_id: PROP_MANSURA, unit_number: 'B-201', floor: 2, bedrooms: 3, bathrooms: 2, area_sqft: 1450, monthly_rent: 8500,  security_deposit: 8500,  furnishing: 'fully_furnished', status: 'occupied',   description: 'Premium 3BR with sea glimpse.',                    amenities: ['parking', 'gym', 'pool'],            images: gallery('mansura-b201') },
  { id: 'u_m4', property_id: PROP_MANSURA, unit_number: 'B-202', floor: 2, bedrooms: 2, bathrooms: 2, area_sqft: 1200, monthly_rent: 7000,  security_deposit: 7000,  furnishing: 'unfurnished',     status: 'vacant',     description: 'Recently painted, new AC. Ready to lease.',       amenities: ['parking', 'gym'],                   images: gallery('mansura-b202') },
  { id: 'u_m5', property_id: PROP_MANSURA, unit_number: 'C-301', floor: 3, bedrooms: 2, bathrooms: 2, area_sqft: 1150, monthly_rent: 6800,  security_deposit: 6800,  furnishing: 'unfurnished',     status: 'reserved',   description: 'Reserved by corporate tenant — move-in Oct 1.',   amenities: ['parking', 'security'],               images: gallery('mansura-c301') },

  // My Test Property (Dubai) — keep small, mixed
  { id: 'u_t1', property_id: PROP_TEST, unit_number: 'D-001', floor: 1, bedrooms: 1, bathrooms: 1, area_sqft: 650,  monthly_rent: 3800,  security_deposit: 3800,  furnishing: 'unfurnished',     status: 'occupied',   description: 'Cozy 1BR, ground floor.',                          amenities: ['parking'],                          images: gallery('test-d001') },
  { id: 'u_t2', property_id: PROP_TEST, unit_number: 'D-002', floor: 1, bedrooms: 2, bathrooms: 2, area_sqft: 1050, monthly_rent: 5500,  security_deposit: 5500,  furnishing: 'semi_furnished',  status: 'occupied',   description: '2BR, family-friendly layout.',                     amenities: ['parking', 'security'],               images: gallery('test-d002') },
  { id: 'u_t3', property_id: PROP_TEST, unit_number: 'D-003', floor: 2, bedrooms: 2, bathrooms: 2, area_sqft: 1100, monthly_rent: 5800,  security_deposit: 5800,  furnishing: 'fully_furnished', status: 'vacant',     description: 'Top-floor 2BR with skyline view.',                  amenities: ['parking', 'gym'],                   images: gallery('test-d003') },
  { id: 'u_t4', property_id: PROP_TEST, unit_number: 'D-004', floor: 2, bedrooms: 3, bathrooms: 2, area_sqft: 1400, monthly_rent: 7200,  security_deposit: 7200,  furnishing: 'unfurnished',     status: 'maintenance', description: 'Under kitchen renovation.',                        amenities: ['parking', 'gym'],                   images: gallery('test-d004') },
  { id: 'u_t5', property_id: PROP_TEST, unit_number: 'D-005', floor: 3, bedrooms: 1, bathrooms: 1, area_sqft: 700,  monthly_rent: 4000,  security_deposit: 4000,  furnishing: 'unfurnished',     status: 'vacant',     description: 'Studio-style 1BR, quiet side of building.',         amenities: ['parking'],                          images: gallery('test-d005') },

  // Asmaco Residence (Doha) — family mid-range
  { id: 'u_a1', property_id: PROP_ASMACO, unit_number: '101',   floor: 1, bedrooms: 1, bathrooms: 1, area_sqft: 680,  monthly_rent: 4200,  security_deposit: 4200,  furnishing: 'unfurnished',     status: 'occupied',   description: 'Ground-floor 1BR, easy access.',                   amenities: ['parking', 'security'],               images: gallery('asmaco-101') },
  { id: 'u_a2', property_id: PROP_ASMACO, unit_number: '202',   floor: 2, bedrooms: 2, bathrooms: 2, area_sqft: 1050, monthly_rent: 5800,  security_deposit: 5800,  furnishing: 'semi_furnished',  status: 'occupied',   description: 'Family 2BR with pool view.',                        amenities: ['parking', 'gym', 'pool'],            images: gallery('asmaco-202') },
  { id: 'u_a3', property_id: PROP_ASMACO, unit_number: '303',   floor: 3, bedrooms: 3, bathrooms: 2, area_sqft: 1380, monthly_rent: 7800,  security_deposit: 7800,  furnishing: 'fully_furnished', status: 'occupied',   description: 'Top-floor 3BR, fully furnished.',                   amenities: ['parking', 'gym', 'pool'],            images: gallery('asmaco-303') },
  { id: 'u_a4', property_id: PROP_ASMACO, unit_number: '404',   floor: 4, bedrooms: 2, bathrooms: 2, area_sqft: 1080, monthly_rent: 6000,  security_deposit: 6000,  furnishing: 'unfurnished',     status: 'maintenance', description: 'AC unit under replacement.',                       amenities: ['parking', 'gym'],                   images: gallery('asmaco-404') },
  { id: 'u_a5', property_id: PROP_ASMACO, unit_number: '505',   floor: 5, bedrooms: 2, bathrooms: 2, area_sqft: 1100, monthly_rent: 6200,  security_deposit: 6200,  furnishing: 'unfurnished',     status: 'vacant',     description: 'Newly listed — move-in ready.',                     amenities: ['parking', 'gym', 'pool'],            images: gallery('asmaco-505') },

  // AL THUMAMA 103 UPDATED (Doha) — premium villa-style
  { id: 'u_th1', property_id: PROP_THUMAMA, unit_number: 'V-1',  floor: 1, bedrooms: 4, bathrooms: 3, area_sqft: 2400, monthly_rent: 14000, security_deposit: 14000, furnishing: 'fully_furnished', status: 'occupied',   description: 'Standalone villa, 4BR + maid room.',                amenities: ['parking', 'garden', 'pool'],         images: gallery('thumama-v1') },
  { id: 'u_th2', property_id: PROP_THUMAMA, unit_number: 'V-2',  floor: 1, bedrooms: 3, bathrooms: 2, area_sqft: 1900, monthly_rent: 11000, security_deposit: 11000, furnishing: 'unfurnished',     status: 'occupied',   description: '3BR villa, end of compound.',                       amenities: ['parking', 'garden'],                images: gallery('thumama-v2') },
  { id: 'u_th3', property_id: PROP_THUMAMA, unit_number: 'V-3',  floor: 1, bedrooms: 4, bathrooms: 3, area_sqft: 2200, monthly_rent: 13500, security_deposit: 13500, furnishing: 'fully_furnished', status: 'vacant',     description: '4BR villa, newly refurbished.',                     amenities: ['parking', 'garden', 'pool'],         images: gallery('thumama-v3') },
  { id: 'u_th4', property_id: PROP_THUMAMA, unit_number: 'V-4',  floor: 1, bedrooms: 3, bathrooms: 2, area_sqft: 1800, monthly_rent: 10500, security_deposit: 10500, furnishing: 'semi_furnished',  status: 'vacant',     description: '3BR villa with private garden.',                    amenities: ['parking', 'garden'],                images: gallery('thumama-v4') },
  { id: 'u_th5', property_id: PROP_THUMAMA, unit_number: 'V-5',  floor: 1, bedrooms: 5, bathrooms: 4, area_sqft: 2800, monthly_rent: 16500, security_deposit: 16500, furnishing: 'fully_furnished', status: 'maintenance', description: '5BR villa, pool under resurfacing.',                amenities: ['parking', 'garden', 'pool'],         images: gallery('thumama-v5') },
];

// Add created_at/updated_at to every unit
for (const u of UNITS) {
  u.created_at = now;
  u.updated_at = now;
}

// Replace units entirely (we want exactly these 20, not 35 with stale leftovers)
data.units = UNITS;

// Also update total_units on each property to match the actual unit count
// (and drop them from the inflated 50/48/32/24/86 the demo seeded).
const countByProp = {};
for (const u of UNITS) countByProp[u.property_id] = (countByProp[u.property_id] || 0) + 1;

for (const p of data.properties) {
  if (countByProp[p.id] != null) p.total_units = countByProp[p.id];
}

fs.writeFileSync(FALLBACK, JSON.stringify(data, null, 2), 'utf8');

console.log('Wrote 20 units (5 per property):');
for (const [pid, n] of Object.entries(countByProp)) {
  const p = data.properties.find((x) => x.id === pid);
  console.log(`  ${p ? p.name : pid}: ${n} units, total_units set to ${n}`);
}
console.log('\\nRESTART the dev server so the in-memory store rehydrates from this file.');
console.log('  (Ctrl+C the `npm run dev` process, then `npm run dev` again.)');
