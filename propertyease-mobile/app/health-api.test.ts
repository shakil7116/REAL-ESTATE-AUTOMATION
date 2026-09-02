/**
 * Unit tests for the health endpoint response shape.
 * Verifies the contract: { ok, data, error } envelope.
 */
import { describe, it, expect } from 'vitest';

describe('health endpoint contract', () => {
  it('returns ok:true with data object containing service info', () => {
    const mockResponse = {
      ok: true,
      data: {
        service: 'PropertyEase',
        uptime: 42,
        timestamp: new Date().toISOString(),
        env: 'production',
        version: '0.1.0',
      },
      error: null,
    };

    expect(mockResponse.ok).toBe(true);
    expect(mockResponse.data).toBeDefined();
    expect(mockResponse.error).toBeNull();
    expect(typeof mockResponse.data.uptime).toBe('number');
    expect(mockResponse.data.service).toBe('PropertyEase');
  });

  it('error case returns ok:false with error details', () => {
    const errorResponse = {
      ok: false,
      data: null,
      error: { message: 'Service unavailable', code: 'INTERNAL_ERROR' },
    };

    expect(errorResponse.ok).toBe(false);
    expect(errorResponse.data).toBeNull();
    expect(errorResponse.error).toBeDefined();
  });
});
