'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText, 
  Wrench, 
  Target, 
  BarChart3, 
  Settings,
  ChevronRight,
  Home
} from 'lucide-react';

const navItems = [
  { key: 'dashboard', label: { en: 'Dashboard', ar: 'لوحة التحكم' }, icon: LayoutDashboard, href: '/dashboard' },
  { key: 'properties', label: { en: 'Properties & Units', ar: 'العقارات والوحدات' }, icon: Building2, href: '/properties' },
  { key: 'tenants', label: { en: 'Tenants & Leads', ar: 'المستأجرون والعملاء' }, icon: Users, href: '/tenants' },
  { key: 'leases', label: { en: 'Leases & Payments', ar: 'العقود والمدفوعات' }, icon: FileText, href: '/leases' },
  { key: 'maintenance', label: { en: 'Maintenance Tickets', ar: 'تذاكر الصيانة' }, icon: Wrench, href: '/maintenance' },
  { key: 'campaigns', label: { en: 'Ad Campaigns', ar: 'الحملات الإعلانية' }, icon: Target, href: '/campaigns' },
  { key: 'reports', label: { en: 'Reports', ar: 'التقارير' }, icon: BarChart3, href: '/reports' },
  { key: 'settings', label: { en: 'Settings', ar: 'الإعدادات' }, icon: Settings, href: '/settings' },
];

interface SidebarProps {
  lang: 'en' | 'ar';
  isMobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ lang, isMobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const isRtl = lang === 'ar';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 z-50 w-[240px] bg-[#132B25] text-[#8EA499] flex flex-col transition-transform duration-300 ease-in-out ${
          isRtl ? 'right-0 border-l border-[#1F3D35]' : 'left-0 border-r border-[#1F3D35]'
        } ${
          isMobileOpen 
            ? 'translate-x-0' 
            : isRtl 
              ? 'translate-x-full lg:translate-x-0' 
              : '-translate-x-full lg:translate-x-0'
        }`}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#1A3830]">
          <div className="flex items-center gap-3">
            {/* Logo Badge in Coral/Salmon background matching the screenshot */}
            <div className="w-9 h-9 bg-[#D97757] rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm text-white">
              <Home className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-lg tracking-tight leading-tight">
                PropertyEase
              </span>
              <span className="text-[10px] font-bold tracking-widest text-[#8EA499] uppercase mt-0.5">
                OPERATIONS OS
              </span>
            </div>
          </div>
        </div>

        {/* Workspace Label & Nav Menu */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-6">
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-[#6A857A] uppercase">
              {lang === 'en' ? 'WORKSPACE' : 'مساحة العمل'}
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-[#DDE9E2] text-[#0D2A24] font-semibold shadow-sm'
                        : 'text-[#8EA499] hover:bg-[#1A3830] hover:text-[#E2EFE7]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#0D2A24]' : 'text-[#8EA499]'}`} />
                      <span>{item.label[lang]}</span>
                    </div>

                    {isActive && (
                      <ChevronRight className={`w-4 h-4 text-[#0D2A24] ${isRtl ? 'rotate-180' : ''}`} />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer User Info / System Status */}
        <div className="p-3 border-t border-[#1A3830] text-xs text-[#6A857A] flex items-center justify-between">
          <span className="truncate">PropertyEase v2.4</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
      </aside>
    </>
  );
}
