import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// POST /api/debug/reset — force-reload the fallback bundle from disk
// Useful after pushing test data without restarting the dev server.
export async function POST() {
  try {
    const fs = require('fs');
    const path = require('path');
    const cwd = process.cwd();
    // Try multiple plausible locations since CWD varies across Next.js workers
    const candidates = [
      path.join(cwd, '.data', 'fallback.json'),
      path.join(cwd, 'propertyease', '.data', 'fallback.json'),
      path.join(__dirname, '..', '..', '..', '.data', 'fallback.json'),
    ];
    let file = '';
    for (const c of candidates) {
      if (fs.existsSync(c)) { file = c; break; }
    }
    if (!file) {
      return NextResponse.json({ success: false, error: 'fallback.json not found' }, { status: 404 });
    }
    const raw = fs.readFileSync(file, 'utf8');
    const bundle = JSON.parse(raw);

    // Hydrate globalThis so all in-process API routes pick up fresh data
    declareGlobalBundle(bundle);

    return NextResponse.json({
      success: true,
      message: 'Fallback bundle reloaded from disk',
      counts: {
        properties: bundle.properties?.length ?? 0,
        units: bundle.units?.length ?? 0,
        tenants: bundle.tenants?.length ?? 0,
        leases: bundle.leases?.length ?? 0,
        payments: bundle.payments?.length ?? 0,
        maintenance: bundle.maintenance?.length ?? 0,
        leads: bundle.leads?.length ?? 0,
        ad_campaigns: bundle.ad_campaigns?.length ?? 0,
        users: bundle.users?.length ?? 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to reload' },
      { status: 500 },
    );
  }
}

function declareGlobalBundle(bundle: any) {
  // Access the global __PE_FALLBACK__ via any
  (globalThis as any).__PE_FALLBACK__ = bundle;
  (globalThis as any).__PE_FILE_LOADED__ = true;
}
