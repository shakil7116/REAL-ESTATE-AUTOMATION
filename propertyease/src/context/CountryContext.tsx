'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type CountryCode = 'QA' | 'AE' | 'SA' | 'KW' | 'BH' | 'OM';

export interface CountryConfig {
  code: CountryCode;
  name: string;
  nameAr: string;
  currency: string;
  currencySymbol: string;
  phonePrefix: string;
  capital: string;
  flag: string;
}

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  QA: { code: 'QA', name: 'Qatar', nameAr: 'قطر', currency: 'QAR', currencySymbol: 'ر.ق', phonePrefix: '+974', capital: 'Doha', flag: '🇶🇦' },
  AE: { code: 'AE', name: 'UAE', nameAr: 'الإمارات', currency: 'AED', currencySymbol: 'د.إ', phonePrefix: '+971', capital: 'Abu Dhabi', flag: '🇦🇪' },
  SA: { code: 'SA', name: 'Saudi Arabia', nameAr: 'السعودية', currency: 'SAR', currencySymbol: 'ر.س', phonePrefix: '+966', capital: 'Riyadh', flag: '🇸🇦' },
  KW: { code: 'KW', name: 'Kuwait', nameAr: 'الكويت', currency: 'KWD', currencySymbol: 'د.ك', phonePrefix: '+965', capital: 'Kuwait City', flag: '🇰🇺' },
  BH: { code: 'BH', name: 'Bahrain', nameAr: 'البحرين', currency: 'BHD', currencySymbol: 'د.ب', phonePrefix: '+973', capital: 'Manama', flag: '🇧🇭' },
  OM: { code: 'OM', name: 'Oman', nameAr: 'عُمان', currency: 'OMR', currencySymbol: 'ر.ع', phonePrefix: '+968', capital: 'Muscat', flag: '🇴🇲' },
};

export const defaultCountry: CountryConfig = COUNTRIES.QA;

interface CountryContextType {
  country: CountryConfig;
  setCountry: (c: CountryConfig) => void;
  currency: string;
  currencySymbol: string;
  formatCurrency: (value: number) => string;
  formatCurrencyCompact: (value: number) => string;
}

const CountryContext = createContext<CountryContextType | null>(null);

export function useCountry() {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error('useCountry must be used within CountryProvider');
  return ctx;
}

export function CountryProvider({ children }: { children: ReactNode }) {
  const [country, setCountryState] = useState<CountryConfig>(defaultCountry);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('propertyease_country') as CountryCode | null;
      if (stored && COUNTRIES[stored]) {
        setCountryState(COUNTRIES[stored]);
      }
    }
  }, []);

  const setCountry = (c: CountryConfig) => {
    setCountryState(c);
    if (typeof window !== 'undefined') {
      localStorage.setItem('propertyease_country', c.code);
    }
  };

  const formatCurrency = (value: number) => {
    try {
      return new Intl.NumberFormat(country.code === 'QA' ? 'en-QA' : 'en-US', {
        style: 'currency',
        currency: country.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return `${country.currencySymbol} ${value.toLocaleString()}`;
    }
  };

  const formatCurrencyCompact = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}${country.currencySymbol}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}${country.currencySymbol}K`;
    return `${value}${country.currencySymbol}`;
  };

  return (
    <CountryContext.Provider value={{ country, setCountry, currency: country.currency, currencySymbol: country.currencySymbol, formatCurrency, formatCurrencyCompact }}>
      {children}
    </CountryContext.Provider>
  );
}
