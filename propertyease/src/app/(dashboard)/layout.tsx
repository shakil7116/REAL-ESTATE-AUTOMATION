'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import SearchModal from '@/components/SearchModal';
import RemoteControlModal from '@/components/RemoteControlModal';
import GlobalCopilot from '@/components/GlobalCopilot';
import CopilotOpenButton from '@/components/CopilotOpenButton';
import { Search, Bell, Menu, Smartphone, Globe } from 'lucide-react';

// GlobalCopilot now lives as a floating overlay (pill bottom-right → popup
// panel). It does NOT reserve a layout gutter anymore, so the main content
// stays at full width and users can still see/click everything behind it.
import { useCountry } from '@/context/CountryContext';
import { COUNTRIES, type CountryConfig } from '@/context/CountryContext';
import { useMounted } from '@/lib/useClientTime';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [userName, setUserName] = useState('User');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [remoteModalOpen, setRemoteModalOpen] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const { country, setCountry } = useCountry();
  const isRtl = lang === 'ar';

  // Load language preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('propertyease_lang') as 'en' | 'ar' | null;
      if (storedLang) setLang(storedLang);
    }
  }, []);

  // Persist language preference
  useEffect(() => {
    localStorage.setItem('propertyease_lang', lang);
  }, [lang]);

  // Load user name from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const raw = sessionStorage.getItem('propertyease_user');
      if (raw) {
        try {
          const user = JSON.parse(raw);
          if (user?.name) {
            setUserName(user.name);
          }
        } catch {}
      }
      const storedName = sessionStorage.getItem('propertyease_user_name');
      if (storedName) setUserName(storedName);
    }
  }, []);

  // Global keydown handler for ⌘ K and ⌘ J
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Time-of-day greeting depends on the user's local hour, which the
  // server does not know (it would render in UTC and disagree with the
  // client). Render a stable placeholder on SSR and only swap in the
  // real greeting after mount.
  const mounted = useMounted();
  const getGreetingPrefix = () => {
    const hour = new Date().getHours();
    if (lang === 'ar') {
      if (hour < 12) return 'صباح الخير';
      if (hour < 17) return 'مساء الخير';
      return 'مساء الخير';
    }
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const greetingPrefix = mounted
    ? getGreetingPrefix()
    : (lang === 'ar' ? 'مرحباً' : 'Welcome');
  const greeting = `${greetingPrefix}, ${userName}`;

  // Map country → ICU locale for date/time formatting. Falls back to
  // en-US if the country isn't in the table.
  const countryLocale: Record<string, string> = {
    QA: 'en-QA', AE: 'en-AE', SA: 'en-SA', KW: 'en-KW', BH: 'en-BH', OM: 'en-OM',
  };
  const intlLocale = lang === 'ar'
    ? `ar-${country.code}`
    : (countryLocale[country.code] || 'en-US');

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[#F6F8F6] bg-grid-pattern text-slate-900 flex flex-col">
      {/* Sidebar Component */}
      <Sidebar
        lang={lang}
        isMobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area — full width; Copilot is a floating overlay */}
      <div className={`flex-1 transition-all duration-300 ${
        isRtl ? 'lg:mr-[240px]' : 'lg:ml-[240px]'
      }`}>
        {/* Top Navigation Bar Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-4 flex items-center justify-between">
          {/* Left / Title Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-200/60 rounded-xl text-slate-700 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                {greeting}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {lang === 'en' ? 'Dashboard' : 'لوحة التحكم'}
              </h1>
            </div>
          </div>

          {/* Right Action Items matching screenshot header */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Remote Link Button */}
            <button
              onClick={() => setRemoteModalOpen(true)}
              className="bg-[#D97757] hover:bg-[#c66546] text-white font-semibold px-3 py-1.5 rounded-full text-xs transition-all shadow-sm flex items-center gap-1.5"
              title="Connect Mobile / Remote Control"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'en' ? 'Mobile Link' : 'جوال'}</span>
            </button>

            {/* Search Pill Bar */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-3 bg-white border border-slate-200 rounded-full px-4 py-2 text-xs text-slate-400 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span>{lang === 'en' ? 'Search anything' : 'بحث في النظام'}</span>
              <kbd className="bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ml-2">
                ⌘ K
              </kbd>
            </button>

            {/* Country Selector */}
            <div className="relative">
              <button
                onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-3 py-1.5 rounded-full text-xs transition-all shadow-sm flex items-center gap-1.5"
                aria-label="Select country"
              >
                <Globe className="w-3.5 h-3.5" />
                {/* Show country name (not the ISO code) so we don't get
                    "QA QA" when the regional-indicator flag emoji renders
                    as the literal letters on systems without emoji fonts. */}
                <span className="hidden sm:inline">{country.name}</span>
                <span className="sm:hidden">{country.code}</span>
              </button>
              {countryDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setCountryDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[160px]">
                    {(lang === 'ar' ? [...Object.values(COUNTRIES)].reverse() : Object.values(COUNTRIES)).map((c: CountryConfig) => (
                      <button
                        key={c.code}
                        onClick={() => { setCountry(c); setCountryDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                          c.code === country.code ? 'text-[#D97757] font-bold' : 'text-slate-700'
                        }`}
                      >
                        <span>{c.flag}</span>
                        <span className="flex-1">{c.name}</span>
                        <span className="text-slate-400">{c.currency}</span>
                        {c.code === country.code && <span className="text-[#D97757]">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Language Switch Button */}
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-3.5 py-1.5 rounded-full text-xs transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>{lang === 'en' ? 'عربي' : 'EN'}</span>
            </button>

            {/* Copilot open button (also bound to ⌘J from the panel itself) */}
            <CopilotOpenButton lang={lang} />

            {/* Notification Bell with red indicator */}
            <button className="w-9 h-9 bg-white border border-slate-200 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-600 transition-all shadow-sm relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            {/* User Portfolio Tag matching screenshot */}
            <div className="hidden md:flex flex-col text-right pl-2 border-l border-slate-200 ml-1">
              <span className="text-xs font-bold text-slate-900 leading-tight">Portfolio HQ</span>
              <span className="text-[11px] text-slate-400">{country.capital} · {country.name}</span>
            </div>
          </div>
        </header>

        {/* Page Content View */}
        <main className="p-4 sm:p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>

      {/* Global Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        lang={lang}
      />

      {/* Mobile Remote Control Modal */}
      <RemoteControlModal
        isOpen={remoteModalOpen}
        onClose={() => setRemoteModalOpen(false)}
        lang={lang}
      />

      {/* Global Copilot — available on every page, voice-enabled */}
      <GlobalCopilot lang={lang} />
    </div>
  );
}
