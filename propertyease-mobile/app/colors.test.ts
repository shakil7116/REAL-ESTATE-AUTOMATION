/**
 * Unit tests for mobile app color tokens.
 * Ensures brand colors match the spec in CLAUDE.md §3.
 */
import { describe, it, expect } from 'vitest';
import { PRIMARY, CORAL, WORKSPACE_BG, EMERALD_500 } from '../app/colors';

describe('mobile color tokens', () => {
  it('PRIMARY matches brand dark green #132B25', () => {
    expect(PRIMARY).toBe('#132B25');
  });

  it('CORAL matches brand accent #D97757', () => {
    expect(CORAL).toBe('#D97757');
  });

  it('WORKSPACE_BG matches brand workspace bg #F6F8F6', () => {
    expect(WORKSPACE_BG).toBe('#F6F8F6');
  });

  it('EMERALD_500 is a valid green shade', () => {
    expect(EMERALD_500).toBe('#10B981');
  });

  it('all color values are hex strings', () => {
    const colors = [PRIMARY, CORAL, WORKSPACE_BG, EMERALD_500];
    for (const color of colors) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
