import { NextRequest } from 'next/server';
import { publicHandler, okResponse, errResponse } from '@/lib/withAuth';

const SYSTEM_PROMPT = `You are PropertyEase Copilot, an AI assistant for property managers in Qatar. You help with rent collection, maintenance, leasing, marketing campaigns, tenant management, and financial reporting. Be concise, professional, and helpful. Always respond in the same language the user writes in (Arabic or English). Use QAR as the currency.`;

// Demo responses reference the Qatar seed entities (Al Mansura Complex,
// Asmaco Residence, Al Thumama, Marina Tower at The Pearl) — the same
// properties the dashboard, properties page, and reports surface.
// Hardcoded values are based on the static Qatar seed bundle written
// by ensureRichDemoData() — see propertyease/src/lib/seed.ts.
const demoResponses: Record<string, string> = {
  leasing: '📋 **Leasing Status**: Active contracts across the portfolio.\n\n• Al Mansura Complex — 4/5 units occupied (80%)\n• Asmaco Residence — 3/4 units occupied (75%)\n• Al Thumama 103 — 0/2 villas let (under renovation)\n• Marina Tower (The Pearl) — 3/4 units occupied (75%)\n\nVacant: Al Thumama V-1 (4BR villa, QAR 14K/mo) & Marina Tower P-1801 (3BR penthouse, QAR 21K/mo). Want me to list them?',
  maintenance: '🔧 **Maintenance Dashboard**: 3 open work orders, 1 urgent.\n\n**Urgent:**\n• Elevator grinding noise — Al Mansura Complex B-201 (1 day)\n\n**In Progress:**\n• AC not cooling — Al Mansura A-101 (Ahmed Al-Sulaiti)\n\n**Open:**\n• Kitchen sink blocked — Asmaco 303 (Priya Sharma)\n\nAvg resolution: 3.5 hours. Ready to dispatch a contractor?',
  finance: '💰 **Finance Overview**:\n\n• Revenue this month: {totalRevenue}\n• Pending rent: {pendingRent} (2 tenants: Khalid Al-Mansoori, Priya Sharma)\n• Overdue: {overdue}\n• Auto-reminders sent today: 3\n\nQuick actions:\n1. Send payment reminders to overdue tenants\n2. Generate invoice batch for upcoming leases\n3. Download QAR cash flow report',
  marketing: '📢 **Marketing Performance**:\n\n• Total leads this month: 6\n• Avg cost per lead: {cpl}\n• Active campaigns: 3 (Marina Tower Pearl Living, Al Mansura Family, Al Thumama Premium)\n• Best performer: Marina Tower (QAR 81 CPL, 3 leads)\n\nMeta Ads driving 50% of leads. Property Finder showing highest conversion at 33%. Want me to reallocate budget from underperforming campaigns?',
  default: "I've analyzed your Qatar portfolio. Here are my top recommendations:\n\n1. **List Al Thumama V-1** — Premium 4BR villa is vacant. I've drafted a Bayut + Property Finder listing.\n\n2. **Close Marina Tower P-1801** — Penthouse-level 3BR, QAR 21K/mo. Target: HNI tenants from Pearl-Qatar campaign leads.\n\n3. **Renew 1 lease expiring** — Asmaco 303 (Priya Sharma) is in pending_renewal. Start outreach now.\n\n4. **Urgent maintenance** — Al Mansura elevator ticket needs same-day attention. Shall I auto-dispatch?",
};

function classifyMessage(content: string): string {
  const lower = content.toLowerCase();
  if (lower.includes('lease') || lower.includes('tenant') || lower.includes('unit') || lower.includes('occupancy')) return 'leasing';
  if (lower.includes('maint') || lower.includes('repair') || lower.includes('ticket') || lower.includes('work order')) return 'maintenance';
  if (lower.includes('rent') || lower.includes('finance') || lower.includes('revenue') || lower.includes('payment') || lower.includes('invoice')) return 'finance';
  if (lower.includes('market') || lower.includes('ad') || lower.includes('lead') || lower.includes('campaign')) return 'marketing';
  return 'default';
}

// POST /api/copilot — AI chat endpoint
export const POST = publicHandler(async (request) => {
  const body = await request.json();
  const messages: Array<{ role: string; content: string }> = body.messages || [];

  // No key configured — fall back to deterministic demo responses
  if (!process.env.OPENAI_API_KEY) {
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user');
    if (!lastUserMsg) return okResponse({ reply: 'Hello! How can I help you today?' });
    const category = classifyMessage(lastUserMsg.content);
    return okResponse({ reply: demoResponses[category] ?? demoResponses.default });
  }

  const conversationHistory = messages
    .slice(-12)
    .map((m: any) => ({ role: m.role, content: m.content }));

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...conversationHistory],
      max_tokens: 600,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error('[Copilot API] OpenAI error:', res.status, errText);
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user');
    const category = lastUserMsg ? classifyMessage(lastUserMsg.content) : 'default';
    return okResponse({ reply: demoResponses[category] ?? demoResponses.default });
  }

  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  const reply = data.choices?.[0]?.message?.content ?? demoResponses.default;
  return okResponse({ reply });
});
