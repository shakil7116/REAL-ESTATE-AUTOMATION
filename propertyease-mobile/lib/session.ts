/**
 * propertyease-mobile/lib/session.ts
 *
 * Session management for the PropertyEase mobile app.
 * Handles persisting auth token and user profile across app restarts
 * via AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Keys ─────────────────────────────────────────────────────────────────────
const USER_KEY   = 'propertyease_user';
const TOKEN_KEY  = 'pe_token';
const LANG_KEY   = 'pe_lang';
const COUNTRY_KEY = 'pe_country';

// ── Types ────────────────────────────────────────────────────────────────────
export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

// ── Token helpers ────────────────────────────────────────────────────────────

/** Returns the stored auth token, or null if no session exists. */
export async function getToken(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(TOKEN_KEY);
    return raw || null;
  } catch { return null; }
}

/** Check whether a token is currently stored (session is active). */
export async function isSessionActive(): Promise<boolean> {
  const token = await getToken();
  return Boolean(token?.trim());
}

// ── User helpers ─────────────────────────────────────────────────────────────

/** Parse and return the stored user object, or null if absent/invalid. */
export async function getUser(): Promise<SessionUser | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionUser;
    if (parsed?.id && parsed?.email && parsed?.name) return parsed;
    return null;
  } catch { return null; }
}

/** Save a new session (token + user) to AsyncStorage. */
export async function saveSession(user: SessionUser, token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    await AsyncStorage.setItem(TOKEN_KEY, token.trim());
  } catch { throw new Error('Failed to save session'); }
}

/** Remove all session data from AsyncStorage. */
export async function clearSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(USER_KEY);
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch { /* ignore */ }
}

// ── Language & country preferences ──────────────────────────────────────────

export async function saveLanguage(lang: 'en' | 'ar'): Promise<void> {
  await AsyncStorage.setItem(LANG_KEY, lang);
}

export async function getLanguage(): Promise<'en' | 'ar'> {
  try {
    const raw = await AsyncStorage.getItem(LANG_KEY);
    return raw === 'ar' ? 'ar' : 'en';
  } catch { return 'en'; }
}

export async function saveCountry(code: string): Promise<void> {
  await AsyncStorage.setItem(COUNTRY_KEY, code);
}

export async function getCountry(): Promise<string> {
  try {
    const raw = await AsyncStorage.getItem(COUNTRY_KEY);
    return raw || 'QA';
  } catch { return 'QA'; }
}
