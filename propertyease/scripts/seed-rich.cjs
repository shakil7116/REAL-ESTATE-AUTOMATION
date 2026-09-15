/* eslint-disable */
// One-off script: writes rich Qatar demo data to .data/fallback.json so the
// user sees images and QAR money figures on the very next reload.
//
// Run with:  node scripts/seed-rich.cjs
//
// Safe to run multiple times — reads existing file first, only writes if
// current data has no images (additive; never overwrites user data).

const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '..', '.data');
const FALLBACK = path.join(DATA_DIR, 'fallback.json');

const COVERS = {
  'Al Mansura Complex': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=80&auto=format&fit=crop',
  'Asmaco Residence':   'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1600&q=80&auto=format&fit=crop',
  'Al Thumama 103':     'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=1600&q=80&auto=format&fit=crop',
  'Marina Tower':       'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1600&q=80&auto=format&fit=crop',
};

const GALLERY = [
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1556909190-eccf4a8bf97a?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80&auto=format&fit=crop',
];

function unitGallery(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return [0, 1, 2, 3].map((i) => `${GALLERY[(h + i) % GALLERY.length]}&sig=${h}-${i}`);
}

const now = new Date().toISOString();

const properties = [
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
    description: 'Modern residential complex in the heart of Al Mansura.',
    status: 'active',
    monthly_maintenance_fee: 350,
    images: [COVERS['Al Mansura Complex']],
    created_at: now,
    updated_at: now,
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
    images: [COVERS['Asmaco Residence']],
    created_at: now,
    updated_at: now,
  },
  {
    id: 'prop_thumama',
    name: 'Al Thumama 103',
    name_ar: 'الثمامة ١٠٣',
    address: 'Street 24, Bldg 103, Nafa St, Al Thumama',
    address_ar: 'شارع ٢٤، مبنى ١٠٣، شارع نفاع، الثمامة',
    city: 'Doha',
    country: 'Qatar',
    property_type: 'residential',
    total_units: 24,
    description: 'Premium villa-style units in Al Thumama, near the stadium district.',
    status: 'under_renovation',
    monthly_maintenance_fee: 450,
    images: [COVERS['Al Thumama 103']],
    created_at: now,
    updated_at: now,
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
    images: [COVERS['Marina Tower']],
    created_at: now,
    updated_at: now,
  },
];

const units = [
  { id: 'u_mansura_a1', property_id: 'prop_almansura', unit_number: 'A-101', floor: 1, bedrooms: 2, bathrooms: 2, area_sqft: 1100, monthly_rent: 6500,  security_deposit: 6500,  furnishing: 'unfurnished',     status: 'occupied',   description: 'Spacious 2BR with balcony facing the courtyard.', amenities: ['parking', 'gym', 'security'],         images: unitGallery('mansura-a1'), created_at: now, updated_at: now },
  { id: 'u_mansura_a2', property_id: 'prop_almansura', unit_number: 'A-102', floor: 1, bedrooms: 1, bathrooms: 1, area_sqft: 720,  monthly_rent: 4800,  security_deposit: 4800,  furnishing: 'semi_furnished',  status: 'occupied',   description: 'Bright 1BR near elevator.',                       amenities: ['parking', 'security'],             images: unitGallery('mansura-a2'), created_at: now, updated_at: now },
  { id: 'u_mansura_b1', property_id: 'prop_almansura', unit_number: 'B-201', floor: 2, bedrooms: 3, bathrooms: 2, area_sqft: 1450, monthly_rent: 8500,  security_deposit: 8500,  furnishing: 'fully_furnished', status: 'occupied',   description: 'Premium 3BR with sea glimpse.',                    amenities: ['parking', 'gym', 'pool'],           images: unitGallery('mansura-b1'), created_at: now, updated_at: now },
  { id: 'u_mansura_b2', property_id: 'prop_almansura', unit_number: 'B-202', floor: 2, bedrooms: 2, bathrooms: 2, area_sqft: 1200, monthly_rent: 7000,  security_deposit: 7000,  furnishing: 'unfurnished',     status: 'vacant',     description: 'Vacant — recently painted, new AC.',               amenities: ['parking', 'gym'],                 images: unitGallery('mansura-b2'), created_at: now, updated_at: now },
  { id: 'u_mansura_c1', property_id: 'prop_almansura', unit_number: 'C-301', floor: 3, bedrooms: 2, bathrooms: 2, area_sqft: 1150, monthly_rent: 6800,  security_deposit: 6800,  furnishing: 'unfurnished',     status: 'reserved',   description: 'Reserved by corporate tenant.',                   amenities: ['parking', 'security'],             images: unitGallery('mansura-c1'), created_at: now, updated_at: now },
  { id: 'u_asmaco_1',   property_id: 'prop_asmaco',    unit_number: '101',   floor: 1, bedrooms: 1, bathrooms: 1, area_sqft: 680,  monthly_rent: 4200,  security_deposit: 4200,  furnishing: 'unfurnished',     status: 'occupied',   description: 'Cozy 1BR, ground floor.',                         amenities: ['parking', 'security'],             images: unitGallery('asmaco-1'),   created_at: now, updated_at: now },
  { id: 'u_asmaco_2',   property_id: 'prop_asmaco',    unit_number: '202',   floor: 2, bedrooms: 2, bathrooms: 2, area_sqft: 1050, monthly_rent: 5800,  security_deposit: 5800,  furnishing: 'semi_furnished',  status: 'occupied',   description: 'Family 2BR, pool view.',                          amenities: ['parking', 'gym', 'pool'],           images: unitGallery('asmaco-2'),   created_at: now, updated_at: now },
  { id: 'u_asmaco_3',   property_id: 'prop_asmaco',    unit_number: '303',   floor: 3, bedrooms: 3, bathrooms: 2, area_sqft: 1380, monthly_rent: 7800,  security_deposit: 7800,  furnishing: 'fully_furnished', status: 'occupied',   description: 'Top-floor 3BR, fully furnished.',                  amenities: ['parking', 'gym', 'pool'],           images: unitGallery('asmaco-3'),   created_at: now, updated_at: now },
  { id: 'u_asmaco_4',   property_id: 'prop_asmaco',    unit_number: '404',   floor: 4, bedrooms: 2, bathrooms: 2, area_sqft: 1080, monthly_rent: 6000,  security_deposit: 6000,  furnishing: 'unfurnished',     status: 'maintenance', description: 'Under AC maintenance.',                          amenities: ['parking', 'gym'],                 images: unitGallery('asmaco-4'),   created_at: now, updated_at: now },
  { id: 'u_thumama_1',  property_id: 'prop_thumama',   unit_number: 'V-1',   floor: 1, bedrooms: 4, bathrooms: 3, area_sqft: 2400, monthly_rent: 14000, security_deposit: 14000, furnishing: 'fully_furnished', status: 'vacant',     description: 'Standalone villa, 4BR + maid room.',              amenities: ['parking', 'garden', 'pool'],        images: unitGallery('thumama-1'),  created_at: now, updated_at: now },
  { id: 'u_thumama_2',  property_id: 'prop_thumama',   unit_number: 'V-2',   floor: 1, bedrooms: 3, bathrooms: 2, area_sqft: 1900, monthly_rent: 11000, security_deposit: 11000, furnishing: 'unfurnished',     status: 'vacant',     description: '3BR villa, end of compound.',                     amenities: ['parking', 'garden'],               images: unitGallery('thumama-2'),  created_at: now, updated_at: now },
  { id: 'u_marina_p1',  property_id: 'prop_marina',    unit_number: 'P-1201',floor: 12,bedrooms: 1, bathrooms: 1, area_sqft: 780,  monthly_rent: 9500,  security_deposit: 9500,  furnishing: 'fully_furnished', status: 'occupied',   description: 'Sea-view 1BR on The Pearl.',                      amenities: ['parking', 'gym', 'pool', 'beach'],  images: unitGallery('marina-p1'),  created_at: now, updated_at: now },
  { id: 'u_marina_p2',  property_id: 'prop_marina',    unit_number: 'P-1402',floor: 14,bedrooms: 2, bathrooms: 2, area_sqft: 1250, monthly_rent: 13500, security_deposit: 13500, furnishing: 'fully_furnished', status: 'occupied',   description: 'Marina-facing 2BR.',                              amenities: ['parking', 'gym', 'pool', 'beach'],  images: unitGallery('marina-p2'),  created_at: now, updated_at: now },
  { id: 'u_marina_r1',  property_id: 'prop_marina',    unit_number: 'R-001', floor: 1, bedrooms: 0, bathrooms: 1, area_sqft: 420,  monthly_rent: 18000, security_deposit: 36000, furnishing: 'unfurnished',     status: 'occupied',   description: 'Ground-floor retail unit.',                       amenities: ['parking'],                        images: unitGallery('marina-r1'),  created_at: now, updated_at: now },
  { id: 'u_marina_p3',  property_id: 'prop_marina',    unit_number: 'P-1801',floor: 18,bedrooms: 3, bathrooms: 3, area_sqft: 1900, monthly_rent: 21000, security_deposit: 21000, furnishing: 'fully_furnished', status: 'vacant',     description: 'Penthouse-level 3BR.',                            amenities: ['parking', 'gym', 'pool', 'concierge'], images: unitGallery('marina-p3'), created_at: now, updated_at: now },
];

const tenants = [
  { id: 't_qa_001', name: 'Ahmed Al-Sulaiti',   name_ar: 'أحمد السليطي',     email: 'ahmed.sulaiti@example.qa', phone: '+974 5555 1234', nationality: 'Qatar',     company: null,              notes: 'Long-term tenant (3+ years).',  created_at: now, updated_at: now },
  { id: 't_qa_002', name: 'Mariam Al-Kuwari',   name_ar: 'مريم الكواري',     email: 'mariam.k@example.qa',     phone: '+974 5555 5678', nationality: 'Qatar',     company: null,              notes: null,                          created_at: now, updated_at: now },
  { id: 't_qa_003', name: 'Khalid Al-Mansoori', name_ar: 'خالد المنصوري',     email: 'khalid.m@example.qa',     phone: '+974 6666 1111', nationality: 'Qatar',     company: 'Al Mansoori Trading', notes: null,                          created_at: now, updated_at: now },
  { id: 't_qa_004', name: 'Sarah Mitchell',     name_ar: 'سارة ميتشل',       email: 'sarah.m@example.com',     phone: '+974 7777 2222', nationality: 'UK',        company: null,              notes: 'Diplomatic tenant.',           created_at: now, updated_at: now },
  { id: 't_qa_005', name: 'Hiroshi Tanaka',     name_ar: 'هيروشي تاناكا',    email: 'h.tanaka@example.com',    phone: '+974 7777 3333', nationality: 'Japan',     company: 'Marubeni Corp',    notes: null,                          created_at: now, updated_at: now },
  { id: 't_qa_006', name: 'Priya Sharma',       name_ar: 'بريا شارما',       email: 'priya.s@example.com',     phone: '+974 7777 4444', nationality: 'India',     company: null,              notes: null,                          created_at: now, updated_at: now },
  { id: 't_qa_007', name: 'Doha Boutique LLC',  name_ar: 'دوحة بوتيك ش.ش.و', email: 'lease@dohaboutique.qa',  phone: '+974 4444 5555', nationality: 'Corporate', company: 'Doha Boutique LLC', notes: 'Retail tenant, Marina Tower.',  created_at: now, updated_at: now },
];

const leases = [
  { id: 'l_001', lease_number: 'L-2025-001', tenant_id: 't_qa_001', unit_id: 'u_mansura_a1', start_date: '2025-01-15', end_date: '2026-01-14', monthly_rent: 6500,  payment_day: 15, payment_method: 'bank_transfer', security_deposit: 6500,  status: 'active',         created_at: now, updated_at: now },
  { id: 'l_002', lease_number: 'L-2025-002', tenant_id: 't_qa_002', unit_id: 'u_mansura_a2', start_date: '2025-03-01', end_date: '2026-02-28', monthly_rent: 4800,  payment_day: 1,  payment_method: 'pdc',           security_deposit: 4800,  status: 'active',         created_at: now, updated_at: now },
  { id: 'l_003', lease_number: 'L-2025-003', tenant_id: 't_qa_003', unit_id: 'u_mansura_b1', start_date: '2024-09-01', end_date: '2025-08-31', monthly_rent: 8500,  payment_day: 1,  payment_method: 'bank_transfer', security_deposit: 8500,  status: 'active',         created_at: now, updated_at: now },
  { id: 'l_004', lease_number: 'L-2025-004', tenant_id: 't_qa_004', unit_id: 'u_asmaco_1',   start_date: '2025-02-01', end_date: '2026-01-31', monthly_rent: 4200,  payment_day: 1,  payment_method: 'pdc',           security_deposit: 4200,  status: 'active',         created_at: now, updated_at: now },
  { id: 'l_005', lease_number: 'L-2025-005', tenant_id: 't_qa_005', unit_id: 'u_asmaco_2',   start_date: '2025-04-15', end_date: '2026-04-14', monthly_rent: 5800,  payment_day: 15, payment_method: 'bank_transfer', security_deposit: 5800,  status: 'active',         created_at: now, updated_at: now },
  { id: 'l_006', lease_number: 'L-2025-006', tenant_id: 't_qa_006', unit_id: 'u_asmaco_3',   start_date: '2024-11-01', end_date: '2025-10-31', monthly_rent: 7800,  payment_day: 1,  payment_method: 'pdc',           security_deposit: 7800,  status: 'pending_renewal', created_at: now, updated_at: now },
  { id: 'l_007', lease_number: 'L-2025-007', tenant_id: 't_qa_004', unit_id: 'u_marina_p1',  start_date: '2025-01-01', end_date: '2025-12-31', monthly_rent: 9500,  payment_day: 1,  payment_method: 'bank_transfer', security_deposit: 9500,  status: 'active',         created_at: now, updated_at: now },
  { id: 'l_008', lease_number: 'L-2025-008', tenant_id: 't_qa_005', unit_id: 'u_marina_p2',  start_date: '2025-02-15', end_date: '2026-02-14', monthly_rent: 13500, payment_day: 15, payment_method: 'bank_transfer', security_deposit: 13500, status: 'active',         created_at: now, updated_at: now },
  { id: 'l_009', lease_number: 'L-2025-009', tenant_id: 't_qa_007', unit_id: 'u_marina_r1',  start_date: '2024-09-01', end_date: '2027-08-31', monthly_rent: 18000, payment_day: 1,  payment_method: 'bank_transfer', security_deposit: 36000, status: 'active',         created_at: now, updated_at: now },
  { id: 'l_010', lease_number: 'L-2024-088', tenant_id: 't_qa_001', unit_id: 'u_asmaco_4',   start_date: '2024-06-01', end_date: '2025-05-31', monthly_rent: 6000,  payment_day: 1,  payment_method: 'pdc',           security_deposit: 6000,  status: 'expired',        created_at: now, updated_at: now },
];

const payments = [
  { id: 'pay_001', lease_id: 'l_001', tenant_id: 't_qa_001', amount: 6500,  due_date: '2025-08-15', payment_date: '2025-08-14', payment_type: 'rent',            payment_method: 'bank_transfer', bank_reference: 'TXN-A82193', status: 'received', created_at: now, updated_at: now },
  { id: 'pay_002', lease_id: 'l_002', tenant_id: 't_qa_002', amount: 4800,  due_date: '2025-08-01', payment_date: '2025-08-01', payment_type: 'rent',            payment_method: 'pdc',           cheque_number: 'CHQ-33921',   status: 'received', created_at: now, updated_at: now },
  { id: 'pay_003', lease_id: 'l_003', tenant_id: 't_qa_003', amount: 8500,  due_date: '2025-08-01', payment_date: null,         payment_type: 'rent',            payment_method: 'bank_transfer', bank_reference: null,          status: 'pending',  created_at: now, updated_at: now },
  { id: 'pay_004', lease_id: 'l_004', tenant_id: 't_qa_004', amount: 4200,  due_date: '2025-08-01', payment_date: '2025-08-01', payment_type: 'rent',            payment_method: 'pdc',           cheque_number: 'CHQ-33922',   status: 'received', created_at: now, updated_at: now },
  { id: 'pay_005', lease_id: 'l_005', tenant_id: 't_qa_005', amount: 5800,  due_date: '2025-08-15', payment_date: '2025-08-13', payment_type: 'rent',            payment_method: 'bank_transfer', bank_reference: 'TXN-A83001', status: 'received', created_at: now, updated_at: now },
  { id: 'pay_006', lease_id: 'l_006', tenant_id: 't_qa_006', amount: 7800,  due_date: '2025-08-01', payment_date: null,         payment_type: 'rent',            payment_method: 'pdc',           cheque_number: 'CHQ-33923',   status: 'overdue',  created_at: now, updated_at: now },
  { id: 'pay_007', lease_id: 'l_007', tenant_id: 't_qa_004', amount: 9500,  due_date: '2025-08-01', payment_date: '2025-08-01', payment_type: 'rent',            payment_method: 'bank_transfer', bank_reference: 'TXN-A83214', status: 'received', created_at: now, updated_at: now },
  { id: 'pay_008', lease_id: 'l_008', tenant_id: 't_qa_005', amount: 13500, due_date: '2025-08-15', payment_date: '2025-08-15', payment_type: 'rent',            payment_method: 'bank_transfer', bank_reference: 'TXN-A83301', status: 'received', created_at: now, updated_at: now },
  { id: 'pay_009', lease_id: 'l_009', tenant_id: 't_qa_007', amount: 18000, due_date: '2025-08-01', payment_date: '2025-08-01', payment_type: 'rent',            payment_method: 'bank_transfer', bank_reference: 'TXN-A83450', status: 'received', created_at: now, updated_at: now },
  { id: 'pay_010', lease_id: 'l_001', tenant_id: 't_qa_001', amount: 6500,  due_date: '2025-07-15', payment_date: '2025-07-15', payment_type: 'rent',            payment_method: 'bank_transfer', bank_reference: 'TXN-A79012', status: 'received', created_at: now, updated_at: now },
  { id: 'pay_011', lease_id: 'l_003', tenant_id: 't_qa_003', amount: 8500,  due_date: '2025-07-01', payment_date: '2025-07-02', payment_type: 'rent',            payment_method: 'bank_transfer', bank_reference: 'TXN-A79013', status: 'received', created_at: now, updated_at: now },
  { id: 'pay_012', lease_id: 'l_007', tenant_id: 't_qa_004', amount: 9500,  due_date: '2025-07-01', payment_date: '2025-07-01', payment_type: 'rent',            payment_method: 'bank_transfer', bank_reference: 'TXN-A79015', status: 'received', created_at: now, updated_at: now },
  { id: 'pay_013', lease_id: 'l_009', tenant_id: 't_qa_007', amount: 18000, due_date: '2025-07-01', payment_date: '2025-07-01', payment_type: 'rent',            payment_method: 'bank_transfer', bank_reference: 'TXN-A79017', status: 'received', created_at: now, updated_at: now },
  { id: 'pay_014', lease_id: 'l_010', tenant_id: 't_qa_001', amount: 6000,  due_date: '2025-05-01', payment_date: '2025-05-01', payment_type: 'rent',            payment_method: 'pdc',           cheque_number: 'CHQ-31800',   status: 'bounced',  created_at: now, updated_at: now },
  { id: 'pay_015', lease_id: 'l_005', tenant_id: 't_qa_005', amount: 250,   due_date: '2025-08-15', payment_date: '2025-08-15', payment_type: 'maintenance_fee', payment_method: 'bank_transfer', bank_reference: 'TXN-A83501', status: 'received', created_at: now, updated_at: now },
];

const maintenance = [
  { id: 'mt_001', ticket_number: 'MT-1001', unit_id: 'u_mansura_a1', tenant_id: 't_qa_001', title: 'AC not cooling in master bedroom', description: 'Unit blowing room-temp air since yesterday morning.', priority: 'high',     category: 'HVAC',       status: 'in_progress', images: [], resolution_images: [], resolution: null,             estimated_cost: 450,  actual_cost: null, scheduled_date: '2025-08-20', completed_date: null,         created_at: now, updated_at: now },
  { id: 'mt_002', ticket_number: 'MT-1002', unit_id: 'u_asmaco_3',   tenant_id: 't_qa_006', title: 'Kitchen sink blocked',             description: 'Water draining very slowly.',                          priority: 'medium',   category: 'Plumbing',   status: 'open',        images: [], resolution_images: [], resolution: null,             estimated_cost: 200,  actual_cost: null, scheduled_date: null,         completed_date: null,         created_at: now, updated_at: now },
  { id: 'mt_003', ticket_number: 'MT-1003', unit_id: 'u_marina_p1',  tenant_id: 't_qa_004', title: 'Smart lock battery low',           description: 'Lock beeping red, needs battery replacement.',        priority: 'low',      category: 'Electrical', status: 'completed',   images: [], resolution_images: [], resolution: 'Replaced batteries', estimated_cost: 80,   actual_cost: 65,  scheduled_date: '2025-08-10', completed_date: '2025-08-10', created_at: now, updated_at: now },
  { id: 'mt_004', ticket_number: 'MT-1004', unit_id: 'u_mansura_b1', tenant_id: 't_qa_003', title: 'Elevator making grinding noise',   description: 'Audible grinding when descending from floor 8.',       priority: 'urgent',   category: 'Mechanical', status: 'open',        images: [], resolution_images: [], resolution: null,             estimated_cost: 1800, actual_cost: null, scheduled_date: null,         completed_date: null,         created_at: now, updated_at: now },
  { id: 'mt_005', ticket_number: 'MT-1005', unit_id: 'u_asmaco_2',   tenant_id: 't_qa_005', title: 'Bathroom exhaust fan noisy',       description: 'Loud rattling noise from bathroom fan.',                priority: 'low',      category: 'Electrical', status: 'completed',   images: [], resolution_images: [], resolution: 'Tightened mounting', estimated_cost: 120,  actual_cost: 90,  scheduled_date: '2025-08-05', completed_date: '2025-08-05', created_at: now, updated_at: now },
];

const leads = [
  { id: 'ld_001', name: 'Mohammed K.', phone: '+974 5555 8888', email: 'mohammed.k@example.qa', source: 'meta_ads',        source_detail: 'Facebook — Pearl-Qatar campaign', property_interest: '2BR, Marina Tower',  budget: 12000, status: 'interested', notes: 'Wants to view next weekend.',   created_at: now, updated_at: now },
  { id: 'ld_002', name: 'Priya S.',    phone: '+974 5555 7777', email: 'priya.s@example.com',  source: 'google_ads',      source_detail: 'Google Search — Al Sadd',          property_interest: '1BR, Asmaco',        budget: 5000,  status: 'contacted',  notes: null,                            created_at: now, updated_at: now },
  { id: 'ld_003', name: 'James L.',    phone: '+974 5555 6666', email: null,                  source: 'property_finder', source_detail: null,                              property_interest: '3BR, Al Thumama',    budget: 14000, status: 'visited',    notes: 'Visited with family on 12 Aug.', created_at: now, updated_at: now },
  { id: 'ld_004', name: 'Fatima H.',   phone: '+974 5555 5555', email: null,                  source: 'direct',          source_detail: 'Walk-in',                          property_interest: '2BR, Al Mansura',    budget: 6500,  status: 'new',        notes: null,                            created_at: now, updated_at: now },
  { id: 'ld_005', name: 'Chen W.',     phone: '+974 5555 4444', email: 'chen.w@example.com',   source: 'meta_ads',        source_detail: 'Instagram — Pearl-Qatar',          property_interest: 'Retail, Marina Tower', budget: 22000, status: 'converted',  notes: 'Converted — signed lease l_009.', created_at: now, updated_at: now },
  { id: 'ld_006', name: 'Layla N.',    phone: '+974 5555 3333', email: 'layla.n@example.qa',   source: 'referral',        source_detail: 'Referred by Ahmed Al-Sulaiti',     property_interest: '3BR, Al Mansura',    budget: 9000,  status: 'interested', notes: 'Wants to move in by October.',  created_at: now, updated_at: now },
];

const ad_campaigns = [
  { id: 'c_001', name: 'Marina Tower — Pearl Living',    platform: 'meta',            campaign_id_external: '2385000001', start_date: '2025-07-01', end_date: '2025-09-30', budget: 8000, spent: 5200, status: 'active',    target_audience: 'Expats, 30-50, Pearl-Qatar area', objective: 'Leads', created_at: now, updated_at: now },
  { id: 'c_002', name: 'Al Mansura — Family Residences', platform: 'google',          campaign_id_external: 'G-7781001',  start_date: '2025-07-15', end_date: '2025-10-15', budget: 5000, spent: 3100, status: 'active',    target_audience: 'Qatari nationals, families',       objective: 'Leads', created_at: now, updated_at: now },
  { id: 'c_003', name: 'Al Thumama Villas — Premium',    platform: 'property_finder', campaign_id_external: 'PF-209',      start_date: '2025-08-01', end_date: '2025-11-30', budget: 6000, spent: 1800, status: 'active',    target_audience: 'HNI, 4BR+ seekers',                objective: 'Leads', created_at: now, updated_at: now },
  { id: 'c_004', name: 'Asmaco — Affordable Units',      platform: 'meta',            campaign_id_external: '2385000042', start_date: '2025-06-01', end_date: '2025-08-31', budget: 3500, spent: 3500, status: 'completed', target_audience: 'Budget renters, 25-35',            objective: 'Leads', created_at: now, updated_at: now },
];

const bundle = { properties, units, tenants, leases, payments, maintenance, leads, ad_campaigns };

// Merge mode: keep any existing user-entered data, and only add the demo
// records that don't already exist (matched by id). Idempotent — re-running
// this script is safe.

const existing = fs.existsSync(FALLBACK)
  ? JSON.parse(fs.readFileSync(FALLBACK, 'utf8'))
  : { properties: [], units: [], tenants: [], leases: [], payments: [], maintenance: [], leads: [], ad_campaigns: [] };

const beforeCounts = {
  properties:    (existing.properties    || []).length,
  units:         (existing.units         || []).length,
  tenants:       (existing.tenants       || []).length,
  leases:        (existing.leases        || []).length,
  payments:      (existing.payments      || []).length,
  maintenance:   (existing.maintenance   || []).length,
  leads:         (existing.leads         || []).length,
  ad_campaigns:  (existing.ad_campaigns  || []).length,
};

function mergeById(existingList, additions) {
  const ids = new Set((existingList || []).map((r) => r.id));
  const fresh = (additions || []).filter((r) => !ids.has(r.id));
  return [...(existingList || []), ...fresh];
}

const merged = {
  properties:    mergeById(existing.properties,    properties),
  units:         mergeById(existing.units,         units),
  tenants:       mergeById(existing.tenants,       tenants),
  leases:        mergeById(existing.leases,        leases),
  payments:      mergeById(existing.payments,      payments),
  maintenance:   mergeById(existing.maintenance,   maintenance),
  leads:         mergeById(existing.leads,         leads),
  ad_campaigns:  mergeById(existing.ad_campaigns,  ad_campaigns),
};

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.writeFileSync(FALLBACK, JSON.stringify(merged, null, 2), 'utf8');

const added = {
  properties:    merged.properties.length    - beforeCounts.properties,
  units:         merged.units.length         - beforeCounts.units,
  tenants:       merged.tenants.length       - beforeCounts.tenants,
  leases:        merged.leases.length        - beforeCounts.leases,
  payments:      merged.payments.length      - beforeCounts.payments,
  maintenance:   merged.maintenance.length   - beforeCounts.maintenance,
  leads:         merged.leads.length         - beforeCounts.leads,
  ad_campaigns:  merged.ad_campaigns.length  - beforeCounts.ad_campaigns,
};

console.log('Merged rich demo data (preserved user data, added fresh records only):');
for (const [k, v] of Object.entries(added)) {
  console.log(`  +${v} ${k} (total now ${merged[k].length})`);
}
