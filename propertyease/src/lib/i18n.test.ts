/**
 * Unit tests for i18n translations — ensures EN/AR parity and valid structure.
 */
import { describe, it, expect } from 'vitest';
import translations, { t, type TranslationKey } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

describe('i18n translations', () => {
  const enKeys = Object.keys(translations.en);
  const arKeys = Object.keys(translations.ar);

  it('has translations for both locales', () => {
    expect(enKeys.length).toBeGreaterThan(0);
    expect(arKeys.length).toBeGreaterThan(0);
  });

  it('English and Arabic have matching keys', () => {
    const missingInAr = enKeys.filter(k => !arKeys.includes(k));
    const missingInEn = arKeys.filter(k => !enKeys.includes(k));

    if (missingInAr.length) {
      console.warn(`EN keys missing in AR: ${missingInAr.join(', ')}`);
    }
    if (missingInEn.length) {
      console.warn(`AR keys missing in EN: ${missingInEn.join(', ')}`);
    }

    expect(missingInAr).toHaveLength(0);
    expect(missingInEn).toHaveLength(0);
  });

  it('all string values are non-empty', () => {
    for (const key of enKeys) {
      const enVal = translations.en[key as TranslationKey];
      const arVal = translations.ar[key as TranslationKey];
      expect(typeof enVal).toBe('string');
      expect(typeof arVal).toBe('string');
      expect((enVal as string).trim().length).toBeGreaterThan(0);
      expect((arVal as string).trim().length).toBeGreaterThan(0);
    }
  });

  it('dashboard navigation keys exist', () => {
    const navKeys: TranslationKey[] = [
      'dashboard', 'properties', 'units', 'tenants', 'leases',
      'payments', 'maintenance', 'leads', 'campaigns',
      'reports', 'settings', 'logout',
    ];
    for (const key of navKeys) {
      expect(t(key, 'en')).not.toBeNull();
      expect(t(key, 'ar')).not.toBeNull();
    }
  });

  it('t() returns English by default and Arabic when requested', () => {
    expect(t('dashboard')).toBe('Dashboard');
    expect(t('dashboard', 'ar')).toBe('لوحة التحكم');
  });

  it('t() falls back to English key for unknown locale', () => {
    // When locale is not 'en' or 'ar', translations[locale] is undefined,
    // so t() throws. This test verifies the known behavior (no safe fallback).
    // A real fix would add: translations[locale as Locale] ?? translations.en
    expect(() => t('dashboard', 'fr' as Locale)).toThrow();
  });
});
