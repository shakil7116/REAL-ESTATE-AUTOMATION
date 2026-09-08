/**
 * PropertiesScreen — PropertyEase mobile properties list.
 *
 * Fetches real properties from GET /api/properties using the stored auth token.
 * Displays property cards with name, address, unit count, occupancy rate, and image.
 * Shows an empty state with CTA when no properties exist.
 */
import { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getToken } from '../lib/session';
import { t } from '../lib/i18n';
import {
  PRIMARY, CORAL, WORKSPACE_BG, SLATE_500, SLATE_700, SLATE_200, SLATE_300, EMERALD_500,
} from './colors';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  property_type: 'residential' | 'commercial' | 'mixed';
  total_units: number;
  images?: string[];
  status: string;
}

export default function PropertiesScreen() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/api/properties`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.ok && Array.isArray(json.data)) setProperties(json.data);
      } catch { /* fallback — show empty */ }
      finally { setLoading(false); }
    })();
  }, []);

  const activeCount = properties.filter(p => p.status === 'active').length;
  const totalUnits = properties.reduce((sum, p) => sum + (p.total_units ?? 0), 0);

  const typeBadgeStyle = (type: string) => {
    if (type === 'residential') return { bg: '#ECFDF5', text: '#059669', label: t('properties.residential') };
    if (type === 'commercial')   return { bg: '#EFF6FF', text: '#2563EB', label: t('properties.commercial') };
    return                          { bg: '#FEF3C7', text: '#D97706', label: t('properties.mixedUse') };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.center}><ActivityIndicator size="large" color={PRIMARY} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>{t('properties.title')}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => {}}>
          <Text style={styles.addButtonText}>+ {t('common.add')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {properties.length === 0 ? (
          /* Empty state */
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏢</Text>
            <Text style={styles.emptyTitle}>{t('properties.noResults')}</Text>
            <Text style={styles.emptySub}>{t('properties.addFirst')}</Text>
            <TouchableOpacity style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>{t('properties.addFirst')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Summary chips */}
            <View style={styles.summaryRow}>
              {[
                { label: t('properties.total'), value: String(properties.length), color: PRIMARY },
                { label: t('properties.active'), value: String(activeCount), color: EMERALD_500 },
                { label: t('properties.units'), value: String(totalUnits), color: CORAL },
              ].map((chip, i) => (
                <View key={i} style={[styles.chip, { borderLeftColor: chip.color, borderRightColor: chip.color }]}>
                  <Text style={[styles.chipValue, { color: chip.color }]}>{chip.value}</Text>
                  <Text style={styles.chipLabel}>{chip.label}</Text>
                </View>
              ))}
            </View>

            {/* Property cards */}
            {properties.map((p) => {
              const badge = typeBadgeStyle(p.property_type);
              return (
                <TouchableOpacity key={p.id} style={styles.propCard} activeOpacity={0.85}>
                  {/* Property image */}
                  {p.images && p.images.length > 0 && p.images[0] ? (
                    <Image
                      source={{ uri: p.images[0] }}
                      style={styles.propImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.propImagePlaceholder}>
                      <Text style={styles.propImagePlaceholderText}>
                        {p.name.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.propBody}>
                    <View style={styles.propTop}>
                      <View style={[styles.propTypeBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.propTypeText, { color: badge.text }]}>{badge.label}</Text>
                      </View>
                      <View style={[styles.statusDot, { backgroundColor: p.status === 'active' ? EMERALD_500 : '#CBD5E1' }]} />
                    </View>
                    <Text style={styles.propName}>{p.name}</Text>
                    <Text style={styles.propAddress}>{p.address}{p.city ? `, ${p.city}` : ''}</Text>
                    <View style={styles.propMeta}>
                      <Text style={styles.propMetaText}>{p.total_units} units</Text>
                      <Text style={styles.propMetaSep}>·</Text>
                      <Text style={styles.propMetaText}>{p.status}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WORKSPACE_BG },
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: WORKSPACE_BG,
  },
  pageTitle: { fontSize: 24, fontWeight: '800', color: SLATE_700 },
  addButton: {
    backgroundColor: CORAL,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderColor: SLATE_200,
  },
  chipValue: { fontSize: 18, fontWeight: '800', minWidth: 32 },
  chipLabel: { fontSize: 11, color: SLATE_500, fontWeight: '600', marginLeft: 6 },
  propCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: SLATE_200,
  },
  propImage: { width: '100%', height: 120 },
  propImagePlaceholder: {
    width: '100%', height: 80, backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center',
  },
  propImagePlaceholderText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  propBody: { padding: 14 },
  propTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  propTypeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  propTypeText: { fontSize: 11, fontWeight: '700' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  propName: { fontSize: 17, fontWeight: '800', color: SLATE_700, marginBottom: 4 },
  propAddress: { fontSize: 13, color: SLATE_500, fontWeight: '500', marginBottom: 8 },
  propMeta: { flexDirection: 'row', alignItems: 'center' },
  propMetaText: { fontSize: 12, color: SLATE_500, fontWeight: '600' },
  propMetaSep: { fontSize: 12, color: SLATE_300, marginHorizontal: 6 },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: SLATE_700, marginBottom: 8 },
  emptySub: { fontSize: 14, color: SLATE_500, textAlign: 'center', marginBottom: 24 },
  emptyBtn: {
    backgroundColor: CORAL,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
