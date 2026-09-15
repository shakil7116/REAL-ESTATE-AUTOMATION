/**
 * Maintenance Worker Agent — simulates a maintenance technician.
 * Tests: receiving tickets → updating status → adding resolution → tracking costs.
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

export async function runMaintenanceAgent(): Promise<AgentResult[]> {
  console.log('\n═══ MAINTENANCE AGENT — PropertyEase Testing ═══');

  // Step 1: Get all open/in-progress tickets
  try {
    const data = await api('GET', '/api/maintenance');
    const tickets = data.data as any[];
    const openTickets = tickets.filter((t: any) => t.status === 'open' || t.status === 'in_progress');
    log('Maintenance', 'View assigned tickets', openTickets.length > 0,
      `Open/in-progress: ${openTickets.length} of ${tickets.length} total`);

    for (const ticket of openTickets.slice(0, 3)) {
      log('Maintenance', `Ticket ${ticket.ticket_number}`, true,
        `${ticket.title} — Priority: ${ticket.priority}, Unit: ${ticket.unit_id}`);
    }
  } catch (e: any) {
    log('Maintenance', 'View assigned tickets', false, e.message);
  }

  // Step 2: Complete a low-priority ticket
  try {
    const data = await api('GET', '/api/maintenance');
    const tickets = data.data as any[];
    const lowPriority = tickets.find((t: any) => t.priority === 'low' && t.status !== 'completed');

    if (lowPriority) {
      const updateRes = await api('PUT', `/api/maintenance?id=${lowPriority.id}`, {
        status: 'completed',
        resolution: 'Test fix applied by maintenance agent — issue resolved.',
        resolution_images: [],
        actual_cost: (lowPriority.estimated_cost || 100) * 0.8,
        completed_date: new Date().toISOString(),
      });
      log('Maintenance', `Complete ticket ${lowPriority.ticket_number}`, !!updateRes.success,
        `Resolved: "${updateRes.data?.resolution || 'ok'}", Cost: QAR ${updateRes.data?.actual_cost || '—'}`);
    } else {
      log('Maintenance', 'Complete ticket', false, 'No non-completed low-priority ticket found');
    }
  } catch (e: any) {
    log('Maintenance', 'Complete ticket', false, e.message);
  }

  // Step 3: Update an in-progress ticket (change scheduled date)
  try {
    const data = await api('GET', '/api/maintenance');
    const tickets = data.data as any[];
    const inProgress = tickets.find((t: any) => t.status === 'in_progress');

    if (inProgress) {
      const newDate = new Date(Date.now() + 7 * 86400000).toISOString();
      const updateRes = await api('PUT', `/api/maintenance?id=${inProgress.id}`, {
        scheduled_date: newDate,
        notes: 'Rescheduled to next week',
      });
      log('Maintenance', `Reschedule ${inProgress.ticket_number}`, !!updateRes.success,
        `New date: ${newDate.split('T')[0]}`);
    } else {
      log('Maintenance', 'Reschedule ticket', false, 'No in-progress ticket found');
    }
  } catch (e: any) {
    log('Maintenance', 'Reschedule ticket', false, e.message);
  }

  // Step 4: Check ticket cost tracking
  try {
    const data = await api('GET', '/api/maintenance');
    const tickets = data.data as any[];
    const completed = tickets.filter((t: any) => t.status === 'completed' && t.actual_cost);
    const totalSpent = completed.reduce((sum: number, t: any) => sum + (t.actual_cost || 0), 0);
    log('Maintenance', 'Cost tracking', completed.length >= 2,
      `Completed tickets with costs: ${completed.length}, Total spent: QAR ${totalSpent.toFixed(0)}`);
  } catch (e: any) {
    log('Maintenance', 'Cost tracking', false, e.message);
  }

  // Step 5: Get unit details for referenced tickets
  try {
    const unitsData = await api('GET', '/api/units');
    const units = unitsData.data as any[];
    const unitMap = new Map(units.map((u: any) => [u.id, u]));

    const ticketsData = await api('GET', '/api/maintenance');
    const tickets = ticketsData.data as any[];
    const unresolved = tickets.filter((t: any) => t.status !== 'completed');
    let linkedCount = 0;
    for (const ticket of unresolved) {
      if (unitMap.has(ticket.unit_id)) linkedCount++;
    }
    log('Maintenance', 'Unit-ticket linking', linkedCount === unresolved.length,
      `${linkedCount}/${unresolved.length} unresolved tickets have valid unit references`);
  } catch (e: any) {
    log('Maintenance', 'Unit-ticket linking', false, e.message);
  }

  // Step 6: Verify tenant info attached to tickets
  try {
    const tenantsData = await api('GET', '/api/tenants');
    const tenants = tenantsData.data as any[];
    const tenantMap = new Map(tenants.map((t: any) => [t.id, t]));

    const ticketsData = await api('GET', '/api/maintenance');
    const tickets = ticketsData.data as any[];
    let linkedCount = 0;
    for (const ticket of tickets) {
      if (tenantMap.has(ticket.tenant_id)) linkedCount++;
    }
    log('Maintenance', 'Tenant-ticket linking', linkedCount === tickets.length,
      `${linkedCount}/${tickets.length} tickets have valid tenant references`);
  } catch (e: any) {
    log('Maintenance', 'Tenant-ticket linking', false, e.message);
  }

  console.log(`\n[Maintenance Agent] Completed ${results.filter(r => r.agent === 'Maintenance').length} checks\n`);
  return results.filter(r => r.agent === 'Maintenance');
}
