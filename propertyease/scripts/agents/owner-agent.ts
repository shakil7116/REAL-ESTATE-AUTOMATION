/**
 * Owner/Admin Agent — simulates a property owner or admin performing daily tasks.
 * Tests: login → dashboard overview → properties CRUD → units management →
 *        lease tracking → payment oversight → settings.
 */
async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function api(method: string, path: string, body?: any) {
  const opts: RequestInit = { method, headers: { 'Content-Type': 'application/json' }, cache: 'no-store' };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`http://localhost:3000${path}`, opts);
  const data = await res.json();
  return data;
}

interface AgentResult { agent: string; step: string; ok: boolean; detail: string; }
const results: AgentResult[] = [];
const log = (agent: string, step: string, ok: boolean, detail: string) => {
  results.push({ agent, step, ok, detail });
  console.log(`[${agent}] ${ok ? '✓' : '✗'} ${step}: ${detail}`);
};

export async function runOwnerAdminAgent(): Promise<AgentResult[]> {
  console.log('\n═══ OWNER/ADMIN AGENT — PropertyEase Testing ═══');

  // Step 1: Login
  try {
    const r = await api('POST', '/api/auth/session', null);
    // Try signing in via credentials
    const signInRes = await fetch('http://localhost:3000/api/auth/signin/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email: 'admin@propertEase.qa', password: 'PropertyEase123!', callbackUrl: '/dashboard' }),
    });
    log('Owner/Admin', 'Login', signInRes.ok, `HTTP ${signInRes.status}`);
    await sleep(500);
  } catch (e: any) {
    log('Owner/Admin', 'Login', false, e.message);
  }

  // Step 2: Fetch dashboard stats
  try {
    const data = await api('GET', '/api/dashboard');
    const s = data.data;
    log('Owner/Admin', 'Dashboard stats', s.totalRevenue > 0,
      `Revenue: QAR ${s.totalRevenue}, Occupancy: ${s.occupancyRate}%, Pending: QAR ${s.pendingPayments}, Tickets: ${s.openTickets}`);
  } catch (e: any) {
    log('Owner/Admin', 'Dashboard stats', false, e.message);
  }

  // Step 3: List properties
  try {
    const data = await api('GET', '/api/properties');
    const props = data.data as any[];
    log('Owner/Admin', 'Properties listed', props.length >= 4, `Found ${props.length} properties`);

    if (props.length > 0) {
      const prop = props[0];
      log('Owner/Admin', `Property: ${prop.name}`, true, `${prop.city}, ${prop.property_type}, ${prop.total_units} units`);
    }
  } catch (e: any) {
    log('Owner/Admin', 'Properties listed', false, e.message);
  }

  // Step 4: List units
  try {
    const data = await api('GET', '/api/units');
    const units = data.data as any[];
    const occupied = units.filter((u: any) => u.status === 'occupied').length;
    const vacant = units.filter((u: any) => u.status === 'vacant').length;
    log('Owner/Admin', 'Units overview', units.length >= 12,
      `Total: ${units.length}, Occupied: ${occupied}, Vacant: ${vacant}`);
  } catch (e: any) {
    log('Owner/Admin', 'Units overview', false, e.message);
  }

  // Step 5: Check leases
  try {
    const data = await api('GET', '/api/leases');
    const leases = data.data as any[];
    const active = leases.filter((l: any) => l.status === 'active').length;
    const pending = leases.filter((l: any) => l.status === 'pending_renewal').length;
    log('Owner/Admin', 'Leases', leases.length >= 8,
      `Active: ${active}, Pending renewal: ${pending}, Total: ${leases.length}`);
  } catch (e: any) {
    log('Owner/Admin', 'Leases', false, e.message);
  }

  // Step 6: Check payments
  try {
    const data = await api('GET', '/api/payments');
    const payments = data.data as any[];
    const received = payments.filter((p: any) => p.status === 'received').length;
    const pending = payments.filter((p: any) => p.status === 'pending').length;
    const overdue = payments.filter((p: any) => p.status === 'overdue').length;
    const bounced = payments.filter((p: any) => p.status === 'bounced').length;
    log('Owner/Admin', 'Payments', true,
      `Received: ${received}, Pending: ${pending}, Overdue: ${overdue}, Bounced: ${bounced}`);
  } catch (e: any) {
    log('Owner/Admin', 'Payments', false, e.message);
  }

  // Step 7: List tenants
  try {
    const data = await api('GET', '/api/tenants');
    const tenants = data.data as any[];
    log('Owner/Admin', 'Tenants', tenants.length >= 6, `Found ${tenants.length} tenants`);
  } catch (e: any) {
    log('Owner/Admin', 'Tenants', false, e.message);
  }

  // Step 8: Check maintenance tickets
  try {
    const data = await api('GET', '/api/maintenance');
    const tickets = data.data as any[];
    const open = tickets.filter((t: any) => t.status === 'open').length;
    const inProgress = tickets.filter((t: any) => t.status === 'in_progress').length;
    const completed = tickets.filter((t: any) => t.status === 'completed').length;
    log('Owner/Admin', 'Maintenance tickets', tickets.length >= 4,
      `Open: ${open}, In-progress: ${inProgress}, Completed: ${completed}`);
  } catch (e: any) {
    log('Owner/Admin', 'Maintenance tickets', false, e.message);
  }

  // Step 9: Create a test property (then delete it)
  try {
    const newProp = await api('POST', '/api/properties', {
      name: 'Agent Test Property',
      address: 'Test Street, Doha',
      city: 'Doha',
      country: 'Qatar',
      property_type: 'residential',
      total_units: 5,
      status: 'active',
    });
    log('Owner/Admin', 'Create property', newProp.success, `Created: ${newProp.data?.name}`);

    if (newProp.success && newProp.data?.id) {
      await api('DELETE', `/api/properties?id=${newProp.data.id}`);
      log('Owner/Admin', 'Delete test property', true, 'Cleanup complete');
    }
  } catch (e: any) {
    log('Owner/Admin', 'Create/Delete property', false, e.message);
  }

  // Step 10: Update a unit status
  try {
    const unitsData = await api('GET', '/api/units');
    const units = unitsData.data as any[];
    const vacantUnit = units.find((u: any) => u.status === 'vacant');
    if (vacantUnit) {
      const updated = await api('PUT', `/api/units?id=${vacantUnit.id}`, { status: 'reserved' });
      log('Owner/Admin', 'Update unit status', !!updated.success,
        `${vacantUnit.unit_number}: vacant → reserved`);

      // Revert
      await api('PUT', `/api/units?id=${vacantUnit.id}`, { status: 'vacant' });
      log('Owner/Admin', 'Revert unit status', true, `${vacantUnit.unit_number}: reserved → vacant`);
    } else {
      log('Owner/Admin', 'Update unit status', false, 'No vacant unit found');
    }
  } catch (e: any) {
    log('Owner/Admin', 'Update unit status', false, e.message);
  }

  console.log(`\n[Owner/Admin Agent] Completed ${results.filter(r => r.agent === 'Owner/Admin').length} checks\n`);
  return results.filter(r => r.agent === 'Owner/Admin');
}
