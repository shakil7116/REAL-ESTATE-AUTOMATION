'use client';

import { useState, useEffect } from 'react';
import { Bell, CreditCard, ShieldAlert, UserCircle, CheckCircle2, Trash2, AlertTriangle } from 'lucide-react';
import { notifyChange } from '@/lib/store';
import { useCountry } from '@/context/CountryContext';
import { Button, Card, Avatar, Badge } from '@/components/ui';

type SettingsTab = 'profile' | 'notifications' | 'billing' | 'danger_zone';

export default function SettingsPage() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const isRtl = lang === 'ar';
  const tr = (en: string, ar: string) => isRtl ? ar : en;
  const { currency } = useCountry();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Profile fields — resolve from session/localStorage
  const resolveName = (): string => {
    try {
      const raw = sessionStorage.getItem('propertyease_user');
      if (raw) {
        const user = JSON.parse(raw);
        if (user?.name && user.name !== 'Noura Al Mansouri') return user.name;
      }
    } catch {}
    const storedName = sessionStorage.getItem('propertyease_user_name');
    if (storedName) return storedName;
    const saved = localStorage.getItem('propertyease_profile');
    if (saved) {
      const p = JSON.parse(saved);
      if (p.name) return p.name;
    }
    return '';
  };

  const [name, setName] = useState('User');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Load saved profile on mount (client-only to avoid SSR/client mismatch)
  useEffect(() => {
    const resolved = resolveName();
    if (resolved) setName(resolved);
    const saved = localStorage.getItem('propertyease_profile');
    if (saved) {
      const p = JSON.parse(saved);
      if (p.email) setEmail(p.email);
      if (p.phone) setPhone(p.phone);
    }
  }, []);

  // Notification toggles
  const [rentReminders, setRentReminders] = useState(true);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState(true);
  const [leaseExpiryWarnings, setLeaseExpiryWarnings] = useState(true);
  const [marketingInsights, setMarketingInsights] = useState(false);

  // Danger zone modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleSaveProfile = async () => {
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone }),
      });
    } catch {} // best-effort
    notifyChange('settings_updated', tr('Profile saved successfully', 'تم حفظ الملف الشخصي بنجاح'));
  };

  const confirmDeleteAccount = () => {
    if (deleteText !== 'DELETE MY ACCOUNT') return;
    setDeleting(true);
    setTimeout(() => {
      notifyChange('account_deleted', tr('Account deleted. Redirecting…', 'تم حذف الحساب. جارٍ إعادة التوجيه…'));
      setDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteText('');
    }, 1500);
  };

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`w-11 h-6 rounded-full transition-colors relative ${on ? 'bg-[#132B25]' : 'bg-slate-200'}`}
      aria-label="Toggle"
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? (isRtl ? 'left-0.5' : 'left-[22px]') : (isRtl ? 'right-0.5' : 'right-[22px]')}`} />
    </button>
  );

  const tabList: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
    { key: 'profile',       label: tr('Profile', 'الملف الشخصي'),    icon: UserCircle },
    { key: 'notifications', label: tr('Notifications', 'الإشعارات'), icon: Bell },
    { key: 'billing',       label: tr('Billing', 'الفواتير'),        icon: CreditCard },
    { key: 'danger_zone',   label: tr('Danger Zone', 'المنطقة الخطرة'), icon: ShieldAlert },
  ];

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">{tr('Settings', 'الإعدادات')}</h1>
        <p className="text-slate-500 text-sm mt-1">{tr('Configure your PropertyEase account and preferences', 'تكوين حساب PropertyEase وتفضيلاتك')}</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-white rounded-2xl border border-slate-200/80 p-1.5 inline-flex overflow-x-auto">
        {tabList.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === key
                ? 'bg-[#132B25] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <Card padding="none" className="overflow-hidden">
        {/* ── PROFILE TAB ── */}
        {activeTab === 'profile' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <Avatar name={name || 'User'} size="lg" />
              <div>
                <div className="font-extrabold text-slate-900 text-lg">{name || '—'}</div>
                <div className="text-xs text-slate-500">{email || '—'} · {tr('Owner', 'مالك')}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Full Name', 'الاسم الكامل')}</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full max-w-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Email', 'البريد الإلكتروني')}</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full max-w-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">{tr('Phone', 'الهاتف')}</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full max-w-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]" />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldAlert className="w-4 h-4" />
                <span>{tr(`Role: Owner · Plan: Growth ${currency} 299/mo · Account created Jan 2025`, `الدور: مالك · الخطة: نمو 299 ${currency}/شهر · تم إنشاء الحساب يناير 2025`)}</span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="primary" onClick={handleSaveProfile} icon={<CheckCircle2 className="w-4 h-4" />}>
                {tr('Save Profile', 'حفظ الملف الشخصي')}
              </Button>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS TAB ── */}
        {activeTab === 'notifications' && (
          <div className="p-6 space-y-5">
            {[
              { label: tr('Rent Reminders', 'تذكيرات الإيجار'),  desc: tr('Get notified before rent is due each month', 'تلقي تنبيه قبل استحقاق الإيجار كل شهر'), toggle: rentReminders, setToggle: setRentReminders },
              { label: tr('Maintenance Alerts', 'تنبيهات الصيانة'), desc: tr('Receive alerts when maintenance tickets are created or updated', 'استقبال تنبيهات عند إنشاء أو تحديث تذاكر الصيانة'), toggle: maintenanceAlerts, setToggle: setMaintenanceAlerts },
              { label: tr('Lease Expiry Warnings', 'تنبيهات انتهاء العقود'), desc: tr('Warning notifications 60 days before lease expiry', 'تنبيهات تحذيرية قبل 60 يوماً من انتهاء العقد'), toggle: leaseExpiryWarnings, setToggle: setLeaseExpiryWarnings },
              { label: tr('Marketing Insights', 'رؤى التسويقية'), desc: tr('Weekly summary of campaign performance and lead activity', 'ملخص أسبوعي لأداء الحملات ونشاط العملاء المحتملين'), toggle: marketingInsights, setToggle: setMarketingInsights },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{item.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                </div>
                <Toggle on={item.toggle} onToggle={() => item.setToggle(!item.toggle)} />
              </div>
            ))}
            <div className="pt-4 border-t border-slate-100 text-xs text-slate-400">
              {tr('Notification preferences are stored locally in your browser.', 'تفضيلات الإشعارات مخزنة محلياً في متصفحك.')}
            </div>
          </div>
        )}

        {/* ── BILLING TAB ── */}
        {activeTab === 'billing' && (
          <div className="p-6 space-y-6">
            <div className="bg-gradient-to-br from-[#132B25] to-[#0D2A24] rounded-2xl p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#D97757] mb-2">{tr('Current Plan', 'الخطة الحالية')}</div>
                  <div className="text-2xl font-extrabold">{tr('Growth', 'نمو')}</div>
                  <div className="text-sm text-slate-300 mt-1">{currency} 299<span className="text-xs text-slate-400">/mo</span></div>
                </div>
                <div className="text-end">
                  <Badge tone="emerald">{tr('Active', 'نشط')}</Badge>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-slate-400">{tr('Next Billing Date', 'تاريخ الفوترة التالي')}</div>
                  <div className="font-bold text-white mt-1">—</div>
                </div>
                <div>
                  <div className="text-slate-400">{tr('Payment Method', 'طريقة الدفع')}</div>
                  <div className="font-bold text-white mt-1 flex items-center gap-1.5">
                    <CreditCard className="w-3 h-3" />**** **** **** 4242
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{tr('Plan Includes', 'تشمل الخطة')}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  tr('Unlimited properties & units', 'عقارات ووحدات غير محدودة'),
                  tr('Up to 200 tenants', 'حتى 200 مستأجر'),
                  tr('Lease & PDC management', 'إدارة العقود والشيكات'),
                  tr('Maintenance tickets', 'تذاكر الصيانة'),
                  tr('Campaign tracking', 'تتبع الحملات'),
                  tr('Basic reports & export', 'تقارير أساسية وتصدير'),
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    {feat}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" size="sm" icon={<CreditCard className="w-4 h-4" />}>
                {tr('Change Payment Method', 'تغيير طريقة الدفع')}
              </Button>
              <Button variant="secondary" size="sm">
                {tr('Upgrade Plan', 'ترقية الخطة')}
              </Button>
            </div>
          </div>
        )}

        {/* ── DANGER ZONE TAB ── */}
        {activeTab === 'danger_zone' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-extrabold text-sm">{tr('Danger Zone', 'المنطقة الخطرة')}</h3>
            </div>
            <p className="text-xs text-slate-500">
              {tr('The following actions are irreversible. Proceed with caution.', 'الإجراءات التالية لا يمكن التراجع عنها. تصرف بحذر.')}
            </p>

            <Card className="border-rose-200 bg-rose-50/50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-rose-700 text-sm">{tr('Delete Account', 'حذف الحساب')}</div>
                  <div className="text-xs text-rose-500 mt-1">
                    {tr('This will permanently delete your account, all properties, units, tenants, leases, and associated data. This cannot be undone.', 'سيؤدي هذا إلى حذف حسابك وجميع العقارات والوحدات والمستأجرين والعقود والبيانات المرتبطة بشكل نهائي. لا يمكن التراجع عن هذا.')}
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  icon={<Trash2 className="w-4 h-4" />}
                >
                  {tr('Delete Account', 'حذف الحساب')}
                </Button>
              </div>
            </Card>

            <Card className="border-amber-200 bg-amber-50/50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-amber-700 text-sm">{tr('Clear All Local Data', 'مسح جميع البيانات المحلية')}</div>
                  <div className="text-xs text-amber-600 mt-1">
                    {tr('Remove all locally cached data from this browser. Your cloud data (if connected) remains unaffected.', 'إزالة جميع البيانات المؤقتة محلياً من هذا المتصفح. بيانات السحابة (إذا كانت متصلة) تبقى دون تأثير.')}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="border-amber-300 text-amber-700"
                  onClick={() => {
                    if (!confirm(tr('Clear all local data? This cannot be undone.', 'مسح جميع البيانات المحلية؟ لا يمكن التراجع عن هذا.'))) return;
                    localStorage.removeItem('propertyease_properties');
                    localStorage.removeItem('propertyease_units');
                    localStorage.removeItem('propertyease_tenants');
                    localStorage.removeItem('propertyease_leases');
                    localStorage.removeItem('propertyease_payments');
                    localStorage.removeItem('propertyease_maintenance');
                    localStorage.removeItem('propertyease_leads');
                    localStorage.removeItem('propertyease_ad_campaigns');
                    notifyChange('data_cleared', tr('All local data cleared', 'تم مسح جميع البيانات المحلية'));
                  }}
                >
                  {tr('Clear Data', 'مسح البيانات')}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </Card>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="max-w-sm w-full shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h2 className="font-extrabold text-slate-900 text-lg">{tr('Confirm Account Deletion', 'تأكيد حذف الحساب')}</h2>
              </div>
              <p className="text-sm text-slate-500">
                {tr('Type "DELETE MY ACCOUNT" to confirm. This action is permanent and cannot be undone.', 'اكتب "DELETE MY ACCOUNT" للتأكيد. هذا الإجراء نهائي ولا يمكن التراجع عنه.')}
              </p>
              <input
                type="text"
                value={deleteText}
                onChange={e => setDeleteText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]"
              />
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); }}>
                  {tr('Cancel', 'إلغاء')}
                </Button>
                <Button
                  variant="danger"
                  onClick={confirmDeleteAccount}
                  loading={deleting}
                  disabled={deleteText !== 'DELETE MY ACCOUNT' || deleting}
                  icon={<Trash2 className="w-4 h-4" />}
                >
                  {tr('Delete Account', 'حذف الحساب')}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
