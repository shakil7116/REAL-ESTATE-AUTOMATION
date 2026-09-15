-- ==========================================
-- PROPERTYEASE DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- USERS (for authentication)
-- ==========================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  phone TEXT,
  role TEXT DEFAULT 'manager' CHECK (role IN ('owner', 'manager', 'accountant', 'maintenance', 'tenant')),
  avatar TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- PROPERTIES
-- ==========================================
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT,
  address TEXT NOT NULL,
  address_ar TEXT,
  city TEXT NOT NULL,
  country TEXT DEFAULT 'UAE',
  property_type TEXT DEFAULT 'residential' CHECK (property_type IN ('residential', 'commercial', 'mixed')),
  total_units INTEGER DEFAULT 0,
  description TEXT,
  description_ar TEXT,
  images TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'under_renovation', 'inactive')),
  monthly_maintenance_fee DECIMAL(10,2),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- UNITS
-- ==========================================
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  floor INTEGER,
  floor_label TEXT,                       -- "Basement", "Ground", "1st Floor", "Penthouse"
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 1,
  living_rooms INTEGER DEFAULT 0,
  kitchens INTEGER DEFAULT 1,
  has_maid_room BOOLEAN DEFAULT FALSE,
  has_driver_room BOOLEAN DEFAULT FALSE,
  balconies INTEGER DEFAULT 0,
  parking_spaces INTEGER DEFAULT 0,
  has_storage BOOLEAN DEFAULT FALSE,
  area_sqft DECIMAL(10,2),
  monthly_rent DECIMAL(10,2) NOT NULL,
  security_deposit DECIMAL(10,2),
  furnishing TEXT DEFAULT 'unfurnished' CHECK (furnishing IN ('unfurnished', 'semi_furnished', 'fully_furnished')),
  status TEXT DEFAULT 'vacant' CHECK (status IN ('vacant', 'occupied', 'maintenance', 'reserved')),
  description TEXT,
  description_ar TEXT,
  images TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, unit_number)
);

-- ==========================================
-- 2026-08-28: Add named-floor + Qatar-layout spec fields
-- Idempotent — safe to re-run on existing DBs.
-- ==========================================
ALTER TABLE units ADD COLUMN IF NOT EXISTS floor_label        TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS living_rooms       INTEGER DEFAULT 0;
ALTER TABLE units ADD COLUMN IF NOT EXISTS kitchens           INTEGER DEFAULT 1;
ALTER TABLE units ADD COLUMN IF NOT EXISTS has_maid_room      BOOLEAN DEFAULT FALSE;
ALTER TABLE units ADD COLUMN IF NOT EXISTS has_driver_room    BOOLEAN DEFAULT FALSE;
ALTER TABLE units ADD COLUMN IF NOT EXISTS balconies          INTEGER DEFAULT 0;
ALTER TABLE units ADD COLUMN IF NOT EXISTS parking_spaces     INTEGER DEFAULT 0;
ALTER TABLE units ADD COLUMN IF NOT EXISTS has_storage        BOOLEAN DEFAULT FALSE;

-- ==========================================
-- TENANTS
-- ==========================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT,
  email TEXT,
  phone TEXT NOT NULL,
  phone2 TEXT,
  id_type TEXT,
  id_number TEXT,
  nationality TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  company TEXT,
  notes TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- LEASES
-- ==========================================
CREATE TABLE leases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_number TEXT UNIQUE NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  unit_id UUID NOT NULL REFERENCES units(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent DECIMAL(10,2) NOT NULL,
  payment_day INTEGER DEFAULT 1,
  payment_method TEXT DEFAULT 'pdc' CHECK (payment_method IN ('pdc', 'bank_transfer', 'cash', 'online')),
  security_deposit DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated', 'pending_renewal')),
  contract_url TEXT,
  special_terms TEXT,
  renewal_option BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- PAYMENTS
-- ==========================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id UUID NOT NULL REFERENCES leases(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  due_date DATE NOT NULL,
  payment_type TEXT DEFAULT 'rent' CHECK (payment_type IN ('rent', 'security_deposit', 'maintenance_fee', 'late_fee', 'other')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pdc', 'bank_transfer', 'cash', 'online')),
  cheque_number TEXT,
  cheque_date DATE,
  bank_reference TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'overdue', 'bounced', 'cancelled')),
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- MAINTENANCE TICKETS
-- ==========================================
CREATE TABLE maintenance_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number TEXT UNIQUE NOT NULL,
  unit_id UUID NOT NULL REFERENCES units(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_parts', 'completed', 'cancelled')),
  images TEXT[] DEFAULT '{}',
  resolution TEXT,
  resolution_images TEXT[] DEFAULT '{}',
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  assigned_to_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- LEADS
-- ==========================================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  source TEXT DEFAULT 'direct' CHECK (source IN ('direct', 'phone_call', 'whatsapp', 'meta_ads', 'google_ads', 'bayut', 'property_finder', 'referral', 'other')),
  source_detail TEXT,
  property_interest TEXT,
  budget DECIMAL(10,2),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'visited', 'negotiating', 'converted', 'lost')),
  notes TEXT,
  contacted_at TIMESTAMPTZ,
  visited_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- AD CAMPAIGNS
-- ==========================================
CREATE TABLE ad_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'google', 'bayut', 'property_finder', 'local_agency')),
  campaign_id_external TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  budget DECIMAL(10,2) NOT NULL,
  spent DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  target_audience TEXT,
  objective TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- AD METRICS (daily tracking)
-- ==========================================
CREATE TABLE ad_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0,
  cpc DECIMAL(10,2),
  cpl DECIMAL(10,2),
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- OWNER PAYOUTS
-- ==========================================
CREATE TABLE owner_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id),
  amount DECIMAL(10,2) NOT NULL,
  payout_date DATE NOT NULL,
  period TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('pdc', 'bank_transfer', 'cash', 'online')),
  cheque_number TEXT,
  bank_reference TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ACTIVITY LOG
-- ==========================================
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- INDEXES (for performance)
-- ==========================================
CREATE INDEX idx_units_property ON units(property_id);
CREATE INDEX idx_leases_tenant ON leases(tenant_id);
CREATE INDEX idx_leases_unit ON leases(unit_id);
CREATE INDEX idx_payments_lease ON payments(lease_id);
CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_maintenance_unit ON maintenance_tickets(unit_id);
CREATE INDEX idx_maintenance_status ON maintenance_tickets(status);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_ad_metrics_campaign ON ad_metrics(campaign_id);
CREATE INDEX idx_ad_metrics_date ON ad_metrics(date);

-- ==========================================
-- AUTO-UPDATE TIMESTAMPS
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_leases_updated_at
  BEFORE UPDATE ON leases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_maintenance_tickets_updated_at
  BEFORE UPDATE ON maintenance_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ad_campaigns_updated_at
  BEFORE UPDATE ON ad_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
