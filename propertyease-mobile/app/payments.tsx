/**
 * PaymentsScreen — PropertyEase mobile payment tracker.
 *
 * Fetches payments from GET /api/payments using the stored auth token.
 * Groups by status (all / received / overdue / pending).
 * Each card shows tenant name, amount, date, status badge.
 * Shows total collected this month at top. Includes FAB to create payments.
 */
import { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getToken } from '../lib/session';
import {
  PRIMARY, CORAL, WORKSPACE_BG, SLATE_500, SLATE_700, SLATE_200, SLATE_400,
  EMERALD_500, AMBER_500, RED_500,
} from './colors';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface Payment {
  id: string;
  amount: number;
  payment_date: string | null;
  due_date: string;
  status: 'pending' | 'received' | 'overdue' | 'bounced' | 'cancelled';
  payment_type: string;
  notes?: string | null;
  tenant?: { name: string; id: string };
  lease?: { monthly_rent: number };
}

type FilterTab = 'all' | 'received' | 'overdue' | 'pending';

export default function PaymentsScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState('');

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/api/payments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.ok && Array.isArray(json.data)) setPayments(json.data);
      } catch { /* fallback */ }
      finally { setLoading(false); }
    })();
  }, []);

  const now = new Date();
  const thisMonth = payments.filter(p => {
    if (!p.payment_date || p.status !== 'received') return false;
    const d = new Date(p.payment_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthTotal = thisMonth.reduce((sum, p) => sum + p.amount, 0);

  const filtered = filter === 'all'
    ? payments
    : filter === 'received'
      ? payments.filter(p => p.status === 'received')
      : filter === 'overdue'
        ? payments.filter(p => p.status === 'overdue')
        : payments.filter(p => p.status === 'pending');

  const fmtCurrency = (n: number) => `QAR ${n.toLocaleString()}`;

  const submitPayment = async () => {
    const token = await getToken();
    if (!token) return;
    if (!formName.trim() || !formAmount.trim()) {
      Alert.alert('Error', 'Please fill in tenant name and amount');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          tenant_id: 'demo',
          amount: Number(formAmount),
          payment_date: formDate || new Date().toISOString().slice(0, 10),
          payment_type: 'rent',
          status: 'pending',
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setPayments(prev => [json.data!, ...prev]);
        setShowCreate(false);
        setFormName(''); setFormAmount(''); setFormDate('');
        Alert.alert('Success', 'Payment recorded');
      } else {
        Alert.alert('Error', json.error?.message || 'Failed to save');
      }
    } catch { Alert.alert('Error', 'Network error'); }
  };

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'received', label: 'Received' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'pending', label: 'Pending' },
  ];

  const statusColor = (status: string) => {
    if (status === 'received') return EMERALD_500;
    if (status === 'overdue') return RED_500;
    if (status === 'pending') return AMBER_500;
    return SLATE_400;
  };
  const statusBg = (status: string) => {
    if (status === 'received') return '#ECFDF5';
    if (status === 'overdue') return '#FFF1F2';
    if (status === 'pending') return '#FFFBEB';
    return '#F8FAFC';
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
        <Text style={styles.title}>Payments</Text>
        <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Month total banner */}
      <View style={styles.monthBanner}>
        <View>
          <Text style={styles.monthLabel}>Collected This Month</Text>
          <Text style={styles.monthValue}>{fmtCurrency(monthTotal)}</Text>
        </View>
        <View style={styles.monthStats}>
          <View style={styles.monthStat}>
            <Text style={[styles.monthStatNum, { color: EMERALD_500 }]}>{thisMonth.length}</Text>
            <Text style={styles.monthStatLbl}>Received</Text>
          </View>
          <View style={styles.monthDivider} />
          <View style={styles.monthStat}>
            <Text style={[styles.monthStatNum, { color: AMBER_500 }]}>
              {payments.filter(p => p.status === 'pending').length}
            </Text>
            <Text style={styles.monthStatLbl}>Pending</Text>
          </View>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.tabRow}>
        {filterTabs.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, filter === t.key && styles.tabActive]}
            onPress={() => setFilter(t.key)}
          >
            <Text style={[styles.tabText, filter === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.emptyCenter}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyTitle}>No payments</Text>
            <Text style={styles.emptySub}>Tap + to record a payment</Text>
          </View>
        ) : filtered.map((p) => (
          <TouchableOpacity key={p.id} style={styles.paymentCard} activeOpacity={0.8}>
            <View style={styles.paymentLeft}>
              <Text style={styles.paymentTenant}>{p.tenant?.name || 'Unknown Tenant'}</Text>
              <Text style={styles.paymentMeta}>
                {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '—'}
                {' · '}
                {p.payment_type}
              </Text>
            </View>
            <View style={styles.paymentRight}>
              <Text style={[styles.paymentAmount, { color: p.status === 'received' ? EMERALD_500 : SLATE_700 }]}>
                {p.status === 'received' ? '+' : ''}{fmtCurrency(p.amount)}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: statusBg(p.status) }]}>
                <Text style={[styles.statusText, { color: statusColor(p.status) }]}>{p.status}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Create payment modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Payment</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Tenant Name</Text>
              <TextInput
                value={formName}
                onChangeText={setFormName}
                placeholder="e.g. Ahmed Hassan"
                placeholderTextColor={SLATE_500}
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Amount (QAR)</Text>
              <TextInput
                value={formAmount}
                onChangeText={setFormAmount}
                placeholder="e.g. 65000"
                placeholderTextColor={SLATE_500}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Date</Text>
              <TextInput
                value={formDate}
                onChangeText={setFormDate}
                placeholder={new Date().toISOString().slice(0, 10)}
                placeholderTextColor={SLATE_500}
                style={styles.input}
              />
            </View>
            <TouchableOpacity style={styles.submitBtn} onPress={submitPayment}>
              <Text style={styles.submitBtnText}>Save Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  title: { fontSize: 24, fontWeight: '800', color: SLATE_700 },
  fab: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: CORAL,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: CORAL, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 24, fontWeight: '300', lineHeight: 1 },
  monthBanner: {
    marginHorizontal: 20,
    backgroundColor: PRIMARY,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  monthLabel: { fontSize: 12, color: '#8EA499', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  monthValue: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 2 },
  monthStats: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  monthStat: { flex: 1, alignItems: 'center' },
  monthStatNum: { fontSize: 18, fontWeight: '800' },
  monthStatLbl: { fontSize: 11, color: '#8EA499', fontWeight: '600', marginTop: 2 },
  monthDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: SLATE_200,
    marginBottom: 16,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: PRIMARY },
  tabText: { fontSize: 12, fontWeight: '600', color: SLATE_500 },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: SLATE_200,
  },
  paymentLeft: { flex: 1 },
  paymentTenant: { fontSize: 15, fontWeight: '700', color: SLATE_700 },
  paymentMeta: { fontSize: 12, color: SLATE_500, fontWeight: '500', marginTop: 2 },
  paymentRight: { alignItems: 'flex-end' },
  paymentAmount: { fontSize: 15, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  emptyCenter: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: SLATE_700, marginBottom: 6 },
  emptySub: { fontSize: 13, color: SLATE_400, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: SLATE_700 },
  modalClose: { fontSize: 18, color: SLATE_400, fontWeight: '600' },
  field: { marginTop: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: SLATE_700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: WORKSPACE_BG,
    borderWidth: 1,
    borderColor: SLATE_200,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: SLATE_700,
  },
  submitBtn: {
    backgroundColor: CORAL,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
