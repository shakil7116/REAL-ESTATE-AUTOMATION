/**
 * POST /api/ai/lead-score — Score a rental lead 0–100 based on conversion likelihood.
 *
 * Input: { lead, unit, market_context } validated against Zod schemas.
 * Output: { ok, data: { score, tier, reasoning, next_action } } following the
 *         contract envelope.
 *
 * Demo mode (no OPENAI_API_KEY): returns deterministic stub matching eval cases.
 */
import { NextRequest } from 'next/server';
import { protectedHandler, okResponse, errResponse } from '@/lib/withAuth';
import { callAi } from '@/lib/ai';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const LeadSourceEnum = z.enum([
  'direct', 'phone_call', 'whatsapp', 'meta_ads', 'google_ads',
  'bayut', 'property_finder', 'referral', 'other',
]);
const LeadStatusEnum = z.enum([
  'new', 'contacted', 'interested', 'visited', 'negotiating', 'converted', 'lost',
]);

const LeadScoreInputSchema = z.object({
  lead: z.object({
    name: z.string().min(1),
    email: z.string().email().nullable().optional().default(null),
    phone: z.string().min(1),
    message: z.string().min(1),
    source: LeadSourceEnum.default('direct'),
  }),
  unit: z.object({
    bedrooms: z.number().int().nonnegative(),
    monthly_rent: z.number().positive(),
    neighborhood: z.string().min(1),
  }),
  market_context: z.object({
    avg_days_to_lease_in_neighborhood: z.number().int().positive(),
    current_vacancy_rate: z.number().min(0).max(1),
  }),
});

type LeadScoreOutput = {
  score: number;        // 0–100
  tier: 'hot' | 'warm' | 'cold' | 'unqualified';
  reasoning: string;
  next_action: string;
};

const SYSTEM_PROMPT = [
  `You are a lead-scoring engine for PropertyEase, a Qatar property management platform.`,
  `You score rental leads 0–100 based on likelihood to convert to a signed lease within 30 days.`,
  ``,
  `SCORING CRITERIA (use ALL):`,
  `1. Message specificity (0–30 pts): Generic = 5. Specific questions about price, move-in date, lease length = 25+.`,
  `2. Contact completeness (0–20 pts): Phone + email + name = 20. Email only = 10. No contact = 0.`,
  `3. Budget alignment (0–25 pts): Mentioned budget within ±20% of rent = 25. None = 10. 50%+ below rent = 2.`,
  `4. Timing signal (0–15 pts): "Need to move next week" = 15. "Just browsing" = 2.`,
  `5. Source quality (0–10 pts): Direct referral = 10. Property portal = 6. Random ad click = 3.`,
  ``,
  `TIERS: hot (75–100) · warm (50–74) · cold (25–49) · unqualified (0–24)`,
  `NEXT_ACTION mapping: hot → "call within 1 hour", warm → "email within 24 hours", cold → "add to nurture list", unqualified → "disqualify"`,
  ``,
  `NEVER invent facts. If data is missing, score conservatively.`,
  `OUTPUT: JSON only, no commentary.`,
].join('\n');

// GET /api/ai/lead-score — info endpoint
export const GET = protectedHandler(async () => {
  return okResponse({
    note: 'POST this endpoint with { lead, unit, market_context } to score a lead.',
    tiers: { hot: '75-100', warm: '50-74', cold: '25-49', unqualified: '0-24' },
    sources_weighting: { direct_referral: 10, property_portal: 6, random_ad: 3 },
  });
});

// POST /api/ai/lead-score
export const POST = protectedHandler(async (request: NextRequest) => {
  const raw = await request.json();
  const parsed = LeadScoreInputSchema.safeParse(raw);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return errResponse(messages, 400);
  }

  const { lead, unit, market_context } = parsed.data;

  const userPrompt = [
    `<lead>`,
    `Name: ${lead.name}`,
    `Email: ${lead.email || '(none)'}`,
    `Phone: ${lead.phone}`,
    `Source: ${lead.source}`,
    `Message: "${lead.message}"`,
    `</lead>`,
    `<unit>`,
    `${unit.bedrooms}BR · QAR ${unit.monthly_rent.toLocaleString()}/mo · ${unit.neighborhood}`,
    `</unit>`,
    `<market_context>`,
    `Avg days to lease: ${market_context.avg_days_to_lease_in_neighborhood}`,
    `Vacancy rate: ${(market_context.current_vacancy_rate * 100).toFixed(0)}%`,
    `</market_context>`,
    `Score this lead and return JSON.`,
  ].join('\n');

  const result = await callAi<LeadScoreOutput>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    outputSchema: z.object({
      score: z.number().int().min(0).max(100),
      tier: z.enum(['hot', 'warm', 'cold', 'unqualified']),
      reasoning: z.string().min(10),
      next_action: z.string().min(1),
    }),
  });

  if (!result.ok) return errResponse(result.error!.message, 500);
  return okResponse(result.data);
});
