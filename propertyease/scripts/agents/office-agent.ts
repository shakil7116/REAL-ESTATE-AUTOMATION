/**
 * Office/Leads Agent — simulates an office staff member managing leads and campaigns.
 * Tests: lead pipeline → campaign analytics → lead follow-up → status updates.
 */
async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function api(method: string, path: string, body?: any) {
  const opts: RequestInit = { method, headers: { 'Content-Type': 'application/json' }, cache: 'no-store' };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`http://localhost:3000${path}`, opts);
  return res.json();
}

interface AgentResult { agent: string; step: string; ok: boolean; detail: string; }
const results: AgentResult[] = [];
const log = (agent: string, step: string, ok: boolean, detail: string) => {
  results.push({ agent, step, ok, detail });
  console.log(`[${agent}] ${ok ? '✓' : '✗'} ${step}: ${detail}`);
};

export async function runOfficeLeadsAgent(): Promise<AgentResult[]> {
  console.log('\n═══ OFFICE/LEADS AGENT — PropertyEase Testing ═══');

  // Step 1: View all leads
  try {
    const data = await api('GET', '/api/leads');
    const leads = data.data as any[];
    const newLeads = leads.filter((l: any) => l.status === 'new');
    const contacted = leads.filter((l: any) => l.status === 'contacted');
    const interested = leads.filter((l: any) => l.status === 'interested');
    const converted = leads.filter((l: any) => l.status === 'converted');
    log('Office', 'Lead pipeline overview', leads.length >= 5,
      `New: ${newLeads.length}, Contacted: ${contacted.length}, Interested: ${interested.length}, Converted: ${converted.length}`);
  } catch (e: any) {
    log('Office', 'Lead pipeline overview', false, e.message);
  }

  // Step 2: Filter leads by source
  try {
    const data = await api('GET', '/api/leads?source=meta_ads');
    const metaLeads = data.data as any[];
    log('Office', 'Meta ads leads', metaLeads.length >= 1, `Found ${metaLeads.length} leads from Meta ads`);

    const googleData = await api('GET', '/api/leads?source=google_ads');
    const googleLeads = googleData.data as any[];
    log('Office', 'Google ads leads', googleLeads.length >= 1, `Found ${googleLeads.length} leads from Google ads`);
  } catch (e: any) {
    log('Office', 'Filter by source', false, e.message);
  }

  // Step 3: Update a lead status (new → contacted)
  try {
    const data = await api('GET', '/api/leads');
    const leads = data.data as any[];
    const newLead = leads.find((l: any) => l.status === 'new');

    if (newLead) {
      const updateRes = await api('PUT', `/api/leads?id=${newLead.id}`, {
        status: 'contacted',
        contacted_at: new Date().toISOString(),
        notes: 'Followed up via phone — interested in viewing next week.',
      });
      log('Office', `Update lead: ${newLead.name}`, !!updateRes.success,
        `Status: new → contacted, Notes: "${updateRes.data?.notes || 'ok'}"`);
    } else {
      log('Office', 'Update lead status', false, 'No new lead found');
    }
  } catch (e: any) {
    log('Office', 'Update lead status', false, e.message);
  }

  // Step 4: Create a new lead
  try {
    const newLead = await api('POST', '/api/leads', {
      name: 'Test Lead — Agent',
      phone: '+974 5555 0000',
      email: 'test.lead@example.qa',
      source: 'direct',
      source_detail: 'Office walk-in',
      property_interest: '2BR, Al Mansura Complex',
      budget: 7000,
      status: 'new',
      notes: 'Added by office agent test.',
    });
    log('Office', 'Create new lead', !!newLead.success, `Created: ${newLead.data?.name}`);
  } catch (e: any) {
    log('Office', 'Create new lead', false, e.message);
  }

  // Step 5: View ad campaigns
  try {
    const data = await api('GET', '/api/campaigns');
    const campaigns = data.data as any[];
    const active = campaigns.filter((c: any) => c.status === 'active');
    const totalBudget = campaigns.reduce((s: number, c: any) => s + (c.budget || 0), 0);
    const totalSpent = campaigns.reduce((s: number, c: any) => s + (c.spent || 0), 0);
    log('Office', 'Campaign analytics', campaigns.length >= 3,
      `Active: ${active.length}/${campaigns.length}, Budget: QAR ${totalBudget}, Spent: QAR ${totalSpent} (${((totalSpent/totalBudget)*100).toFixed(0)}%)`);
  } catch (e: any) {
    log('Office', 'Campaign analytics', false, e.message);
  }

  // Step 6: Convert a lead to tenant (simulate)
  try {
    const data = await api('GET', '/api/leads?status=contacted');
    const contacted = data.data as any[];
    const leadToConvert = contacted.find((l: any) => !l.tenant_id);

    if (leadToConvert) {
      // First create a tenant
      const tenantRes = await api('POST', '/api/tenants', {
        name: leadToConvert.name,
        name_ar: null,
        email: leadToConvert.email,
        phone: leadToConvert.phone,
        nationality: null,
        company: null,
        notes: 'Converted from lead ' + leadToConvert.id,
      });

      if (tenantRes.success && tenantRes.data) {
        // Update lead to converted
        const leadUpdate = await api('PUT', `/api/leads?id=${leadToConvert.id}`, {
          status: 'converted',
          converted_at: new Date().toISOString(),
          tenant_id: tenantRes.data.id,
          notes: 'Converted to tenant — pending lease signing.',
        });
        log('Office', 'Convert lead → tenant', !!leadUpdate.success,
          `${leadToConvert.name} → tenant ${tenantRes.data.id}`);
      } else {
        log('Office', 'Convert lead → tenant', false, 'Failed to create tenant record');
      }
    } else {
      log('Office', 'Convert lead → tenant', false, 'No contacted lead without tenant found');
    }
  } catch (e: any) {
    log('Office', 'Convert lead → tenant', false, e.message);
  }

  // Step 7: Check lost leads
  try {
    const data = await api('GET', '/api/leads?status=lost');
    const lostLeads = data.data as any[];
    log('Office', 'Lost leads tracking', true, `Currently ${lostLeads.length} lost leads in pipeline`);
  } catch (e: any) {
    log('Office', 'Lost leads tracking', false, e.message);
  }

  // Step 8: Revenue summary from payments
  try {
    const payData = await api('GET', '/api/payments');
    const payments = payData.data as any[];
    const totalCollected = payments
      .filter((p: any) => p.status === 'received')
      .reduce((s: number, p: any) => s + (p.amount || 0), 0);
    const totalPending = payments
      .filter((p: any) => p.status === 'pending' || p.status === 'overdue')
      .reduce((s: number, p: any) => s + (p.amount || 0), 0);
    log('Office', 'Financial summary', totalCollected > 0,
      `Collected: QAR ${totalCollected.toLocaleString()}, Outstanding: QAR ${totalPending.toLocaleString()}`);
  } catch (e: any) {
    log('Office', 'Financial summary', false, e.message);
  }

  console.log(`\n[Office/Leads Agent] Completed ${results.filter(r => r.agent === 'Office').length} checks\n`);
  return results.filter(r => r.agent === 'Office');
}
