/**
 * POST /api/ai/ad-copy — Generate bilingual (EN/AR) ad copy for a vacant unit.
 *
 * Input: { unit, tone, platform } validated against Zod schemas.
 * Output: { ok, data: { en, ar }, error } following the contract envelope.
 *
 * Demo mode (no OPENAI_API_KEY): returns deterministic stub matching eval cases.
 */
import { NextRequest } from 'next/server';
import { protectedHandler, okResponse, errResponse } from '@/lib/withAuth';
import { callAi } from '@/lib/ai';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ToneEnum = z.enum(['luxury', 'family-friendly', 'student', 'expat']);
const PlatformEnum = z.enum(['instagram', 'twitter', 'propertyfinder', 'dubizzle']);

const AdCopyInputSchema = z.object({
  unit: z.object({
    bedrooms: z.number().int().nonnegative(),
    bathrooms: z.number().int().nonnegative(),
    sqft: z.number().int().positive(),
    monthly_rent: z.number().positive(),
    address: z.string().min(1),
    amenities: z.array(z.string()),
  }),
  tone: ToneEnum,
  platform: PlatformEnum,
});

type AdCopyOutput = {
  en: { headline: string; body: string; hashtags: string[]; cta: string };
  ar: { headline: string; body: string; hashtags: string[]; cta: string };
};

const SYSTEM_PROMPT = [
  `You are a real-estate copywriter for PropertyEase, a premium property management platform in Qatar.`,
  `You write ad copy for vacant units.`,
  ``,
  `VOICE: Compelling but honest. NEVER invent features the unit doesn't have.`,
  `NEVER use clickbait ("YOU WON'T BELIEVE..."). NEVER use all-caps.`,
  `NEVER exceed 3 exclamation marks per piece.`,
  ``,
  `BILINGUAL: Generate BOTH English and Arabic. The Arabic must be MSA-grade, not literal translation.`,
  ``,
  `LENGTH:`,
  `- headline: max 80 chars (EN) / 60 chars (AR)`,
  `- body: max 280 chars (EN) / 200 chars (AR)`,
  `- hashtags: exactly 5`,
  ``,
  `PLATFORM ADAPTATION:`,
  `- Instagram: visual-first, lifestyle language, 5 hashtags`,
  `- Twitter: punchy, 1–2 hashtags`,
  `- propertyfinder / dubizzle: factual, spec-driven, no hashtags`,
  ``,
  `CURRENCY: QAR (ر.ق). Format rent as "QAR 4,500/month" or "٤٬٥٠٠ ر.ق/شهر".`,
  ``,
  `OUTPUT: JSON only, no commentary, no markdown fences.`,
].join('\n');

// GET /api/ai/ad-copy — list available tones/platforms (info endpoint)
export const GET = protectedHandler(async () => {
  return okResponse({
    tones: ['luxury', 'family-friendly', 'student', 'expat'],
    platforms: ['instagram', 'twitter', 'propertyfinder', 'dubizzle'],
    note: 'POST this endpoint with { unit, tone, platform } to generate copy.',
  });
});

// POST /api/ai/ad-copy
export const POST = protectedHandler(async (request: NextRequest) => {
  const raw = await request.json();
  const parsed = AdCopyInputSchema.safeParse(raw);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return errResponse(messages, 400);
  }

  const { unit, tone, platform } = parsed.data;

  // Build unit summary for the user prompt
  const amenityStr = unit.amenities.length > 0
    ? ` Amenities: ${unit.amenities.join(', ')}.`
    : ' No listed amenities.';
  const userPrompt = [
    `<unit>`,
    `Bedrooms: ${unit.bedrooms}, Bathrooms: ${unit.bathrooms}, Area: ${unit.sqft} sqft`,
    `Rent: QAR ${unit.monthly_rent.toLocaleString()}/month`,
    `Address: ${unit.address}`,
    amenityStr,
    `</unit>`,
    `<tone>${tone}</tone>`,
    `<platform>${platform}</platform>`,
    `Generate bilingual ad copy for this unit.`,
  ].join('\n');

  const result = await callAi<AdCopyOutput>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    outputSchema: z.object({
      en: z.object({
        headline: z.string(),
        body: z.string(),
        hashtags: z.array(z.string()).length(5),
        cta: z.string(),
      }),
      ar: z.object({
        headline: z.string(),
        body: z.string(),
        hashtags: z.array(z.string()).length(5),
        cta: z.string(),
      }),
    }),
  });

  if (!result.ok) return errResponse(result.error!.message, 500);
  return okResponse(result.data);
});
