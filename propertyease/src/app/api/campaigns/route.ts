import { NextRequest } from 'next/server';
import { getAdCampaigns, createAdCampaign, updateAdCampaign, deleteAdCampaign } from '@/lib/database';
import { protectedHandler, okResponse, errResponse } from '@/lib/withAuth';
import { validate, createAdCampaignSchema, updateAdCampaignSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

// GET /api/campaigns
export const GET = protectedHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const platform = searchParams.get('platform');

  let campaigns = await getAdCampaigns();
  if (status) campaigns = campaigns.filter((c: any) => c.status === status);
  if (platform) campaigns = campaigns.filter((c: any) => c.platform === platform);

  return okResponse(campaigns);
});

// POST /api/campaigns
export const POST = protectedHandler(async (request) => {
  const body = await request.json();
  const v = validate(createAdCampaignSchema, body);
  if (!v.ok) return errResponse(v.error.message, 400);
  const campaign = await createAdCampaign(v.data);
  return okResponse(campaign, 201);
});

// PUT /api/campaigns?id=<id>
export const PUT = protectedHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return errResponse('Campaign ID required', 400);
  const body = await request.json();
  const v = validate(updateAdCampaignSchema, body);
  if (!v.ok) return errResponse(v.error.message, 400);
  const campaign = await updateAdCampaign(id, v.data);
  return okResponse(campaign);
});

// DELETE /api/campaigns?id=<id>
export const DELETE = protectedHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return errResponse('Campaign ID required', 400);
  await deleteAdCampaign(id);
  return okResponse(null);
});
