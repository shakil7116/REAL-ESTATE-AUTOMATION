-- ==========================================
-- Migration: Extend Unit spec fields
-- Date:    2026-08-28
-- Reason:  Add named-floor label + Qatar-layout spec
--          fields so the Add/Edit Unit modal can
--          describe apartments the way they are
--          rented in Qatar (living room, maid's
--          room, driver's room, balconies, parking,
--          storage).
-- ==========================================

-- Add the new columns. All are optional / nullable
-- or carry a sensible default so existing rows
-- remain valid without a backfill.
ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "floor_label"      TEXT;
ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "living_rooms"     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "kitchens"         INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "has_maid_room"    BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "has_driver_room"  BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "balconies"        INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "parking_spaces"   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "has_storage"      BOOLEAN NOT NULL DEFAULT FALSE;
