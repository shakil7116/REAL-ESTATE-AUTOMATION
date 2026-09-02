/**
 * Tenant Agent — simulates a tenant's journey.
 * Tests: viewing available units → submitting maintenance request → checking lease info.
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

export async function runTenantAgent(): Promise<AgentResult[]> {
  console.log('\n═══ TENANT AGENT — PropertyEase Testing ═══');

  // Step 1: View all properties
  try {
    const data = await api('GET', '/api/properties');
    const props = data.data as any[];
    log('Tenant', 'Browse properties', props.length >= 4, `Available: ${props.length} properties across ${Array.from(new Set(props.map((p:any)=>p.city))).join(', ')}`);
  } catch (e: any) {
    log('Tenant', 'Browse properties', false, e.message);
  }

  // Step 2: Find a vacant unit
  try {
    const unitsData = await api('GET', '/api/units');
    const units = unitsData.data as any[];
    const vacant = units.filter((u: any) => u.status === 'vacant');
    log('Tenant', 'Find vacant units', vacant.length > 0, `Found ${vacant.length} vacant units`);

    if (vacant.length > 0) {
      const unit = vacant[0];
      log('Tenant', `Unit details: ${unit.unit_number}`, true,
        `QAR ${unit.monthly_rent}/mo, ${unit.bedrooms}BR/${unit.bathrooms}BA, ${unit.furnishing}`);
    }
  } catch (e: any) {
    log('Tenant', 'Find vacant units', false, e.message);
  }

  // Step 3: View tenants (as a tenant, can see public listing info)
  try {
    const tenantsData = await api('GET', '/api/tenants');
    const tenants = tenantsData.data as any[];
    log('Tenant', 'Browse tenants list', true, `System has ${tenants.length} tenants registered`);
  } catch (e: any) {
    log('Tenant', 'Browse tenants list', false, e.message);
  }

  // Step 4: Submit a maintenance request (create a ticket)
  try {
    const unitsData = await api('GET', '/api/units');
    const units = unitsData.data as any[];
    const occupiedUnit = units.find((u: any) => u.status === 'occupied');

    if (occupiedUnit) {
      const ticketData = await api('POST', '/api/maintenance', {
        unit_id: occupiedUnit.id,
        tenant_id: occupiedUnit.tenant_id || 't-qa-001',
        title: 'Test: Window latch broken',
        description: 'The window latch on the bedroom is loose and does not close properly.',
        priority: 'medium',
        category: 'Carpentry',
        status: 'open',
        images: [],
        resolution_images: [],
      });
      log('Tenant', 'Submit maintenance request', !!ticketData.success,
        `Ticket created: ${ticketData.data?.ticket_number || 'ok'}`);
    } else {
      log('Tenant', 'Submit maintenance request', false, 'No occupied unit found for testing');
    }
  } catch (e: any) {
    log('Tenant', 'Submit maintenance request', false, e.message);
  }

  // Step 5: Check leases (view own lease info)
  try {
    const leasesData = await api('GET', '/api/leases');
    const leases = leasesData.data as any[];
    const activeLeases = leases.filter((l: any) => l.status === 'active');
    log('Tenant', 'View lease info', activeLeases.length > 0,
      `Active leases in system: ${activeLeases.length}`);

    if (activeLeases.length > 0) {
      const myLease = activeLeases[0];
      log('Tenant', `Sample lease details`, true,
        `${myLease.lease_number}: QAR ${myLease.monthly_rent}/mo, ends ${myLease.end_date}`);
    }
  } catch (e: any) {
    log('Tenant', 'View lease info', false, e.message);
  }

  // Step 6: Simulate paying rent (create a payment record)
  try {
    const leasesData = await api('GET', '/api/leases');
    const leases = leasesData.data as any[];
    const paidLease = leases.find((l: any) => l.status === 'active');

    if (paidLease) {
      const paymentData = await api('POST', '/api/payments', {
        lease_id: paidLease.id,
        tenant_id: paidLease.tenant_id,
        amount: paidLease.monthly_rent,
        payment_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 86400000).toISOString(),
        payment_type: 'rent',
        payment_method: 'online',
        status: 'received',
        notes: 'Test payment by tenant agent',
      });
      log('Tenant', 'Simulate rent payment', !!paymentData.success,
        `Paid QAR ${paymentData.data?.amount || paidLease.monthly_rent}`);
    } else {
      log('Tenant', 'Simulate rent payment', false, 'No active lease found');
    }
  } catch (e: any) {
    log('Tenant', 'Simulate rent payment', false, e.message);
  }

  // Step 7: Check maintenance tickets
  try {
    const data = await api('GET', '/api/maintenance');
    const tickets = data.data as any[];
    log('Tenant', 'Check ticket status', tickets.length >= 4,
      `Total tickets: ${tickets.length}, Open: ${tickets.filter((t:any)=>t.status==='open').length}`);
  } catch (e: any) {
    log('Tenant', 'Check ticket status', false, e.message);
  }

  console.log(`\n[Tenant Agent] Completed ${results.filter(r => r.agent === 'Tenant').length} checks\n`);
  return results.filter(r => r.agent === 'Tenant');
}
