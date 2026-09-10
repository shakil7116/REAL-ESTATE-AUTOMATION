/**
 * lib/i18n.ts — Mobile translation layer (English + Arabic MSA).
 *
 * Mirrors the web i18n key structure in propertyease/src/lib/i18n.ts so that
 * the same semantic keys work on both platforms. Only keys actually used by
 * the mobile screens are included here; unused web keys can be added later.
 *
 * Usage:
 *   import { t, setLanguage } from './i18n';
 *   const label = t('dashboard.title');          // "Dashboard" / "لوحة التحكم"
 *   const fmt   = t('currency', { value: 5000 }); // "QAR 5,000" / "٥٬٠٠٠ ر.ق"
 */
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Keys ──────────────────────────────────────────────────────────────────────
const LANG_KEY = 'pe_lang'; // mirrors session.ts LANG_KEY

type Locale = 'en' | 'ar';

// ── Translation tables ────────────────────────────────────────────────────────
const translations: Record<Locale, Record<string, string>> = {
  en: {
    // ── Nav ─────────────────────────────────────────────────────────────────
    'nav.dashboard': 'Dashboard',
    'nav.properties': 'Properties',
    'nav.tenants': 'Tenants',
    'nav.payments': 'Payments',
    'nav.maintenance': 'Maintenance',
    'nav.copilot': 'AI Copilot',
    'nav.settings': 'Settings',

    // ── Login ───────────────────────────────────────────────────────────────
    'login.title': 'PropertyEase',
    'login.subtitle': 'Sign in to manage your portfolio',
    'login.email': 'Email address',
    'login.password': 'Password',
    'login.signIn': 'Sign In',
    'login.signingIn': 'Signing in…',
    'login.errorFill': 'Please fill in email and password',
    'login.errorCreds': 'Invalid credentials',
    'login.errorConnectTitle': 'Connection Error',
    'login.errorConnect':
      'Could not reach the server. Make sure the web app is running.',
    'login.welcomeBack': 'Welcome back',
    'login.formName': 'Full Name',
    'login.placeholderName': 'e.g. Mamun Mia',
    'login.placeholderEmail': 'you@company.com',
    'login.placeholderPassword': 'Min. 8 characters',
    'login.hint': 'Demo mode: any email + password "demo" if NEXTAUTH_DEMO=true',
    'login.tagline': 'Smart Property Management for Qatar',

    // ── Dashboard ───────────────────────────────────────────────────────────
    'dashboard.greetingMorning': 'Good morning',
    'dashboard.greetingAfternoon': 'Good afternoon',
    'dashboard.greetingEvening': 'Good evening',
    'dashboard.title': 'Dashboard',
    'dashboard.portfolioOverview': 'Portfolio Overview',
    'dashboard.totalRevenue': 'Total Revenue',
    'dashboard.occupiedUnits': 'Occupied Units',
    'dashboard.pendingPayments': 'Pending Payments',
    'dashboard.openTickets': 'Open Tickets',
    'dashboard.needsAttention': 'needs attention',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.actionProperties': 'Properties',
    'dashboard.actionPayment': 'Record Payment',
    'dashboard.actionTicket': 'Create Ticket',
    'dashboard.actionTenants': 'View Tenants',
    'dashboard.healthTitle': 'Portfolio Health Score',
    'dashboard.healthSub': 'Based on occupancy & payments',
    'dashboard.healthScore': 'Score',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.noActivity': 'No recent activity',
    'dashboard.loading': 'Loading dashboard…',

    // ── Properties ──────────────────────────────────────────────────────────
    'properties.title': 'Properties',
    'properties.searchPlaceholder': 'Search properties…',
    'properties.all': 'All Properties',
    'properties.active': 'Active',
    'properties.residential': 'Residential',
    'properties.commercial': 'Commercial',
    'properties.mixedUse': 'Mixed-Use',
    'properties.loading': 'Loading…',
    'properties.noResults': 'No properties found',
    'properties.addFirst': 'Add your first property',
    'properties.viewDetails': 'View Details',
    'properties.beds': 'beds',
    'properties.baths': 'baths',
    'properties.sqft': 'sqft',
    'properties.total': 'Total',
    'properties.units': 'Units',
    'properties.noUnitsAssigned': 'No unit assigned',
    'properties.unitsLabel': 'units',
    'properties.unitCount': 'units',

    // ── Tenants ─────────────────────────────────────────────────────────────
    'tenants.title': 'Tenants & Leads',
    'tenants.leads': 'Leads',
    'tenants.searchPlaceholder': 'Search tenants…',
    'tenants.noUnit': 'No unit assigned',
    'tenants.active': 'Active',
    'tenants.expired': 'Expired',
    'tenants.pendingRenewal': 'Pending Renewal',
    'tenants.sourceDirect': 'Direct',
    'tenants.sourcePhone': 'Phone',
    'tenants.sourceWhatsApp': 'WhatsApp',
    'tenants.sourceMetaAds': 'Meta Ads',
    'tenants.sourceGoogleAds': 'Google Ads',
    'tenants.sourceBayut': 'Bayut',
    'tenants.sourcePropertyFinder': 'Property Finder',
    'tenants.sourceReferral': 'Referral',
    'tenants.sourceOther': 'Other',
    'tenants.unitLabel': 'Unit',
    'tenants.perYear': '/yr',
    'tenants.noTenants': 'No tenants yet',
    'tenants.noTenantsSub': 'Leasing a unit will create a tenant record',
    'tenants.noLeads': 'No leads yet',
    'tenants.noLeadsSub': 'Leads appear when prospects inquire about units',
    'tenants.addButton': '+ Add',
    'tenants.leadStatusNew': 'New',
    'tenants.leadStatusContacted': 'Contacted',
    'tenants.leadStatusInterested': 'Interested',
    'tenants.leadStatusVisited': 'Visited',
    'tenants.leadStatusNegotiating': 'Negotiating',
    'tenants.leadStatusConverted': 'Converted',
    'tenants.leadStatusLost': 'Lost',
    'tenants.statusActive': 'Active',
    'tenants.statusExpired': 'Expired',
    'tenants.statusPendingRenewal': 'Pending Renewal',

    // ── Payments ────────────────────────────────────────────────────────────
    'payments.title': 'Payments',
    'payments.tabAll': 'All',
    'payments.tabReceived': 'Received',
    'payments.tabOverdue': 'Overdue',
    'payments.tabPending': 'Pending',
    'payments.searchPlaceholder': 'Search payments…',
    'payments.recordNew': 'Record Payment',
    'payments.formTenantName': 'Tenant name',
    'payments.formAmount': 'Amount',
    'payments.formDate': 'Date',
    'payments.formType': 'Payment type',
    'payments.typeRent': 'Rent',
    'payments.typeOther': 'Other',
    'payments.formNotes': 'Notes (optional)',
    'payments.save': 'Save Payment',
    'payments.cancel': 'Cancel',
    'payments.alertFill': 'Please fill in tenant name and amount',
    'payments.success': 'Payment recorded',
    'payments.errorGeneric': 'Failed to save',
    'payments.noData': 'No payments yet',
    'payments.collectedThisMonth': 'Collected this month',
    'payments.tapToAddPayment': 'Tap + to record a payment',
    'payments.placeholderTenant': 'e.g. Ahmed Hassan',
    'payments.placeholderAmount': 'e.g. 65000',
    'payments.modalTitle': 'Record Payment',
    'payments.statusReceived': 'Received',
    'payments.statusOverdue': 'Overdue',
    'payments.statusPending': 'Pending',
    'payments.statusBounced': 'Bounced',

    // ── Maintenance ─────────────────────────────────────────────────────────
    'maintenance.title': 'Maintenance',
    'maintenance.tabAll': 'All',
    'maintenance.tabOpen': 'Open',
    'maintenance.tabInProgress': 'In Progress',
    'maintenance.tabCompleted': 'Done',
    'maintenance.searchPlaceholder': 'Search tickets…',
    'maintenance.createTicket': 'Create Ticket',
    'maintenance.formTitle': 'Title',
    'maintenance.formDescription': 'Description',
    'maintenance.formPriority': 'Priority',
    'maintenance.priorityLow': 'Low',
    'maintenance.priorityMedium': 'Medium',
    'maintenance.priorityHigh': 'High',
    'maintenance.priorityUrgent': 'Urgent',
    'maintenance.formProperty': 'Select Property',
    'maintenance.formUnit': 'Select Unit',
    'maintenance.formAssignTo': 'Assign To (optional)',
    'maintenance.requestedBy': 'Requested By',
    'maintenance.save': 'Save Ticket',
    'maintenance.cancel': 'Cancel',
    'maintenance.alertFillTitle': 'Please enter a ticket title',
    'maintenance.success': 'Ticket created',
    'maintenance.errorGeneric': 'Failed to save',
    'maintenance.noData': 'No open tickets',
    'maintenance.statusOpen': 'Open',
    'maintenance.statusInProgress': 'In Progress',
    'maintenance.statusWaitingParts': 'Waiting Parts',
    'maintenance.statusCompleted': 'Completed',
    'maintenance.statusCancelled': 'Cancelled',
    'maintenance.noTickets': 'No tickets',
    'maintenance.noTicketsSub': 'Tap + to create a maintenance request',
    'maintenance.urgentAttention': 'urgent ticket{count} need attention',
    'maintenance.newTicket': 'New Ticket',
    'maintenance.ticketDetails': 'Ticket Details',
    'maintenance.placeholderTicketTitle': 'e.g. Elevator repair',
    'maintenance.placeholderTicketDesc': 'Describe the issue…',
    'maintenance.unitLabel': 'Unit',
    'maintenance.tenantLabel': 'Tenant',
    'maintenance.descriptionLabel': 'Description',
    'maintenance.noDescription': 'No description provided.',

    // ── Copilot ─────────────────────────────────────────────────────────────
    'copilot.title': 'AI Copilot',
    'copilot.welcome':
      "Hello! I'm your PropertyEase AI Copilot. I can help with leasing, maintenance, finance & marketing. What would you like to do today?",
    'copilot.inputPlaceholder': 'Ask Copilot anything...',
    'copilot.send': 'Send',
    'copilot.collectRent': 'Collect Rent',
    'copilot.maintenance': 'Maintenance',
    'copilot.expiringLeases': 'Expiring Leases',
    'copilot.insights': 'AI Insights',
    'copilot.portfolioPulse': 'Portfolio Pulse',
    'copilot.unavailable':
      'The rent-collection data is unavailable right now. Please connect to the network and try again.',
    'copilot.maintenanceUnavailable':
      'Maintenance status is currently unavailable. Please check your connection and retry.',
    'copilot.leaseUnavailable':
      'Lease information is currently unavailable. Please check your connection and retry.',
    'copilot.insightsUnavailable':
      'Portfolio insights require a live connection to the PropertyEase API. Please try again later.',
    'copilot.revenue': 'Revenue',
    'copilot.occupancy': 'Occupancy',
    'copilot.openTickets': 'Open Tickets',
    'copilot.newLeads': 'New Leads',

    // ── Settings ────────────────────────────────────────────────────────────
    'settings.title': 'Settings',
    'settings.preferences': 'Preferences',
    'settings.language': 'Language',
    'settings.country': 'Country',
    'settings.notifications': 'Notifications',
    'settings.security': 'Security',
    'settings.planGrowth': 'Growth Plan',
    'settings.planPrice': 'QAR 299/mo',
    'settings.upgradeEnterprise': 'Upgrade to Enterprise',
    'settings.signOut': 'Sign Out',
    'settings.online': 'Online — Portfolio Live',
    'settings.profileRole': 'Property Manager',
    'settings.selectCountry': 'Select Country',
    'settings.on': 'On',
    'settings.langEnglish': 'English',
    'settings.langArabic': 'العربية',

    // ── Common / shared ─────────────────────────────────────────────────────
    'common.loading': 'Loading…',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.back': 'Back',
    'common.empty': 'No data found',
    'common.tryAgain': 'Try again',
    'common.date': 'Date',
    'common.amount': 'Amount',
    'common.name': 'Name',
    'common.status': 'Status',
    'common.all': 'All',
    'common.received': 'Received',
    'common.overdue': 'Overdue',
    'common.pending': 'Pending',
    'common.on': 'On',
    'common.add': 'Add',
    'common.networkError': 'Network error — please try again.',
  },

  ar: {
    // ── Nav ─────────────────────────────────────────────────────────────────
    'nav.dashboard': 'لوحة التحكم',
    'nav.properties': 'العقارات',
    'nav.tenants': 'المستأجرين',
    'nav.payments': 'المدفوعات',
    'nav.maintenance': 'الصيانة',
    'nav.copilot': 'المساعد الذكي',
    'nav.settings': 'الإعدادات',

    // ── Login ───────────────────────────────────────────────────────────────
    'login.title': 'بروبرتي إيز',
    'login.subtitle': 'سجّل الدخول لإدارة محفظتك العقارية',
    'login.email': 'البريد الإلكتروني',
    'login.password': 'كلمة المرور',
    'login.signIn': 'تسجيل الدخول',
    'login.signingIn': 'جاري تسجيل الدخول…',
    'login.errorFill': 'يرجى ملء البريد الإلكتروني وكلمة المرور',
    'login.errorCreds': 'بيانات الدخول غير صحيحة',
    'login.errorConnectTitle': 'خطأ في الاتصال',
    'login.errorConnect':
      'تعذر الاتصال بالخادم. تأكد من تشغيل التطبيق الويب.',
    'login.welcomeBack': 'مرحباً بعودتك',
    'login.formName': 'الاسم الكامل',
    'login.placeholderName': 'مثال: مأمون مين',
    'login.placeholderEmail': 'أنت@شركتك.com',
    'login.placeholderPassword': '8 أحرف على الأقل',
    'login.hint': 'وضع التجربة: أي بريد + كلمة مرور "demo" إذا كان NEXTAUTH_DEMO=true',
    'login.tagline': 'إدارة عقارية ذكية لدولة قطر',

    // ── Dashboard ───────────────────────────────────────────────────────────
    'dashboard.greetingMorning': 'صباح الخير',
    'dashboard.greetingAfternoon': 'مساء الخير',
    'dashboard.greetingEvening': 'مساء الخير',
    'dashboard.title': 'لوحة التحكم',
    'dashboard.portfolioOverview': 'نظرة عامة على المحفظة',
    'dashboard.totalRevenue': 'إجمالي الإيرادات',
    'dashboard.occupiedUnits': 'الوحدات المشغولة',
    'dashboard.pendingPayments': 'المدفوعات المعلقة',
    'dashboard.openTickets': 'تذاكر الصيانة المفتوحة',
    'dashboard.needsAttention': 'تحتاج اهتماماً',
    'dashboard.quickActions': 'إجراءات سريعة',
    'dashboard.actionProperties': 'العقارات',
    'dashboard.actionPayment': 'تسجيل دفعة',
    'dashboard.actionTicket': 'إنشاء تذكرة',
    'dashboard.actionTenants': 'عرض المستأجرين',
    'dashboard.healthTitle': 'مؤشر صحة المحفظة',
    'dashboard.healthSub': 'بناءً على نسبة الإشغال والمدفوعات',
    'dashboard.healthScore': 'النتيجة',
    'dashboard.recentActivity': 'النشاط الأخير',
    'dashboard.noActivity': 'لا يوجد نشاط حديث',
    'dashboard.loading': 'جاري تحميل لوحة التحكم…',

    // ── Properties ──────────────────────────────────────────────────────────
    'properties.title': 'العقارات',
    'properties.searchPlaceholder': 'بحث في العقارات…',
    'properties.all': 'جميع العقارات',
    'properties.active': 'نشط',
    'properties.residential': 'سكني',
    'properties.commercial': 'تجاري',
    'properties.mixedUse': 'مختلط الاستخدام',
    'properties.loading': 'جار التحميل…',
    'properties.noResults': 'لا توجد عقارات',
    'properties.addFirst': 'أضف أول عقار لك',
    'properties.viewDetails': 'عرض التفاصيل',
    'properties.beds': 'غرف',
    'properties.baths': 'حمامات',
    'properties.sqft': 'قدم²',
    'properties.total': 'الإجمالي',
    'properties.units': 'وحدات',
    'properties.noUnitsAssigned': 'بدون وحدة محددة',
    'properties.unitsLabel': 'وحدة',

    // ── Tenants ─────────────────────────────────────────────────────────────
    'tenants.title': 'المستأجرون والعملاء',
    'tenants.leads': 'العملاء المحتملون',
    'tenants.searchPlaceholder': 'بحث في المستأجرين…',
    'tenants.noUnit': 'بدون وحدة محددة',
    'tenants.active': 'نشط',
    'tenants.expired': 'منتهي',
    'tenants.pendingRenewal': 'بانتظار التجديد',
    'tenants.sourceDirect': 'مباشر',
    'tenants.sourcePhone': 'هاتف',
    'tenants.sourceWhatsApp': 'واتساب',
    'tenants.sourceMetaAds': 'إعلانات ميتا',
    'tenants.sourceGoogleAds': 'إعلانات جوجل',
    'tenants.sourceBayut': 'عقارات',
    'tenants.sourcePropertyFinder': 'فرونتيارد',
    'tenants.sourceReferral': 'توصية',
    'tenants.sourceOther': 'أخرى',
    'tenants.unitLabel': 'الوحدة',
    'tenants.perYear': '/سنوي',
    'tenants.noTenants': 'لا يوجد مستأجرون بعد',
    'tenants.noTenantsSub': 'استئجار وحدة سينشئ سجل مستأجر',
    'tenants.noLeads': 'لا يوجد عملاء محتملون بعد',
    'tenants.noLeadsSub': 'تظهر العملاء عندما يستفسر المهتمون عن الوحدات',
    'tenants.addButton': '+ إضافة',
    'tenants.leadStatusNew': 'جديد',
    'tenants.leadStatusContacted': 'تم الاتصال',
    'tenants.leadStatusInterested': 'مهتم',
    'tenants.leadStatusVisited': 'زر',
    'tenants.leadStatusNegotiating': 'قيد التفاوض',
    'tenants.leadStatusConverted': 'مُحول',
    'tenants.leadStatusLost': 'فقد',
    'tenants.statusActive': 'نشط',
    'tenants.statusExpired': 'منتهي',
    'tenants.statusPendingRenewal': 'بانتظار التجديد',

    // ── Payments ────────────────────────────────────────────────────────────
    'payments.title': 'المدفوعات',
    'payments.tabAll': 'الكل',
    'payments.tabReceived': 'تم الاستلام',
    'payments.tabOverdue': 'متأخرة',
    'payments.tabPending': 'معلقة',
    'payments.searchPlaceholder': 'بحث في المدفوعات…',
    'payments.recordNew': 'تسجيل دفعة',
    'payments.formTenantName': 'اسم المستأجر',
    'payments.formAmount': 'المبلغ',
    'payments.formDate': 'التاريخ',
    'payments.formType': 'نوع الدفع',
    'payments.typeRent': 'إيجار',
    'payments.typeOther': 'أخرى',
    'payments.formNotes': 'ملاحظات (اختياري)',
    'payments.save': 'حفظ الدفعة',
    'payments.cancel': 'إلغاء',
    'payments.alertFill': 'يرجى ملء اسم المستأجر والمبلغ',
    'payments.success': 'تم تسجيل الدفعة بنجاح',
    'payments.errorGeneric': 'فشل حفظ الدفعة',
    'payments.noData': 'لا توجد مدفوعات بعد',
    'payments.collectedThisMonth': 'تم تحصيله هذا الشهر',
    'payments.tapToAddPayment': 'اضغط + لتسجيل دفعة',
    'payments.placeholderTenant': 'مثال: أحمد حسن',
    'payments.placeholderAmount': 'مثال: ٦٥٠٠٠',
    'payments.modalTitle': 'تسجيل دفعة',
    'payments.statusReceived': 'تم الاستلام',
    'payments.statusOverdue': 'متأخرة',
    'payments.statusPending': 'معلقة',
    'payments.statusBounced': 'مرتجعة',

    // ── Maintenance ─────────────────────────────────────────────────────────
    'maintenance.title': 'الصيانة',
    'maintenance.tabAll': 'الكل',
    'maintenance.tabOpen': 'مفتوح',
    'maintenance.tabInProgress': 'قيد التنفيذ',
    'maintenance.tabCompleted': 'مكتمل',
    'maintenance.searchPlaceholder': 'بحث في التذاكر…',
    'maintenance.createTicket': 'إنشاء تذكرة',
    'maintenance.formTitle': 'العنوان',
    'maintenance.formDescription': 'الوصف',
    'maintenance.formPriority': 'الأولوية',
    'maintenance.priorityLow': 'منخفض',
    'maintenance.priorityMedium': 'متوسط',
    'maintenance.priorityHigh': 'عالي',
    'maintenance.priorityUrgent': 'عاجل',
    'maintenance.formProperty': 'اختر العقار',
    'maintenance.formUnit': 'اختر الوحدة',
    'maintenance.formAssignTo': 'تعيين لـ (اختياري)',
    'maintenance.requestedBy': 'مقدم الطلب',
    'maintenance.save': 'حفظ التذكرة',
    'maintenance.cancel': 'إلغاء',
    'maintenance.alertFillTitle': 'يرجى إدخال عنوان للتذكرة',
    'maintenance.success': 'تم إنشاء التذكرة بنجاح',
    'maintenance.errorGeneric': 'فشل حفظ التذكرة',
    'maintenance.noData': 'لا توجد تذاكر مفتوحة',
    'maintenance.statusOpen': 'مفتوح',
    'maintenance.statusInProgress': 'قيد التنفيذ',
    'maintenance.statusWaitingParts': 'بانتظار القطع',
    'maintenance.statusCompleted': 'مكتمل',
    'maintenance.statusCancelled': 'ملغي',
    'maintenance.noTickets': 'لا توجد تذاكر',
    'maintenance.noTicketsSub': 'اضغط + لإنشاء طلب صيانة',
    'maintenance.urgentAttention': 'تذكرة عاجلة تحتاج اهتمام',
    'maintenance.newTicket': 'تذكرة جديدة',
    'maintenance.ticketDetails': 'تفاصيل التذكرة',
    'maintenance.placeholderTicketTitle': 'مثال: إصلاح المصعد',
    'maintenance.placeholderTicketDesc': 'اشرح المشكلة…',
    'maintenance.submitBtn': 'إنشاء التذكرة',
    'maintenance.unitLabel': 'الوحدة',
    'maintenance.tenantLabel': 'المستأجر',
    'maintenance.descriptionLabel': 'الوصف',
    'maintenance.noDescription': 'لا يوجد وصف.',

    // ── Copilot ─────────────────────────────────────────────────────────────
    'copilot.title': 'المساعد الذكي',
    'copilot.welcome':
      'مرحباً! أنا مساعدك الذكي في بروبرتي إيز. يمكنني مساعدتك في الإيجارات والصيانة والمالية والتسويق. ماذا تريد أن تفعل اليوم؟',
    'copilot.inputPlaceholder': 'اسأل المساعد الذكي أي شيء...',
    'copilot.send': 'إرسال',
    'copilot.collectRent': 'تحصيل الإيجار',
    'copilot.maintenance': 'الصيانة',
    'copilot.expiringLeases': 'العهود المنتهية',
    'copilot.insights': 'رؤى ذكية',
    'copilot.portfolioPulse': 'نبض المحفظة',
    'copilot.unavailable':
      'بيانات تحصيل الإيجار غير متاحة حالياً. يرجى الاتصال بالشبكة والمحاولة مرة أخرى.',
    'copilot.maintenanceUnavailable':
      'حالة الصيانة غير متاحة حالياً. يرجى التحقق من الاتصال والمحاولة مرة أخرى.',
    'copilot.leaseUnavailable':
      'معلومات العهود غير متاحة حالياً. يرجى التحقق من الاتصال والمحاولة مرة أخرى.',
    'copilot.insightsUnavailable':
      'تتطلب الرؤى العقارية اتصالاً مباشراً بواجهة برمجة بروبرتي إيز. يرجى المحاولة لاحقاً.',
    'copilot.revenue': 'الإيرادات',
    'copilot.occupancy': 'نسبة الإشغال',
    'copilot.openTickets': 'تذاكر مفتوحة',
    'copilot.newLeads': 'عملاء جدد',

    // ── Settings ────────────────────────────────────────────────────────────
    'settings.title': 'الإعدادات',
    'settings.preferences': 'التفضيلات',
    'settings.language': 'اللغة',
    'settings.country': 'الدولة',
    'settings.notifications': 'الإشعارات',
    'settings.security': 'الأمان',
    'settings.planGrowth': 'الخطة النمو',
    'settings.planPrice': '٢٩٩ ر.ق/شهر',
    'settings.upgradeEnterprise': 'ترقية إلى الخطة المؤسسية',
    'settings.signOut': 'تسجيل الخروج',
    'settings.online': 'متصل — المحفظة حية',
    'settings.profileRole': 'مدير عقارات',
    'settings.selectCountry': 'اختر الدولة',
    'settings.on': 'مفعّل',
    'settings.langEnglish': 'الإنجليزية',
    'settings.langArabic': 'العربية',

    // ── Common / shared ─────────────────────────────────────────────────────
    'common.loading': 'جار التحميل…',
    'common.error': 'خطأ',
    'common.success': 'تم بنجاح',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.back': 'رجوع',
    'common.empty': 'لا توجد بيانات',
    'common.tryAgain': 'أعد المحاولة',
    'common.date': 'التاريخ',
    'common.amount': 'المبلغ',
    'common.name': 'الاسم',
    'common.status': 'الحالة',
    'common.all': 'الكل',
    'common.received': 'تم الاستلام',
    'common.overdue': 'متأخرة',
    'common.pending': 'معلقة',
    'common.on': 'مفعّل',
    'common.add': 'إضافة',
    'common.networkError': 'خطأ في الشبكة — يرجى المحاولة مرة أخرى.',
  },
};

// ── State ─────────────────────────────────────────────────────────────────────
let currentLocale: Locale = 'en';

// ── Public API ────────────────────────────────────────────────────────────────

/** Translate a dot-separated key, with optional interpolation variables. */
export function t(key: string, vars?: Record<string, string | number>): string {
  let value = translations[currentLocale][key] ?? translations.en[key] ?? key;
  if (!vars) return value;
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
    value,
  );
}

/** Returns the current locale ('en' | 'ar'). */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Set locale and flip RTL direction.
 * Call this on app startup after reading the stored language from AsyncStorage.
 */
export async function setLocale(locale: Locale): Promise<void> {
  currentLocale = locale;
  await AsyncStorage.setItem(LANG_KEY, locale);
  I18nManager.forceRTL(locale === 'ar');
}

/** Read stored language from AsyncStorage and apply it. */
export async function initLocale(): Promise<Locale> {
  try {
    const raw = await AsyncStorage.getItem(LANG_KEY);
    const locale = raw === 'ar' ? 'ar' : 'en';
    currentLocale = locale;
    I18nManager.forceRTL(locale === 'ar');
    return locale;
  } catch {
    currentLocale = 'en';
    I18nManager.forceRTL(false);
    return 'en';
  }
}
