/**
 * Runner — executes all role-based agents and prints a consolidated report.
 */
import { runOwnerAdminAgent } from './owner-agent.js';
import { runTenantAgent } from './tenant-agent.js';
import { runMaintenanceAgent } from './maintenance-agent.js';
import { runOfficeLeadsAgent } from './office-agent.js';

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║     PropertyEase — Multi-Agent End-to-End Test Suite   ║');
  console.log('║     Date: ' + new Date().toISOString().split('T')[0] + '                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const allResults: Array<{ agent: string; step: string; ok: boolean; detail: string }> = [];

  // Run all agents sequentially (each depends on clean data state)
  const ownerResults = await runOwnerAdminAgent();
  allResults.push(...ownerResults);

  const tenantResults = await runTenantAgent();
  allResults.push(...tenantResults);

  const maintenanceResults = await runMaintenanceAgent();
  allResults.push(...maintenanceResults);

  const officeResults = await runOfficeLeadsAgent();
  allResults.push(...officeResults);

  // ── Summary Report ────────────────────────────────────────
  const total = allResults.length;
  const passed = allResults.filter(r => r.ok).length;
  const failed = allResults.filter(r => !r.ok).length;

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                          ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Total checks:  ${total.toString().padStart(3)}                                           ║`);
  console.log(`║  Passed:        ${passed.toString().padStart(3)}                                           ║`);
  console.log(`║  Failed:        ${failed.toString().padStart(3)}                                           ║`);
  console.log(`║  Pass rate:     ${(total > 0 ? (passed / total * 100).toFixed(0) : '0').padStart(3)}%                                             ║`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Per-agent breakdown
  const agents = ['Owner/Admin', 'Tenant', 'Maintenance', 'Office'];
  for (const agent of agents) {
    const agentResults = allResults.filter(r => r.agent === agent);
    const agentPassed = agentResults.filter(r => r.ok).length;
    const agentFailed = agentResults.filter(r => !r.ok).length;
    console.log(`  ${agent.padEnd(16)}  ${agentPassed.toString().padStart(2)}/${agentResults.length} passed${agentFailed > 0 ? `  ⚠ ${agentFailed} failed` : ''}`);
    for (const r of agentResults) {
      if (!r.ok) console.log(`    ✗ ${r.step}: ${r.detail}`);
    }
  }

  if (failed === 0) {
    console.log('\n  All tests passed! ✓\n');
  } else {
    console.log(`\n  ${failed} test(s) failed — review needed.\n`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Runner error:', err);
  process.exit(1);
});
