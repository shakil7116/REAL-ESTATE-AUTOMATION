/**
 * SettingsScreen — PropertyEase mobile settings.
 *
 * Shows user info from stored session, language toggle (EN/AR),
 * country selector (QA only — v1 ships Qatar-only per ADR-002),
 * and logout button. All preferences are persisted in AsyncStorage.
 */
import { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getUser, clearSession, getLanguage, saveLanguage, getCountry, saveCountry } from '../lib/session';
import { t } from '../lib/i18n';
import {
  PRIMARY, CORAL, WORKSPACE_BG, SLATE_500, SLATE_600, SLATE_700, SLATE_200, SLATE_300, SLATE_400, SLATE_100,
} from './colors';

const COUNTRIES = [
  { code: 'QA', name: 'Qatar', currency: 'QAR' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [country, setCountry] = useState('QA');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await getUser();
      if (u) setUser({ name: u.name, email: u.email });
      const l = await getLanguage();
      setLang(l);
      const c = await getCountry();
      setCountry(c);
    })();
  }, []);

  const handleLogout = async () => {
    await clearSession();
    router.replace('/login');
  };

  const initials = (user?.name || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const currentCountry = COUNTRIES.find(c => c.code === country) || COUNTRIES[0];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title')}</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || ''}</Text>
            <Text style={styles.profileRole}>{t('settings.profileRole')}</Text>
          </View>
        </View>

        {/* Language */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>{t('settings.preferences')}</Text>
        </View>
        <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}
          onPress={() => {
            const next = lang === 'en' ? 'ar' : 'en';
            saveLanguage(next);
            setLang(next);
          }}
        >
          <View style={styles.settingLeft}>
            <View style={styles.settingIcon}><Text style={styles.settingEmoji}>🌐</Text></View>
            <Text style={styles.settingLabel}>{t('settings.language')}</Text>
          </View>
          <Text style={styles.settingValue}>{lang === 'en' ? t('settings.langEnglish') : t('settings.langArabic')}</Text>
        </TouchableOpacity>

        {/* Country */}
        <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}
          onPress={() => setShowCountryPicker(true)}
        >
          <View style={styles.settingLeft}>
            <View style={styles.settingIcon}><Text style={styles.settingEmoji}>🌍</Text></View>
            <Text style={styles.settingLabel}>{t('settings.country')}</Text>
          </View>
          <Text style={styles.settingValue}>{currentCountry.name} ({currentCountry.currency})</Text>
        </TouchableOpacity>

        {/* Notifications */}
        <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
          <View style={styles.settingLeft}>
            <View style={styles.settingIcon}><Text style={styles.settingEmoji}>🔔</Text></View>
            <Text style={styles.settingLabel}>{t('settings.notifications')}</Text>
          </View>
          <View style={styles.toggleOn}><Text style={styles.toggleOnText}>{t('common.on')}</Text></View>
        </TouchableOpacity>

        {/* Security */}
        <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
          <View style={styles.settingLeft}>
            <View style={styles.settingIcon}><Text style={styles.settingEmoji}>🔒</Text></View>
            <Text style={styles.settingLabel}>{t('settings.security')}</Text>
          </View>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>

        {/* Country picker modal */}
        {showCountryPicker && (
          <View style={styles.countryPicker}>
            <View style={styles.countryPickerHeader}>
              <Text style={styles.countryPickerTitle}>{t('settings.selectCountry')}</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Text style={styles.countryPickerClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {COUNTRIES.map((c) => (
              <TouchableOpacity
                key={c.code}
                style={[styles.countryOption, country === c.code && styles.countryOptionActive]}
                onPress={async () => {
                  await saveCountry(c.code);
                  setCountry(c.code);
                  setShowCountryPicker(false);
                }}
              >
                <Text style={[styles.countryOptionText, country === c.code && styles.countryOptionTextActive]}>
                  {c.name} · {c.currency}
                </Text>
                {country === c.code && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Plan info */}
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View style={styles.planBadge}><Text style={styles.planBadgeText}>{t('settings.planGrowth')}</Text></View>
            <Text style={styles.planPrice}>{t('settings.planPrice')}</Text>
          </View>
          <TouchableOpacity style={styles.upgradeBtn}>
            <Text style={styles.upgradeBtnText}>{t('settings.upgradeEnterprise')}</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>{t('settings.signOut')}</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WORKSPACE_BG },
  scroll: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: SLATE_700 },
  profileCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SLATE_200,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  profileInfo: { flex: 1, marginLeft: 14 },
  profileName: { fontSize: 16, fontWeight: '800', color: SLATE_700 },
  profileEmail: { fontSize: 13, color: SLATE_500, fontWeight: '500', marginTop: 2 },
  profileRole: { fontSize: 12, color: SLATE_400, fontWeight: '600', marginTop: 2 },
  sectionLabel: { paddingHorizontal: 20, marginTop: 4, marginBottom: 8 },
  sectionLabelText: { fontSize: 11, fontWeight: '700', color: SLATE_400, textTransform: 'uppercase', letterSpacing: 1 },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 2,
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SLATE_100,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  settingIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  settingEmoji: { fontSize: 16 },
  settingLabel: { fontSize: 15, fontWeight: '600', color: SLATE_700 },
  settingValue: { fontSize: 14, color: SLATE_500, fontWeight: '500' },
  settingChevron: { fontSize: 20, color: SLATE_300, fontWeight: '300' },
  toggleOn: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  toggleOnText: { fontSize: 12, fontWeight: '700', color: '#059669' },
  planCard: {
    margin: 20,
    marginTop: 16,
    backgroundColor: PRIMARY,
    borderRadius: 18,
    padding: 18,
  },
  planHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  planBadge: {
    backgroundColor: CORAL,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  planBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  planPrice: { color: '#8EA499', fontSize: 14, fontWeight: '600' },
  upgradeBtn: {
    backgroundColor: CORAL,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  upgradeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  logoutBtn: {
    alignSelf: 'center',
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: { color: '#DC2626', fontSize: 15, fontWeight: '700' },
  countryPicker: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SLATE_200,
    overflow: 'hidden',
  },
  countryPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_200,
  },
  countryPickerTitle: { fontSize: 14, fontWeight: '700', color: SLATE_700 },
  countryPickerClose: { fontSize: 16, color: SLATE_400 },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_100,
  },
  countryOptionActive: { backgroundColor: '#EFF6FF' },
  countryOptionText: { fontSize: 14, color: SLATE_700, fontWeight: '500' },
  countryOptionTextActive: { fontWeight: '700', color: '#2563EB' },
  checkMark: { fontSize: 16, color: '#2563EB', fontWeight: '700' },
});
