/**
 * PaymentsScreen — PropertyEase mobile payments list.
 *
 * Renders immediately (empty list) and populates via GET /api/payments.
 * Shows payment cards with status badges (paid / pending / overdue).
 *
 * Cache TTL: 3 min. Pull-to-refresh clears cache; useFocusEffect refreshes on tab focus.
 */
import { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { getToken } from '../lib/session';
import { t } from '../lib/i18n';
import { getCached, refreshCache } from '../lib/cache';
import {
  PRIMARY, CORAL, WORKSPACE_BG, SLATE_500, SLATE_700, SLATE_200, SLATE_400, EMERALD_500, AMBER_500,
} from './colors';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface Payment {
  id: string;
  amount: number;
  method?: string | null;
  reference_no?: string | null;
  notes?: string | null;
  paid_at: string;
  created_at: string;
  lease_id?: string | null;
  tenant_name?: string;
  unit_number?: string;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
}

export default function PaymentsScreen() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  // Show spinner only during pull-to-refresh — never on initial load.
  const [refreshing, setRefreshing] = useState(false);
  const [trigger, setTrigger] = useState(0);

  useFocusEffect(() => refreshCache());

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const json = await getCached(`${API_BASE}/api/payments`, { token }) as { ok: boolean; data?: Payment[] };
        if (json.ok && Array.isArray(json.data)) setPayments(json.data);
      } catch { /* show empty — don't block UI */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const totalCollected = payments
    .filter(p => p.status === 'paid')
    .reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalOverdue = payments
    .filter(p => p.status === 'overdue')
    .reduce((s, p) => s + (p.amount ?? 0), 0);

  const fmtCurrency = (n: number) => `QAR ${n.toLocaleString()}`;

  const statusColor = (status: string) => {
    if (status === 'paid') return '#059669';
    if (status === 'pending') return '#D97706';
    if (status === 'overdue') return '#DC2626';
    return '#6B7280';
  };

  const statusLabel = (status: string) => {
    if (status === 'paid') return t('payments.paid');
    if (status === 'pending') return t('payments.pending');
    if (status === 'overdue') return t('payments.overdue');
    if (status === 'partial') return t('payments.partial');
    return status;
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('payments.title')}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              refreshCache();
              setRefreshing(true);
              setTrigger(prev => prev + 1);
            }}
          />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          {[
            { label: t('payments.collected'), value: totalCollected, color: EMERALD_500, bg: '#ECFDF5' },
            { label: t('payments.pending'), value: totalPending, color: AMBER_500, bg: '#FEF3C7' },
            { label: t('payments.overdue'), value: totalOverdue, color: '#DC2626', bg: '#FEF2F2' },
          ].map((card, i) => (
            <View key={i} style={[styles.summaryCard, { backgroundColor: card.bg }]}>
              <Text style={[styles.summaryValue, { color: card.color }]}>{fmtCurrency(card.value)}</Text>
              <Text style={styles.summaryLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        {/* Payment List */}
        {payments.length === 0 ? (
          <View style={styles.emptyCenter}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyTitle}>{t('payments.noResults')}</Text>
            <Text style={styles.emptySub}>{t('payments.noResultsSub')}</Text>
          </View>
        ) : (
          payments.slice(0, 20).map((pay) => (
            <View key={pay.id} style={styles.paymentCard}>
              <View style={styles.paymentLeft}>
                <View style={[styles.paymentStatusDot, { backgroundColor: statusColor(pay.status) }]} />
                <View>
                  <Text style={styles.paymentAmount}>{fmtCurrency(pay.amount)}</Text>
                  <Text style={styles.paymentMeta}>
                    {pay.tenant_name || t('payments.unknownTenant')}
                    {pay.unit_number ? ` · ${pay.unit_number}` : ''}
                  </Text>
                  <Text style={styles.paymentDate}>
                    {new Date(pay.created_at).toLocaleDateString(undefined, {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
              <View style={styles.paymentRight}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(pay.status) + '15' }]}>
                  <Text style={[styles.statusText, { color: statusColor(pay.status) }]}>
                    {statusLabel(pay.status)}
                  </Text>
                </View>
                {pay.reference_no && (
                  <Text style={styles.paymentRef}>{pay.reference_no}</Text>
                )}
              </View>
            </View>
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WORKSPACE_BG },
  scroll: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: WORKSPACE_BG,
  },
  title: { fontSize: 24, fontWeight: '800', color: SLATE_700 },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  summaryValue: { fontSize: 15, fontWeight: '800' },
  summaryLabel: { fontSize: 10, color: SLATE_500, fontWeight: '600', marginTop: 4 },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: SLATE_200,
  },
  paymentLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  paymentStatusDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  paymentAmount: { fontSize: 16, fontWeight: '800', color: SLATE_700 },
  paymentMeta: { fontSize: 12, color: SLATE_500, fontWeight: '500', marginTop: 2 },
  paymentDate: { fontSize: 11, color: SLATE_400, fontWeight: '600', marginTop: 2 },
  paymentRight: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },
  paymentRef: { fontSize: 10, color: SLATE_400, marginTop: 4 },
  emptyCenter: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: SLATE_700, marginBottom: 6 },
  emptySub: { fontSize: 13, color: SLATE_400, textAlign: 'center' },
});
