'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Building2, User, FileText, Wrench, X } from 'lucide-react';

interface SearchResult {
  title: string;
  type: string;
  icon: typeof Building2;
  desc: string;
  href: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'en' | 'ar';
}

export default function SearchModal({ isOpen, onClose, lang = 'en' }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [propsRes, tenantsRes, leasesRes, maintRes] = await Promise.all([
          fetch('/api/properties', { cache: 'no-store' }),
          fetch('/api/tenants', { cache: 'no-store' }),
          fetch('/api/leases', { cache: 'no-store' }),
          fetch('/api/maintenance', { cache: 'no-store' }),
        ]);

        const props = (await propsRes.json()).data || [];
        const tenants = (await tenantsRes.json()).data || [];
        const leases = (await leasesRes.json()).data || [];
        const maintenance = (await maintRes.json()).data || [];

        const items: SearchResult[] = [
          ...props.map((p: any) => ({
            title: p.name,
            type: 'Property',
            icon: Building2,
            desc: p.city || '',
            href: '/properties',
          })),
          ...tenants.map((t: any) => ({
            title: t.name,
            type: 'Tenant',
            icon: User,
            desc: t.phone || '',
            href: '/tenants',
          })),
          ...leases.map((l: any) => ({
            title: l.lease_number,
            type: 'Lease',
            icon: FileText,
            desc: 'Active',
            href: '/leases',
          })),
          ...maintenance.map((t: any) => ({
            title: t.ticket_number + ' — ' + t.title,
            type: 'Ticket',
            icon: Wrench,
            desc: '',
            href: '/maintenance',
          })),
        ];

        setResults(items);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = query
    ? results.filter(r =>
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.desc.toLowerCase().includes(query.toLowerCase()) ||
        r.type.toLowerCase().includes(query.toLowerCase())
      )
    : results;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-fade-in">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder={lang === 'en' ? 'Search tenants, units, leases, or tickets...' : 'بحث في المستأجرين، الوحدات، العقود أو التذاكر...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
          />
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results list */}
        <div className="p-2 max-h-80 overflow-y-auto divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              {lang === 'en' ? 'Loading…' : 'جارِ التحميل…'}
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => { router.push(item.href); onClose(); }}
                  className="w-full p-3 hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                      <div className="text-xs text-slate-500">{item.desc}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {item.type}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">
              {lang === 'en' ? 'No matching records found' : 'لم يتم العثور على نتائج متطابقة'}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
          <span>Press <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px]">ESC</kbd> to exit</span>
          <span>PropertyEase AI Quick Search</span>
        </div>
      </div>
    </div>
  );
}
