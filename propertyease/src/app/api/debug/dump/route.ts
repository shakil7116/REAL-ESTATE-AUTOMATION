import { NextResponse } from 'next/server';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/debug/dump — Diagnoses why fallback.json reloads aren't taking effect.
 * Shows: process.cwd(), __dirname, all candidate paths with existence flags,
 * and current in-memory property count.
 */
export async function GET() {
  try {
    const fs = require('fs');
    const path = require('path');
    const cwd = process.cwd();
    const pj = path.join;

    // Build candidate list matching database.ts logic
    const candidates = [
      pj(cwd, '.data', 'fallback.json'),
      pj(cwd, 'propertyease', '.data', 'fallback.json'),
      pj(__dirname, '..', '..', '..', '.data', 'fallback.json'),
      pj(__dirname, '..', '..', '.data', 'fallback.json'),
    ];

    const checks = candidates.map((c: string) => ({
      path: c,
      exists: fs.existsSync(c),
      size: fs.existsSync(c) ? fs.statSync(c).size : null,
    }));

    let loadedFile = '';
    let loadedBundle: any = null;
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        try {
          const raw = fs.readFileSync(c, 'utf8');
          const parsed = JSON.parse(raw);
          const hasAny = parsed.properties?.length || parsed.units?.length || parsed.tenants?.length;
          if (hasAny) {
            loadedFile = c;
            loadedBundle = parsed;
            break;
          }
        } catch {}
      }
    }

    const memProps = ((globalThis as any).__PE_FALLBACK__?.properties || []) as any[];
    const diskProps = loadedBundle?.properties || [];

    return NextResponse.json({
      cwd,
      __dirname,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '(set)' : '(unset)',
        NEXTAUTH_DEMO: process.env.NEXTAUTH_DEMO,
      },
      candidates: checks,
      resolvedFile: loadedFile || '(none found)',
      memory: {
        properties: memProps.length,
        ids: memProps.map((p: any) => `${p.id}|${p.name}|${p.country}`),
      },
      disk: {
        properties: diskProps.length,
        ids: diskProps.map((p: any) => `${p.id}|${p.name}|${p.country}`),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
