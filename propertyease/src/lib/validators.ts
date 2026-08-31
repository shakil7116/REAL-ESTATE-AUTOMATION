/**
 * Zod input-validation schemas for API mutation endpoints.
 *
 * Pattern: one create schema per entity + one update schema (same fields, id optional).
 * In routes, call `.parse(body)` before hitting storage. A ZodError is converted to
 * a 400 `{ ok: false, error: { message, code: 'VALIDATION' } }` response by the
 * helper exported here.
 *
 * Contract: every schema validates at least the "required" fields from the Prisma
 * interface. Optional fields that are missing default to null / empty array as noted.
 */
import { z } from 'zod';

// ── Enums (inline constants preserve literal tuple types for TS inference) ──────

const furnishingEnum     = z.enum(['unfurnished', 'semi_furnished', 'fully_furnished']);
const unitStatusEnum     = z.enum(['vacant', 'occupied', 'maintenance', 'reserved']);
const tenantStatusEnum   = z.enum(['active', 'inactive', 'overdue', 'evicted']);
const leaseStatusEnum    = z.enum(['active', 'expired', 'terminated', 'pending_renewal']);
const paymentTypeEnum    = z.enum(['rent', 'security_deposit', 'maintenance_fee', 'late_fee', 'other']);
const paymentMethodEnum  = z.enum(['pdc', 'bank_transfer', 'cash', 'online']);
const paymentStatusEnum  = z.enum(['pending', 'received', 'overdue', 'bounced', 'cancelled']);
const ticketPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);
const ticketStatusEnum   = z.enum(['open', 'in_progress', 'waiting_parts', 'completed', 'cancelled']);
const leadSourceEnum     = z.enum([
  'direct', 'phone_call', 'whatsapp', 'meta_ads', 'google_ads',
  'bayut', 'property_finder', 'referral', 'other',
]);
const leadStatusEnum     = z.enum([
  'new', 'contacted', 'interested', 'visited', 'negotiating', 'converted', 'lost',
]);
const campaignPlatformEnum = z.enum(['meta', 'google', 'bayut', 'property_finder', 'local_agency']);
const campaignStatusEnum   = z.enum(['active', 'paused', 'completed', 'cancelled']);
const payoutMethodEnum     = z.enum(['pdc', 'bank_transfer', 'cash', 'online']);
const payoutStatusEnum     = z.enum(['pending', 'sent', 'cleared', 'bounced', 'cancelled']);
const taskFrequencyEnum    = z.enum(['weekly', 'monthly', 'quarterly', 'yearly']);

// ── Property ───────────────────────────────────────────────────────────────────

export const createPropertySchema = z.object({
  name: z.string().min(1, 'Property name is required'),
  name_ar: z.string().optional().nullable(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().default('Doha'),
  country_code: z.string().default('QA'),
  description: z.string().optional().nullable(),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
});
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

export const updatePropertySchema = createPropertySchema.extend({
  id: z.string().min(1),
});

// ── Unit ───────────────────────────────────────────────────────────────────────

export const createUnitSchema = z.object({
  property_id: z.string().min(1, 'property_id is required'),
  unit_number: z.string().min(1, 'unit_number is required'),
  bedrooms: z.number().int().nonnegative().default(0),
  bathrooms: z.number().int().nonnegative().default(0),
  monthly_rent: z.number().positive('monthly_rent must be > 0'),
  furnishing: furnishingEnum.default('unfurnished'),
  status: unitStatusEnum.default('vacant'),
  floor: z.number().int().nullable().optional().nullish(),
  floor_label: z.string().optional().nullable(),
  living_rooms: z.number().int().nonnegative().nullable().optional().nullish(),
  kitchens: z.number().int().nonnegative().nullable().optional().nullish(),
  has_maid_room: z.boolean().nullable().optional().nullish(),
  has_driver_room: z.boolean().nullable().optional().nullish(),
  balconies: z.number().int().nonnegative().nullable().optional().nullish(),
  parking_spaces: z.number().int().nonnegative().nullable().optional().nullish(),
  has_storage: z.boolean().nullable().optional().nullish(),
  area_sqft: z.number().positive().nullable().optional().nullish(),
  security_deposit: z.number().nonnegative().nullable().optional().nullish(),
  description: z.string().optional().nullable(),
  description_ar: z.string().optional().nullable(),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
});
export type CreateUnitInput = z.infer<typeof createUnitSchema>;

export const updateUnitSchema = createUnitSchema.extend({ id: z.string().min(1) });

// ── Tenant ─────────────────────────────────────────────────────────────────────

export const createTenantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().nullable().optional().default(null),
  name_ar: z.string().optional().nullable(),
  id_type: z.string().optional().nullable(),
  id_number: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  emergency_contact: z.string().optional().nullable(),
  emergency_phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type CreateTenantInput = z.infer<typeof createTenantSchema>;

export const updateTenantSchema = createTenantSchema.extend({ id: z.string().min(1) });

// ── Lease ──────────────────────────────────────────────────────────────────────

export const createLeaseSchema = z.object({
  tenant_id: z.string().min(1, 'tenant_id is required'),
  unit_id: z.string().min(1, 'unit_id is required'),
  lease_number: z.string().min(1, 'lease_number is required'),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  monthly_rent: z.number().positive('monthly_rent must be > 0'),
  payment_day: z.number().int().min(1).max(28).default(1),
  payment_method: paymentMethodEnum.default('pdc'),
  security_deposit: z.number().nonnegative().default(0),
  status: leaseStatusEnum.default('pending_renewal'),
  contract_url: z.string().optional().nullable(),
  special_terms: z.string().optional().nullable(),
});
export type CreateLeaseInput = z.infer<typeof createLeaseSchema>;

export const updateLeaseSchema = createLeaseSchema.extend({ id: z.string().min(1) });

// ── Payment ────────────────────────────────────────────────────────────────────

export const createPaymentSchema = z.object({
  lease_id: z.string().min(1, 'lease_id is required'),
  tenant_id: z.string().min(1, 'tenant_id is required'),
  amount: z.number().positive('amount must be > 0'),
  due_date: z.string().min(1, 'due_date is required'),
  payment_type: paymentTypeEnum.default('rent'),
  payment_method: paymentMethodEnum.default('cash'),
  payment_date: z.string().nullable().optional().default(null),
  cheque_number: z.string().optional().nullable(),
  cheque_date: z.string().optional().nullable(),
  bank_reference: z.string().optional().nullable(),
  status: paymentStatusEnum.default('pending'),
  notes: z.string().optional().nullable(),
});
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export const updatePaymentSchema = createPaymentSchema.extend({ id: z.string().min(1) });

// ── Maintenance Ticket ─────────────────────────────────────────────────────────

export const createMaintenanceTicketSchema = z.object({
  ticket_number: z.string().min(1, 'ticket_number is required'),
  unit_id: z.string().min(1, 'unit_id is required'),
  tenant_id: z.string().min(1, 'tenant_id is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  priority: ticketPriorityEnum.default('medium'),
  category: z.string().optional().nullable(),
  status: ticketStatusEnum.default('open'),
  images: z.array(z.string()).default([]),
  resolution: z.string().optional().nullable(),
  resolution_images: z.array(z.string()).default([]),
  estimated_cost: z.number().nullable().optional().default(null),
  actual_cost: z.number().nullable().optional().default(null),
  scheduled_date: z.string().optional().nullable(),
  completed_date: z.string().optional().nullable(),
  assigned_to_id: z.string().optional().nullable(),
});
export type CreateMaintenanceTicketInput = z.infer<typeof createMaintenanceTicketSchema>;

export const updateMaintenanceTicketSchema = createMaintenanceTicketSchema.extend({
  id: z.string().min(1),
});

// ── Lead ───────────────────────────────────────────────────────────────────────

export const createLeadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  source: leadSourceEnum.default('direct'),
  email: z.string().optional().nullable(),
  name_ar: z.string().optional().nullable(),
  source_detail: z.string().optional().nullable(),
  property_interest: z.string().optional().nullable(),
  budget: z.number().nullable().optional().default(null),
  status: leadStatusEnum.default('new'),
  notes: z.string().optional().nullable(),
  contacted_at: z.string().optional().nullable(),
  visited_at: z.string().optional().nullable(),
  converted_at: z.string().optional().nullable(),
  tenant_id: z.string().optional().nullable(),
});
export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = createLeadSchema.extend({ id: z.string().min(1) });

// ── Ad Campaign ────────────────────────────────────────────────────────────────

export const createAdCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  platform: campaignPlatformEnum.default('meta'),
  campaign_id_external: z.string().optional().nullable(),
  start_date: z.string().min(1, 'start_date is required'),
  end_date: z.string().optional().nullable(),
  budget: z.number().positive('budget must be > 0'),
  spent: z.number().nonnegative().default(0),
  status: campaignStatusEnum.default('active'),
  target_audience: z.string().optional().nullable(),
  objective: z.string().optional().nullable(),
});
export type CreateAdCampaignInput = z.infer<typeof createAdCampaignSchema>;

export const updateAdCampaignSchema = createAdCampaignSchema.extend({ id: z.string().min(1) });

// ── Owner Payout ───────────────────────────────────────────────────────────────

export const createOwnerPayoutSchema = z.object({
  property_id: z.string().min(1, 'property_id is required'),
  amount: z.number().positive('amount must be > 0'),
  payout_date: z.string().min(1, 'payout_date is required'),
  period: z.string().min(1, 'period is required (e.g. "July 2024")'),
  method: payoutMethodEnum.default('bank_transfer'),
  cheque_number: z.string().optional().nullable(),
  bank_reference: z.string().optional().nullable(),
  status: payoutStatusEnum.default('pending'),
  notes: z.string().optional().nullable(),
});
export type CreateOwnerPayoutInput = z.infer<typeof createOwnerPayoutSchema>;

export const updateOwnerPayoutSchema = createOwnerPayoutSchema.extend({ id: z.string().min(1) });

// ── Maintenance Task ───────────────────────────────────────────────────────────

export const createMaintenanceTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  frequency: taskFrequencyEnum.default('monthly'),
  next_due_date: z.string().min(1, 'next_due_date is required'),
  last_completed: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});
export type CreateMaintenanceTaskInput = z.infer<typeof createMaintenanceTaskSchema>;

export const updateMaintenanceTaskSchema = createMaintenanceTaskSchema.extend({
  id: z.string().min(1),
});

// ── Activity ───────────────────────────────────────────────────────────────────

export const createActivitySchema = z.object({
  action: z.string().min(1, 'action is required'),
  entity: z.string().min(1, 'entity is required'),
  entity_id: z.string().min(1, 'entity_id is required'),
  details: z.string().optional().nullable(),
  user_id: z.string().optional(), // session-provided; 'system' injected by logActivity if absent
});
export type CreateActivityInput = z.infer<typeof createActivitySchema>;

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Parse raw body against a Zod schema and return either `{ data: T }` or an
 * `errResponse`-style body object with VALIDATION code.
 */
export function validate<T>(schema: z.ZodType<T>, raw: unknown):
  | { ok: true; data: T }
  | { ok: false; error: { message: string; code: string }; data: null } {
  try {
    return { ok: true, data: schema.parse(raw) };
  } catch (e) {
    if (e instanceof z.ZodError) {
      const messages = e.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
      return { ok: false, error: { message: messages, code: 'VALIDATION' }, data: null };
    }
    throw e; // re-throw non-Zod errors
  }
}
