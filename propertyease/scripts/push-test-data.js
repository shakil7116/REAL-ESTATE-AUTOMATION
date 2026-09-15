#!/usr/bin/env node
/**
 * Push comprehensive Qatar-themed test data into .data/fallback.json.
 * Runs idempotently — only writes if the file is missing or nearly empty.
 * No Supabase required; writes directly to the fallback store.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '.data');
const FALLBACK_FILE = path.join(DATA_DIR, 'fallback.json');

// ── Image helpers (deterministic, no API key needed) ──────────────────────
const PROPERTY_COVERS = {
  'Al Mansura Complex':  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=80&auto=format&fit=crop',
  'Asmaco Residence':    'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1600&q=80&auto=format&fit=crop',
  'Al Thumama Villas':   'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=1600&q=80&auto=format&fit=crop',
  'The Pearl Residences':'https://images.unsplash.com/photo-1493889054271-3f80a70597db?w=1600&q=80&auto=format&fit=crop',
};

function galleryImages(seed, count = 4) {
  const BASE = [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80',
    'https://images.unsplash.com/photo-1556909114-eccf4a8bf97a?w=1200&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80',
    'https://images.unsplash.com/photo-1493889054271-3f80a70597db?w=1200&q=80',
    'https://images.unsplash.com/photo-1560448205-dced3490d0b0?w=1200&q=80',
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(BASE[(h + i) % BASE.length] + '&sig=' + (h + i));
  }
  return out;
}

// ── Fixtures ──────────────────────────────────────────────────────────────
const NOW = new Date().toISOString();

const PROPERTIES = [
  {
    id: 'qa-almansura',
    name: 'Al Mansura Complex',
    name_ar: 'مجمع المنصورة',
    address: 'Najma Street, Al Mansura',
    address_ar: 'شارع النجمة، المنصورة',
    city: 'Doha',
    country: 'Qatar',
    property_type: 'residential',
    total_units: 24,
    description: 'Modern residential complex in the heart of Al Mansura. Walking distance to the metro and Corniche.',
    description_ar: 'مجمع سكني حديث في قلب المنصورة. على بعد خطوات من المترو والكورنيش.',
    status: 'active',
    monthly_maintenance_fee: 350,
    images: [PROPERTY_COVERS['Al Mansura Complex']],
    created_at: '2024-06-15T08:00:00.000Z',
    updated_at: NOW,
  },
  {
    id: 'qa-asmaco',
    name: 'Asmaco Residence',
    name_ar: 'إسماكو ريزيدنس',
    address: 'Al Salihya, Building 7',
    address_ar: 'الصالحية، مبنى ٧',
    city: 'Doha',
    country: 'Qatar',
    property_type: 'residential',
    total_units: 16,
    description: 'Family-friendly low-rise residence with pool, gym, and 24/7 security.',
    description_ar: 'مسكن عائلي منخفض الطوابق مع مسبح وصالة رياضية وأمن على مدار الساعة.',
    status: 'active',
    monthly_maintenance_fee: 280,
    images: [PROPERTY_COVERS['Asmaco Residence']],
    created_at: '2024-07-01T10:00:00.000Z',
    updated_at: NOW,
  },
  {
    id: 'qa-thumama',
    name: 'Al Thumama Villas',
    name_ar: 'فلل الثمامة',
    address: 'Street 24, Bldg No.103, Nafa Street, Al Thumama',
    address_ar: 'شارع ٢٤، مبنى ١٠٣، شارع نفاع، الثمامة',
    city: 'Doha',
    country: 'Qatar',
    property_type: 'residential',
    total_units: 8,
    description: 'Premium villa-style units in Al Thumama, near FIFA stadium district.',
    description_ar: 'وحدات فيلا فاخرة في الثمامة، قرب منطقة استاد الخليج.',
    status: 'active',
    monthly_maintenance_fee: 450,
    images: [PROPERTY_COVERS['Al Thumama Villas']],
    created_at: '2024-08-10T12:00:00.000Z',
    updated_at: NOW,
  },
  {
    id: 'qa-pearl',
    name: 'The Pearl Residences',
    name_ar: 'رزنسدنزل اللؤلؤة',
    address: 'The Pearl-Qatar, Tower 12',
    address_ar: 'اللؤلؤة-قطر، برج ١٢',
    city: 'Doha',
    country: 'Qatar',
    property_type: 'mixed',
    total_units: 32,
    description: 'Mixed-use tower on The Pearl — residential and retail units with sea views.',
    description_ar: 'برج مختلط الاستخدام في اللؤلؤة — وحدات سكنية وتجارية بإطلالة بحرية.',
    status: 'active',
    monthly_maintenance_fee: 600,
    images: [PROPERTY_COVERS['The Pearl Residences']],
    created_at: '2024-05-20T09:00:00.000Z',
    updated_at: NOW,
  },
];

const UNITS = [
  // Al Mansura Complex — 2BRs and 1BRs
  { id:'u-m-a1', property_id:'qa-almansura', unit_number:'A-101', floor:1,  floor_label:'Ground', bedrooms:2, bathrooms:2, living_rooms:1, kitchens:1, has_maid_room:false, has_driver_room:false, balconies:1, parking_spaces:1, has_storage:false, area_sqft:102, monthly_rent:6500,  security_deposit:6500,  furnishing:'unfurnished',     status:'occupied',  description:'Spacious 2BR with balcony facing the courtyard.', description_ar:'شقة ٢ غرف واسعة مع شرفة تطل على الفناء.', amenities:['parking','gym','security'],       images:galleryImages('mansura-a1'),    created_at:'2024-06-20T08:00:00.000Z', updated_at:NOW },
  { id:'u-m-a2', property_id:'qa-almansura', unit_number:'A-102', floor:1,  floor_label:'Ground', bedrooms:1, bathrooms:1, living_rooms:1, kitchens:1, has_maid_room:false, has_driver_room:false, balconies:1, parking_spaces:1, has_storage:false, area_sqft:67,  monthly_rent:4800,  security_deposit:4800,  furnishing:'semi_furnished',  status:'occupied',  description:'Bright 1BR near elevator.',                 description_ar:'شقة غرفة واحدة مشرقة قرب المصعد.', amenities:['parking','security'],            images:galleryImages('mansura-a2'),    created_at:'2024-07-01T09:00:00.000Z', updated_at:NOW },
  { id:'u-m-b1', property_id:'qa-almansura', unit_number:'B-201', floor:2,  floor_label:'1st Floor', bedrooms:3, bathrooms:2, living_rooms:1, kitchens:1, has_maid_room:true,  has_driver_room:false, balconies:1, parking_spaces:2, has_storage:true,  area_sqft:135, monthly_rent:8500,  security_deposit:8500,  furnishing:'fully_furnished', status:'occupied',  description:'Premium 3BR with sea glimpse.',             description_ar:'شقة ٣ غرف فاخرة بإطلالة بحرية جزئية.', amenities:['parking','gym','pool','security'],  images:galleryImages('mansura-b1'),    created_at:'2024-06-25T10:00:00.000Z', updated_at:NOW },
  { id:'u-m-b2', property_id:'qa-almansura', unit_number:'B-202', floor:2,  floor_label:'1st Floor', bedrooms:2, bathrooms:2, living_rooms:1, kitchens:1, has_maid_room:false, has_driver_room:false, balconies:1, parking_spaces:1, has_storage:false, area_sqft:111, monthly_rent:7000,  security_deposit:7000,  furnishing:'unfurnished',     status:'vacant',    description:'Vacant — recently painted, new AC.',        description_ar:'فارغة — تم طلاؤها حديثاً وتكييف جديد.', amenities:['parking','gym'],               images:galleryImages('mansura-b2'),    created_at:'2024-08-01T11:00:00.000Z', updated_at:NOW },
  { id:'u-m-c1', property_id:'qa-almansura', unit_number:'C-301', floor:3,  floor_label:'2nd Floor', bedrooms:2, bathrooms:2, living_rooms:1, kitchens:1, has_maid_room:false, has_driver_room:false, balconies:1, parking_spaces:1, has_storage:false, area_sqft:107, monthly_rent:6800,  security_deposit:6800,  furnishing:'unfurnished',     status:'reserved',  description:'Reserved by corporate tenant.',             description_ar:'محجوزة من قبل مستأجر مؤسسي.', amenities:['parking','security'],            images:galleryImages('mansura-c1'),    created_at:'2024-07-15T12:00:00.000Z', updated_at:NOW },
  // Asmaco Residence
  { id:'u-as-1', property_id:'qa-asmaco',    unit_number:'101',   floor:1,  floor_label:'Ground', bedrooms:1, bathrooms:1, living_rooms:1, kitchens:1, has_maid_room:false, has_driver_room:false, balconies:0, parking_spaces:1, has_storage:false, area_sqft:63,  monthly_rent:4200,  security_deposit:4200,  furnishing:'unfurnished',     status:'occupied',  description:'Cozy 1BR, ground floor.',                   description_ar:'شقة مريحة بغرفة واحدة، الطابق الأرضي.', amenities:['parking','security'],            images:galleryImages('asmaco-1'),      created_at:'2024-07-10T08:00:00.000Z', updated_at:NOW },
  { id:'u-as-2', property_id:'qa-asmaco',    unit_number:'202',   floor:2,  floor_label:'1st Floor', bedrooms:2, bathrooms:2, living_rooms:1, kitchens:1, has_maid_room:false, has_driver_room:false, balconies:1, parking_spaces:1, has_storage:false, area_sqft:98,  monthly_rent:5800,  security_deposit:5800,  furnishing:'semi_furnished',  status:'occupied',  description:'Family 2BR, pool view.',                    description_ar:'شقة عائلية ٢ غرف بإطلالة على المسبح.', amenities:['parking','gym','pool'],          images:galleryImages('asmaco-2'),      created_at:'2024-07-12T09:00:00.000Z', updated_at:NOW },
  { id:'u-as-3', property_id:'qa-asmaco',    unit_number:'303',   floor:3,  floor_label:'2nd Floor', bedrooms:3, bathrooms:2, living_rooms:1, kitchens:1, has_maid_room:true,  has_driver_room:false, balconies:1, parking_spaces:1, has_storage:true,  area_sqft:128, monthly_rent:7800,  security_deposit:7800,  furnishing:'fully_furnished', status:'occupied',  description:'Top-floor 3BR, fully furnished.',           description_ar:'شقة ٣ غرف في الطابق العلوي مفروشة بالكامل.', amenities:['parking','gym','pool'],          images:galleryImages('asmaco-3'),      created_at:'2024-08-05T10:00:00.000Z', updated_at:NOW },
  { id:'u-as-4', property_id:'qa-asmaco',    unit_number:'404',   floor:4,  floor_label:'3rd Floor', bedrooms:2, bathrooms:2, living_rooms:1, kitchens:1, has_maid_room:false, has_driver_room:false, balconies:0, parking_spaces:1, has_storage:false, area_sqft:100, monthly_rent:6000,  security_deposit:6000,  furnishing:'unfurnished',     status:'maintenance', description:'Under AC maintenance.',                   description_ar:'تحت صيانة التكييف.', amenities:['parking','gym'],             images:galleryImages('asmaco-4'),      created_at:'2024-08-10T11:00:00.000Z', updated_at:NOW },
  // Al Thumama Villas
  { id:'u-th-1', property_id:'qa-thumama',   unit_number:'V-1',   floor:1,  floor_label:'Ground', bedrooms:4, bathrooms:3, living_rooms:2, kitchens:1, has_maid_room:true,  has_driver_room:true,  balconies:2, parking_spaces:2, has_storage:true,  area_sqft:223, monthly_rent:14000, security_deposit:14000, furnishing:'fully_furnished', status:'vacant',    description:'Standalone villa, 4BR + maid room.',        description_ar:'فيلا مستقلة ٤ غرف + غرفة خدم.', amenities:['parking','garden','pool'],      images:galleryImages('thumama-v1'),    created_at:'2024-09-01T08:00:00.000Z', updated_at:NOW },
  { id:'u-th-2', property_id:'qa-thumama',   unit_number:'V-2',   floor:1,  floor_label:'Ground', bedrooms:3, bathrooms:2, living_rooms:1, kitchens:1, has_maid_room:true,  has_driver_room:false, balconies:1, parking_spaces:2, has_storage:false, area_sqft:177, monthly_rent:11000, security_deposit:11000, furnishing:'unfurnished',     status:'vacant',    description:'3BR villa, end of compound.',               description_ar:'فيلا ٣ غرف في نهاية المركب.', amenities:['parking','garden'],          images:galleryImages('thumama-v2'),    created_at:'2024-09-05T09:00:00.000Z', updated_at:NOW },
  // The Pearl Residences
  { id:'u-pl-p1', property_id:'qa-pearl',    unit_number:'P-1201',floor:12, floor_label:'12th Floor', bedrooms:1, bathrooms:1, living_rooms:1, kitchens:1, has_maid_room:false, has_driver_room:false, balconies:1, parking_spaces:1, has_storage:false, area_sqft:73,  monthly_rent:9500,  security_deposit:9500,  furnishing:'fully_furnished', status:'occupied',  description:'Sea-view 1BR on The Pearl.',                description_ar:'شقة ١ غرفة بإطلالة بحرية في اللؤلؤة.', amenities:['parking','gym','pool','beach'],   images:galleryImages('pearl-p1'),      created_at:'2024-06-01T08:00:00.000Z', updated_at:NOW },
  { id:'u-pl-p2', property_id:'qa-pearl',    unit_number:'P-1402',floor:14, floor_label:'14th Floor', bedrooms:2, bathrooms:2, living_rooms:1, kitchens:1, has_maid_room:false, has_driver_room:false, balconies:1, parking_spaces:1, has_storage:false, area_sqft:116, monthly_rent:13500, security_deposit:13500, furnishing:'fully_furnished', status:'occupied',  description:'Marina-facing 2BR.',                        description_ar:'شقة ٢ غرف بإطلالة على المارينا.', amenities:['parking','gym','pool','beach'],   images:galleryImages('pearl-p2'),      created_at:'2024-06-15T09:00:00.000Z', updated_at:NOW },
  { id:'u-pl-r1', property_id:'qa-pearl',    unit_number:'R-001', floor:1,  floor_label:'Ground', bedrooms:0, bathrooms:1, living_rooms:1, kitchens:1, has_maid_room:false, has_driver_room:false, balconies:0, parking_spaces:1, has_storage:false, area_sqft:39,  monthly_rent:18000, security_deposit:36000, furnishing:'unfurnished',     status:'occupied',  description:'Ground-floor retail unit.',               description_ar:'وحدة تجارية في الطابق الأرضي.', amenities:['parking'],                   images:galleryImages('pearl-r1'),      created_at:'2024-05-25T10:00:00.000Z', updated_at:NOW },
  { id:'u-pl-p3', property_id:'qa-pearl',    unit_number:'P-1801',floor:18, floor_label:'Penthouse', bedrooms:3, bathrooms:3, living_rooms:2, kitchens:1, has_maid_room:true,  has_driver_room:true,  balconies:2, parking_spaces:2, has_storage:true,  area_sqft:177, monthly_rent:21000, security_deposit:21000, furnishing:'fully_furnished', status:'vacant',    description:'Penthouse-level 3BR with panoramic sea view.', description_ar:'بنتهاوس ٣ غرف بإطلالة بحرية بانورامية.', amenities:['parking','gym','pool','concierge'], images:galleryImages('pearl-p3'),     created_at:'2024-07-20T11:00:00.000Z', updated_at:NOW },
  { id:'u-pl-p4', property_id:'qa-pearl',    unit_number:'P-1502',floor:15, floor_label:'15th Floor', bedrooms:2, bathrooms:2, living_rooms:1, kitchens:1, has_maid_room:false, has_driver_room:false, balconies:1, parking_spaces:1, has_storage:false, area_sqft:110, monthly_rent:12000, security_deposit:12000, furnishing:'semi_furnished',  status:'occupied',  description:'15th floor 2BR, partially furnished.',       description_ar:'شقة ٢ غرف في الطابق ١٥، شبه مفروشة.', amenities:['parking','gym','pool'],          images:galleryImages('pearl-p4'),      created_at:'2024-08-01T12:00:00.000Z', updated_at:NOW },
];

const TENANTS = [
  { id:'t-qa-001', name:'Ahmed Al-Sulaiti',     name_ar:'أحمد السليطي',    email:'ahmed.sulaiti@example.qa', phone:'+974 5555 1234', phone2:null, id_type:'qd', id_number:'29001234567', nationality:'Qatari',    emergency_contact:'Fatima S.',  emergency_phone:'+974 5555 1235', company:null,           notes:'Long-term tenant (3+ years). Trusted payment history.',                  created_at:'2024-01-15T08:00:00.000Z', updated_at:NOW },
  { id:'t-qa-002', name:'Mariam Al-Kuwari',     name_ar:'مريم الكواري',    email:'mariam.k@example.qa',    phone:'+974 5555 5678', phone2:null, id_type:'qd', id_number:'29007654321', nationality:'Qatari',    emergency_contact:'Khalid K.',  emergency_phone:'+974 5555 5679', company:null,           notes:null,                                                                     created_at:'2024-03-01T09:00:00.000Z', updated_at:NOW },
  { id:'t-qa-003', name:'Khalid Al-Mansoori',   name_ar:'خالد المنصوري',   email:'khalid.m@example.qa',    phone:'+974 6666 1111', phone2:'+974 6666 1112', id_type:'qd', id_number:'29011223344', nationality:'Qatari',    emergency_contact:null,   emergency_phone:null,             company:'Al Mansoori Trading', notes:null,                                                             created_at:'2024-04-10T10:00:00.000Z', updated_at:NOW },
  { id:'t-qa-004', name:'Sarah Mitchell',       name_ar:'سارة ميتشل',       email:'sarah.m@example.com',    phone:'+974 7777 2222', phone2:null, id_type:'passport', id_number:'GB12345678',  nationality:'British',   emergency_contact:'John M.',  emergency_phone:'+44 20 7946 0958', company:null,         notes:'Diplomatic tenant — embassy housing.',                                     created_at:'2024-02-20T11:00:00.000Z', updated_at:NOW },
  { id:'t-qa-005', name:'Hiroshi Tanaka',       name_ar:'هيروشي تاناكا',       email:'h.tanaka@example.com',   phone:'+974 7777 3333', phone2:null, id_type:'passport', id_number:'JP87654321',  nationality:'Japanese',  emergency_contact:null,   emergency_phone:null,             company:'Marubeni Corp',  notes:null,                                                                     created_at:'2024-05-01T08:00:00.000Z', updated_at:NOW },
  { id:'t-qa-006', name:'Priya Sharma',         name_ar:'بريا شارما',         email:'priya.s@example.com',    phone:'+974 7777 4444', phone2:null, id_type:'qd', id_number:'29098765432', nationality:'Indian',    emergency_contact:'Raj S.',   emergency_phone:'+974 7777 4445', company:null,         notes:'Late payment history — requires reminder.',                               created_at:'2024-06-15T09:00:00.000Z', updated_at:NOW },
  { id:'t-qa-007', name:'Doha Boutique LLC',    name_ar:'دوحة بوتيك ش.ش.و', email:'lease@dohaboutique.qa',  phone:'+974 4444 5555', phone2:null, id_type:'cr', id_number:'CR-45678',    nationality:'Corporate', emergency_contact:'Omar H.',  emergency_phone:'+974 4444 5556', company:'Doha Boutique LLC', notes:'Retail tenant, Marina Tower ground floor.',                         created_at:'2024-05-25T10:00:00.000Z', updated_at:NOW },
  { id:'t-qa-008', name:'Youssef Hassan',       name_ar:'يوسف حسن',           email:'youssef.h@example.qa',   phone:'+974 5555 9999', phone2:null, id_type:'qd', id_number:'29055667788', nationality:'Egyptian',  emergency_contact:null,   emergency_phone:null,             company:null,         notes:null,                                                                     created_at:'2024-07-01T11:00:00.000Z', updated_at:NOW },
];

const LEASES = [
  { id:'l-001', lease_number:'L-2025-001', tenant_id:'t-qa-001', unit_id:'u-m-a1', start_date:'2025-01-15', end_date:'2026-01-14', monthly_rent:6500,  payment_day:15, payment_method:'bank_transfer', security_deposit:6500,  status:'active',  contract_url:null, special_terms:null,          created_at:'2025-01-10T08:00:00.000Z', updated_at:NOW },
  { id:'l-002', lease_number:'L-2025-002', tenant_id:'t-qa-002', unit_id:'u-m-a2', start_date:'2025-03-01', end_date:'2026-02-28', monthly_rent:4800,  payment_day:1,  payment_method:'pdc',           security_deposit:4800,  status:'active',  contract_url:null, special_terms:'One PDC per quarter', created_at:'2025-02-20T09:00:00.000Z', updated_at:NOW },
  { id:'l-003', lease_number:'L-2025-003', tenant_id:'t-qa-003', unit_id:'u-m-b1', start_date:'2024-09-01', end_date:'2025-08-31', monthly_rent:8500,  payment_day:1,  payment_method:'bank_transfer', security_deposit:8500,  status:'active',  contract_url:null, special_terms:null,          created_at:'2024-08-25T10:00:00.000Z', updated_at:NOW },
  { id:'l-004', lease_number:'L-2025-004', tenant_id:'t-qa-004', unit_id:'u-as-1',   start_date:'2025-02-01', end_date:'2026-01-31', monthly_rent:4200,  payment_day:1,  payment_method:'pdc',           security_deposit:4200,  status:'active',  contract_url:null, special_terms:null,          created_at:'2025-01-25T08:00:00.000Z', updated_at:NOW },
  { id:'l-005', lease_number:'L-2025-005', tenant_id:'t-qa-005', unit_id:'u-as-2',   start_date:'2025-04-15', end_date:'2026-04-14', monthly_rent:5800,  payment_day:15, payment_method:'bank_transfer', security_deposit:5800,  status:'active',  contract_url:null, special_terms:null,          created_at:'2025-04-10T09:00:00.000Z', updated_at:NOW },
  { id:'l-006', lease_number:'L-2025-006', tenant_id:'t-qa-006', unit_id:'u-as-3',   start_date:'2024-11-01', end_date:'2025-10-31', monthly_rent:7800,  payment_day:1,  payment_method:'pdc',           security_deposit:7800,  status:'pending_renewal', contract_url:null, special_terms:'Renewal notice sent Aug 1', created_at:'2024-10-28T10:00:00.000Z', updated_at:NOW },
  { id:'l-007', lease_number:'L-2025-007', tenant_id:'t-qa-004', unit_id:'u-pl-p1',  start_date:'2025-01-01', end_date:'2025-12-31', monthly_rent:9500,  payment_day:1,  payment_method:'bank_transfer', security_deposit:9500,  status:'active',  contract_url:null, special_terms:null,          created_at:'2024-12-20T08:00:00.000Z', updated_at:NOW },
  { id:'l-008', lease_number:'L-2025-008', tenant_id:'t-qa-005', unit_id:'u-pl-p2',  start_date:'2025-02-15', end_date:'2026-02-14', monthly_rent:13500, payment_day:15, payment_method:'bank_transfer', security_deposit:13500, status:'active',  contract_url:null, special_terms:null,          created_at:'2025-02-10T09:00:00.000Z', updated_at:NOW },
  { id:'l-009', lease_number:'L-2025-009', tenant_id:'t-qa-007', unit_id:'u-pl-r1',  start_date:'2024-09-01', end_date:'2027-08-31', monthly_rent:18000, payment_day:1,  payment_method:'bank_transfer', security_deposit:36000, status:'active',  contract_url:null, special_terms:'3-year commercial lease', created_at:'2024-08-25T10:00:00.000Z', updated_at:NOW },
  { id:'l-010', lease_number:'L-2025-010', tenant_id:'t-qa-003', unit_id:'u-pl-p4',  start_date:'2025-06-01', end_date:'2026-05-31', monthly_rent:12000, payment_day:1,  payment_method:'bank_transfer', security_deposit:12000, status:'active',  contract_url:null, special_terms:null,          created_at:'2025-05-25T08:00:00.000Z', updated_at:NOW },
];

const PAYMENTS = [
  // August 2025 — mixed statuses
  { id:'pay-001', lease_id:'l-001', tenant_id:'t-qa-001', amount:6500,  due_date:'2025-08-15', payment_date:'2025-08-14', payment_type:'rent',            payment_method:'bank_transfer', bank_reference:'TXN-A82193',    status:'received', notes:null,              created_at:'2025-08-14T10:00:00.000Z', updated_at:NOW },
  { id:'pay-002', lease_id:'l-002', tenant_id:'t-qa-002', amount:4800,  due_date:'2025-08-01', payment_date:'2025-08-01', payment_type:'rent',            payment_method:'pdc',           cheque_number:'CHQ-33921',     status:'received', notes:null,              created_at:'2025-08-01T09:00:00.000Z', updated_at:NOW },
  { id:'pay-003', lease_id:'l-003', tenant_id:'t-qa-003', amount:8500,  due_date:'2025-08-01', payment_date:null,         payment_type:'rent',            payment_method:'bank_transfer', bank_reference:null,            status:'pending',  notes:'Bank transfer initiated',created_at:'2025-08-01T08:00:00.000Z', updated_at:NOW },
  { id:'pay-004', lease_id:'l-004', tenant_id:'t-qa-004', amount:4200,  due_date:'2025-08-01', payment_date:'2025-08-01', payment_type:'rent',            payment_method:'pdc',           cheque_number:'CHQ-33922',     status:'received', notes:null,              created_at:'2025-08-01T11:00:00.000Z', updated_at:NOW },
  { id:'pay-005', lease_id:'l-005', tenant_id:'t-qa-005', amount:5800,  due_date:'2025-08-15', payment_date:'2025-08-13', payment_type:'rent',            payment_method:'bank_transfer', bank_reference:'TXN-A83001',    status:'received', notes:null,              created_at:'2025-08-13T14:00:00.000Z', updated_at:NOW },
  { id:'pay-006', lease_id:'l-006', tenant_id:'t-qa-006', amount:7800,  due_date:'2025-08-01', payment_date:null,         payment_type:'rent',            payment_method:'pdc',           cheque_number:'CHQ-33923',     status:'overdue',  notes:'PDC returned — contact tenant',created_at:'2025-08-01T07:00:00.000Z', updated_at:NOW },
  { id:'pay-007', lease_id:'l-007', tenant_id:'t-qa-004', amount:9500,  due_date:'2025-08-01', payment_date:'2025-08-01', payment_type:'rent',            payment_method:'bank_transfer', bank_reference:'TXN-A83214',    status:'received', notes:null,              created_at:'2025-08-01T16:00:00.000Z', updated_at:NOW },
  { id:'pay-008', lease_id:'l-008', tenant_id:'t-qa-005', amount:13500, due_date:'2025-08-15', payment_date:'2025-08-15', payment_type:'rent',            payment_method:'bank_transfer', bank_reference:'TXN-A83301',    status:'received', notes:null,              created_at:'2025-08-15T09:00:00.000Z', updated_at:NOW },
  { id:'pay-009', lease_id:'l-009', tenant_id:'t-qa-007', amount:18000, due_date:'2025-08-01', payment_date:'2025-08-01', payment_type:'rent',            payment_method:'bank_transfer', bank_reference:'TXN-A83450',    status:'received', notes:null,              created_at:'2025-08-01T12:00:00.000Z', updated_at:NOW },
  { id:'pay-010', lease_id:'l-010', tenant_id:'t-qa-003', amount:12000, due_date:'2025-08-01', payment_date:'2025-08-01', payment_type:'rent',            payment_method:'bank_transfer', bank_reference:'TXN-A83500',    status:'received', notes:null,              created_at:'2025-08-01T15:00:00.000Z', updated_at:NOW },
  // July 2025 — past received
  { id:'pay-011', lease_id:'l-001', tenant_id:'t-qa-001', amount:6500,  due_date:'2025-07-15', payment_date:'2025-07-15', payment_type:'rent',            payment_method:'bank_transfer', bank_reference:'TXN-A79012',    status:'received', notes:null,              created_at:'2025-07-15T10:00:00.000Z', updated_at:NOW },
  { id:'pay-012', lease_id:'l-003', tenant_id:'t-qa-003', amount:8500,  due_date:'2025-07-01', payment_date:'2025-07-02', payment_type:'rent',            payment_method:'bank_transfer', bank_reference:'TXN-A79013',    status:'received', notes:'1-day late',         created_at:'2025-07-02T09:00:00.000Z', updated_at:NOW },
  { id:'pay-013', lease_id:'l-007', tenant_id:'t-qa-004', amount:9500,  due_date:'2025-07-01', payment_date:'2025-07-01', payment_type:'rent',            payment_method:'bank_transfer', bank_reference:'TXN-A79015',    status:'received', notes:null,              created_at:'2025-07-01T14:00:00.000Z', updated_at:NOW },
  { id:'pay-014', lease_id:'l-009', tenant_id:'t-qa-007', amount:18000, due_date:'2025-07-01', payment_date:'2025-07-01', payment_type:'rent',            payment_method:'bank_transfer', bank_reference:'TXN-A79017',    status:'received', notes:null,              created_at:'2025-07-01T11:00:00.000Z', updated_at:NOW },
  // Bounced & fees
  { id:'pay-015', lease_id:'l-006', tenant_id:'t-qa-006', amount:7800,  due_date:'2025-07-01', payment_date:'2025-07-01', payment_type:'rent',            payment_method:'pdc',           cheque_number:'CHQ-31800',     status:'bounced',  notes:'Insufficient funds',  created_at:'2025-07-01T08:00:00.000Z', updated_at:NOW },
  { id:'pay-016', lease_id:'l-005', tenant_id:'t-qa-005', amount:250,   due_date:'2025-08-15', payment_date:'2025-08-15', payment_type:'maintenance_fee', payment_method:'bank_transfer', bank_reference:'TXN-A83501',    status:'received', notes:'Monthly maintenance',  created_at:'2025-08-15T12:00:00.000Z', updated_at:NOW },
];

const MAINTENANCE_TICKETS = [
  { id:'mt-001', ticket_number:'MT-2025-001', unit_id:'u-m-a1', tenant_id:'t-qa-001', title:'AC not cooling in master bedroom', description:'Unit blowing room-temperature air since yesterday morning. Thermostat seems fine but no cold air.', priority:'high',     category:'HVAC',      status:'in_progress',  images:[], resolution_images:[], resolution:null, estimated_cost:450,  actual_cost:null,  scheduled_date:'2025-08-28', completed_date:null,         created_at:'2025-08-25T09:00:00.000Z', updated_at:NOW },
  { id:'mt-002', ticket_number:'MT-2025-002', unit_id:'u-as-3', tenant_id:'t-qa-006', title:'Kitchen sink blocked',            description:'Water draining very slowly. Seems like a grease buildup in the pipe.',                  priority:'medium',   category:'Plumbing',  status:'open',         images:[], resolution_images:[], resolution:null, estimated_cost:200,  actual_cost:null,  scheduled_date:null,  completed_date:null,         created_at:'2025-08-26T14:00:00.000Z', updated_at:NOW },
  { id:'mt-003', ticket_number:'MT-2025-003', unit_id:'u-pl-p1', tenant_id:'t-qa-004', title:'Smart lock battery low',         description:'Lock beeping red indicator, needs battery replacement.',                                priority:'low',      category:'Electrical',status:'completed',    images:[], resolution_images:[], resolution:'Replaced batteries (AA x4)', estimated_cost:80, actual_cost:65, scheduled_date:'2025-08-20', completed_date:'2025-08-20', created_at:'2025-08-18T10:00:00.000Z', updated_at:NOW },
  { id:'mt-004', ticket_number:'MT-2025-004', unit_id:'u-m-b1', tenant_id:'t-qa-003', title:'Elevator making grinding noise', description:'Audible grinding when descending from upper floors. Building-wide issue.',                priority:'urgent',   category:'Mechanical',status:'open',         images:[], resolution_images:[], resolution:null, estimated_cost:1800, actual_cost:null,  scheduled_date:null,  completed_date:null,         created_at:'2025-08-27T08:00:00.000Z', updated_at:NOW },
  { id:'mt-005', ticket_number:'MT-2025-005', unit_id:'u-as-2', tenant_id:'t-qa-005', title:'Bathroom exhaust fan noisy',     description:'Loud rattling noise from bathroom fan when running.',                                   priority:'low',      category:'Electrical',status:'completed',    images:[], resolution_images:[], resolution:'Tightened mounting bracket', estimated_cost:120, actual_cost:90, scheduled_date:'2025-08-15', completed_date:'2025-08-15', created_at:'2025-08-12T11:00:00.000Z', updated_at:NOW },
  { id:'mt-006', ticket_number:'MT-2025-006', unit_id:'u-pl-p2', tenant_id:'t-qa-005', title:'Balcony door handle loose',       description:'Handle wobbles and does not latch properly.',                                           priority:'medium',   category:'Carpentry', status:'in_progress',  images:[], resolution_images:[], resolution:null, estimated_cost:150,  actual_cost:null,  scheduled_date:'2025-08-29', completed_date:null,         created_at:'2025-08-26T16:00:00.000Z', updated_at:NOW },
];

const LEADS = [
  { id:'ld-001', name:'Mohammed K.',        phone:'+974 5555 8888', email:'mohammed.k@example.qa', source:'meta_ads',      source_detail:'Facebook — Pearl-Qatar campaign', property_interest:'2BR, The Pearl Residences', budget:12000, status:'interested',  notes:'Wants to view next weekend.',          contacted_at:'2025-08-20T10:00:00.000Z', visited_at:null,    converted_at:null, tenant_id:null,    created_at:'2025-08-18T09:00:00.000Z', updated_at:NOW },
  { id:'ld-002', name:'Priya S.',           phone:'+974 5555 7777', email:'priya.s@example.com',  source:'google_ads',    source_detail:'Google Search — Al Sadd',       property_interest:'1BR, Asmaco Residence',     budget:5000,  status:'contacted',   notes:null,                                   contacted_at:'2025-08-22T14:00:00.000Z', visited_at:null,    converted_at:null, tenant_id:null,    created_at:'2025-08-20T08:00:00.000Z', updated_at:NOW },
  { id:'ld-003', name:'James L.',           phone:'+974 5555 6666', email:null,                   source:'property_finder',source_detail:null,                          property_interest:'3BR, Al Thumama Villas',    budget:14000, status:'visited',     notes:'Visited with family on 22 Aug.',        contacted_at:'2025-08-22T11:00:00.000Z', visited_at:'2025-08-22T15:00:00.000Z', converted_at:null, tenant_id:null,    created_at:'2025-08-19T10:00:00.000Z', updated_at:NOW },
  { id:'ld-004', name:'Fatima H.',          phone:'+974 5555 5555', email:null,                   source:'direct',        source_detail:'Walk-in at office',             property_interest:'2BR, Al Mansura',           budget:6500,  status:'new',         notes:null,                                   contacted_at:null,   visited_at:null,    converted_at:null, tenant_id:null,    created_at:'2025-08-27T09:00:00.000Z', updated_at:NOW },
  { id:'ld-005', name:'Chen W.',            phone:'+974 5555 4444', email:'chen.w@example.com',   source:'meta_ads',      source_detail:'Instagram — Pearl-Qatar',       property_interest:'Retail, The Pearl',         budget:22000, status:'converted',   notes:'Converted — signed lease l-009.',       contacted_at:'2025-05-10T10:00:00.000Z', visited_at:'2025-05-15T14:00:00.000Z', converted_at:'2025-05-20T09:00:00.000Z', tenant_id:'t-qa-007', created_at:'2025-05-08T08:00:00.000Z', updated_at:NOW },
  { id:'ld-006', name:'Layla N.',           phone:'+974 5555 3333', email:'layla.n@example.qa',   source:'referral',      source_detail:'Referred by Ahmed Al-Sulaiti',  property_interest:'3BR, Al Mansura',           budget:9000,  status:'interested',  notes:'Wants to move in by October.',          contacted_at:'2025-08-25T11:00:00.000Z', visited_at:null,    converted_at:null, tenant_id:null,    created_at:'2025-08-23T10:00:00.000Z', updated_at:NOW },
  { id:'ld-007', name:'Robert Smith',       phone:'+974 5555 2222', email:'robert.s@example.com', source:'google_ads',    source_detail:'Google Ads — Doha apartments',  property_interest:'Studio, The Pearl',         budget:4500,  status:'negotiating', notes:'Negotiating PDC terms.',                contacted_at:'2025-08-24T09:00:00.000Z', visited_at:'2025-08-26T16:00:00.000Z', converted_at:null, tenant_id:null,    created_at:'2025-08-22T08:00:00.000Z', updated_at:NOW },
];

const AD_CAMPAIGNS = [
  { id:'camp-001', name:'The Pearl — Luxury Living',          platform:'meta',         campaign_id_external:'2385000001', start_date:'2025-07-01', end_date:'2025-09-30', budget:8000,  spent:5200, status:'active',    target_audience:'Expats, 30-50, The Pearl area',  objective:'Leads',  created_at:'2025-06-28T08:00:00.000Z', updated_at:NOW },
  { id:'camp-002', name:'Al Mansura — Family Residences',      platform:'google',       campaign_id_external:'G-7781001',  start_date:'2025-07-15', end_date:'2025-10-15', budget:5000,  spent:3100, status:'active',    target_audience:'Qatari nationals, families',     objective:'Leads',  created_at:'2025-07-10T09:00:00.000Z', updated_at:NOW },
  { id:'camp-003', name:'Al Thumama Villas — Premium',         platform:'property_finder',campaign_id_external:'PF-209',      start_date:'2025-08-01', end_date:'2025-11-30', budget:6000,  spent:1800, status:'active',    target_audience:'HNI, 4BR+ seekers',             objective:'Leads',  created_at:'2025-07-28T10:00:00.000Z', updated_at:NOW },
  { id:'camp-004', name:'Asmaco — Affordable Units',           platform:'meta',         campaign_id_external:'2385000042', start_date:'2025-06-01', end_date:'2025-08-31', budget:3500,  spent:3500, status:'completed', target_audience:'Budget renters, 25-35',        objective:'Leads',  created_at:'2025-05-28T08:00:00.000Z', updated_at:NOW },
];

// ── Users table (for credential auth) ────────────────────────────────────
const USERS = [
  { id:'user-admin-001', email:'admin@propertEase.qa', password:'$2a$10$rOZxUiOpQRqM6t0yjg0YvOK3MFGvdBukF6FqJv5Fj6qF6yK5KqK6y', name:'PropertyEase Admin', name_ar:'مدير بروبرتي إيز', role:'owner', isActive:true,  createdAt:'2024-01-01T00:00:00.000Z', updatedAt:NOW },
  { id:'user-mgr-001',  email:'manager@propertEase.qa',password:'$2a$10$rOZxUiOpQRqM6t0yjg0YvOK3MFGvdBukF6FqJv5Fj6qF6yK5KqK6y', name:'Omar Al-Thani',      name_ar:'عمر آل ثاني',      role:'manager',isActive:true,  createdAt:'2024-02-15T00:00:00.000Z', updatedAt:NOW },
  { id:'user-acct-001', email:'accounts@propertEase.qa',password:'$2a$10$rOZxUiOpQRqM6t0yjg0YvOK3MFGvdBukF6FqJv5Fj6qF6yK5KqK6y', name:'Noura Cassidy',      name_ar:'نورا كاسيدي',       role:'accountant',isActive:true,createdAt:'2024-03-01T00:00:00.000Z', updatedAt:NOW },
  { id:'user-maint-001',email:'maintenance@propertEase.qa',password:'$2a$10$rOZxUiOpQRqM6t0yjg0YvOK3MFGvdBukF6FqJv5Fj6qF6yK5KqK6y', name:'Hassan Works',       name_ar:'حسن العامل',        role:'maintenance',isActive:true, createdAt:'2024-04-01T00:00:00.000Z', updatedAt:NOW },
];

// The bcrypt hash above is for password: "PropertyEase123!"
// In production this would be pre-hashed. For testing we use a known hash.

const BUNDLE = {
  properties: PROPERTIES,
  units: UNITS,
  tenants: TENANTS,
  leases: LEASES,
  payments: PAYMENTS,
  maintenance: MAINTENANCE_TICKETS,
  leads: LEADS,
  ad_campaigns: AD_CAMPAIGNS,
  users: USERS,
};

// ── Write ─────────────────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  let existing = {};
  if (fs.existsSync(FALLBACK_FILE)) {
    try { existing = JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf8')); } catch { /* fresh start */ }
  }

  // Preserve any user-created data that isn't in our fixture
  const writeKeys = ['properties','units','tenants','leases','payments','maintenance','leads','ad_campaigns'];
  for (const k of writeKeys) {
    if (existing[k] && existing[k].length > 0 && BUNDLE[k].length === 0) {
      BUNDLE[k] = existing[k];
    }
  }

  fs.writeFileSync(FALLBACK_FILE, JSON.stringify(BUNDLE, null, 2), 'utf8');

  // Also hydrate globalThis memory for any already-running server
  try {
    globalThis.__PE_FALLBACK__ = BUNDLE;
  } catch {}

  console.log('Test data written successfully!');
  console.log(`  Properties: ${BUNDLE.properties.length}`);
  console.log(`  Units:      ${BUNDLE.units.length}`);
  console.log(`  Tenants:    ${BUNDLE.tenants.length}`);
  console.log(`  Leases:     ${BUNDLE.leases.length}`);
  console.log(`  Payments:   ${BUNDLE.payments.length}`);
  console.log(`  Tickets:    ${BUNDLE.maintenance.length}`);
  console.log(`  Leads:      ${BUNDLE.leads.length}`);
  console.log(`  Campaigns:  ${BUNDLE.ad_campaigns.length}`);
  console.log(`  Users:      ${BUNDLE.users.length}`);
  console.log('');
  console.log('Login credentials (password: PropertyEase123!):');
  BUNDLE.users.forEach(u => {
    console.log(`  ${u.email}  [${u.role}]`);
  });
}

main();
