/**
 * Unit tests for the mobile session management module.
 * Verifies getToken, saveSession, clearSession, getUser, isSessionActive.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getToken,
  saveSession,
  clearSession,
  getUser,
  isSessionActive,
  getLanguage,
  saveLanguage,
  getCountry,
  saveCountry,
} from '../lib/session';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

const mockAsyncStorage = vi.mocked(AsyncStorage);

const TEST_USER = { id: 'u1', email: 'test@example.com', name: 'Test User' };
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.stub';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getToken', () => {
  it('returns null when no token is stored', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);
    expect(await getToken()).toBeNull();
  });

  it('returns the stored token string', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(TEST_TOKEN);
    expect(await getToken()).toBe(TEST_TOKEN);
  });

  it('returns null on AsyncStorage error', async () => {
    mockAsyncStorage.getItem.mockRejectedValue(new Error('storage fail'));
    expect(await getToken()).toBeNull();
  });
});

describe('saveSession', () => {
  it('stores user object and token separately', async () => {
    await saveSession(TEST_USER, TEST_TOKEN);
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      'propertyease_user',
      JSON.stringify(TEST_USER),
    );
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('pe_token', TEST_TOKEN);
  });

  it('trims whitespace from token before storing', async () => {
    await saveSession(TEST_USER, '  abc123  ');
    expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(2);
    // Find the pe_token call among all setItem invocations
    const peCall = mockAsyncStorage.setItem.mock.calls.find(
      (call: any[]) => call[0] === 'pe_token',
    );
    expect(peCall?.[1]).toBe('abc123');
  });

  it('throws on AsyncStorage failure', async () => {
    mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('disk full'));
    await expect(saveSession(TEST_USER, TEST_TOKEN)).rejects.toThrow('Failed to save session');
  });
});

describe('clearSession', () => {
  it('removes both user and token keys', async () => {
    await clearSession();
    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('propertyease_user');
    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('pe_token');
  });

  it('does not throw on AsyncStorage error', async () => {
    mockAsyncStorage.removeItem.mockRejectedValue(new Error('fail'));
    await expect(clearSession()).resolves.toBeUndefined();
  });
});

describe('getUser', () => {
  it('returns null when no user is stored', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);
    expect(await getUser()).toBeNull();
  });

  it('parses and returns the stored user object', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(TEST_USER));
    expect(await getUser()).toEqual(TEST_USER);
  });

  it('returns null for malformed JSON', async () => {
    mockAsyncStorage.getItem.mockResolvedValue('not-json');
    expect(await getUser()).toBeNull();
  });

  it('returns null when user object is missing required fields', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify({ email: 'a@b.com' }));
    expect(await getUser()).toBeNull();
  });
});

describe('isSessionActive', () => {
  it('returns true when a non-empty token exists', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(TEST_TOKEN);
    expect(await isSessionActive()).toBe(true);
  });

  it('returns false when token is empty', async () => {
    mockAsyncStorage.getItem.mockResolvedValue('');
    expect(await isSessionActive()).toBe(false);
  });

  it('returns false when no token is stored', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);
    expect(await isSessionActive()).toBe(false);
  });
});

describe('language preferences', () => {
  it('defaults to English when nothing stored', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);
    expect(await getLanguage()).toBe('en');
  });

  it('returns Arabic when "ar" is stored', async () => {
    mockAsyncStorage.getItem.mockResolvedValue('ar');
    expect(await getLanguage()).toBe('ar');
  });

  it('saves language preference', async () => {
    await saveLanguage('ar');
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('pe_lang', 'ar');
  });
});

describe('country preferences', () => {
  it('defaults to Qatar when nothing stored', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);
    expect(await getCountry()).toBe('QA');
  });

  it('returns stored country code', async () => {
    mockAsyncStorage.getItem.mockResolvedValue('AE');
    expect(await getCountry()).toBe('AE');
  });

  it('saves country code', async () => {
    await saveCountry('SA');
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('pe_country', 'SA');
  });
});
