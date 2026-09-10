/**
 * MaintenanceScreen — PropertyEase mobile maintenance ticket tracker.
 *
 * Fetches tickets from GET /api/maintenance using the stored auth token.
 * Groups by status (open / in-progress / completed).
 * Each card shows title, unit reference, priority badge, status badge, date opened.
 * Tap a ticket to see details. FAB to create a new ticket.
 *
 * Cache invalidation: pull-to-refresh + foreground refetch via useFocusEffect.
 */
import { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { getToken } from '../lib/session';
import { t } from '../lib/i18n';
import { getCached, refreshCache } from '../lib/cache';
import {
  PRIMARY, CORAL, WORKSPACE_BG, SLATE_500, SLATE_600, SLATE_700, SLATE_200, SLATE_400,
  EMERALD_500, AMBER_500, RED_500, BLUE_500,
} from './colors';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_parts' | 'completed' | 'cancelled';
  unit_id: string;
  tenant_id: string;
  created_at: string;
  unit?: { unit_number: string; property?: { name: string } };
  tenant?: { name: string };
}

type FilterTab = 'all' | 'open' | 'in_progress' | 'completed';

export default function MaintenanceScreen() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [formDesc, setFormDesc] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [trigger, setTrigger] = useState(0);

  // Clear cache on foreground — protects against stale data while navigating tabs.
  useFocusEffect(() => refreshCache());

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const json = await getCached(`${API_BASE}/api/maintenance`, { token }) as { ok: boolean; data?: Ticket[] };
        if (json.ok && Array.isArray(json.data)) setTickets(json.data);
      } catch { /* fallback */ }
      finally { setLoading(false); setRefreshing(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const filtered = filter === 'all'
    ? tickets
    : tickets.filter(ticket => ticket.status === filter);

  const priorityColor = (p: string) => {
    if (p === 'urgent') return RED_500;
    if (p === 'high') return '#F97316';
    if (p === 'medium') return BLUE_500;
    return SLATE_400;
  };
  const priorityBg = (p: string) => {
    if (p === 'urgent') return '#FFF1F2';
    if (p === 'high') return '#FFF7ED';
    if (p === 'medium') return '#EFF6FF';
    return '#F8FAFC';
  };
  const statusColor = (s: string) => {
    if (s === 'completed') return EMERALD_500;
    if (s === 'in_progress') return BLUE_500;
    if (s === 'waiting_parts') return AMBER_500;
    return RED_500;
  };
  const statusBg = (s: string) => {
    if (s === 'completed') return '#ECFDF5';
    if (s === 'in_progress') return '#EFF6FF';
    if (s === 'waiting_parts') return '#FFFBEB';
    return '#FFF1F2';
  };

  const unitRef = (ticket: Ticket) => {
    if (ticket.unit?.property?.name && ticket.unit.unit_number)
      return `${ticket.unit.property.name} · ${t('maintenance.unitLabel')} ${ticket.unit.unit_number}`;
    return `#${ticket.unit_id.slice(-4)}`;
  };

  const urgentCount = tickets.filter(ticket => ticket.priority === 'urgent' && ticket.status !== 'completed').length;

  const submitTicket = async () => {
    const token = await getToken();
    if (!token) return;
    if (!formTitle.trim()) {
      Alert.alert(t('common.error'), t('maintenance.alertFillTitle'));
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDesc.trim(),
          priority: formPriority,
          unit_id: 'demo-unit',
          tenant_id: 'demo-tenant',
          status: 'open',
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setTickets(prev => [json.data!, ...prev]);
        setShowCreate(false);
        setFormTitle(''); setFormDesc(''); setFormPriority('medium');
      } else {
        Alert.alert(t('common.error'), json.error?.message || t('maintenance.errorGeneric'));
      }
    } catch { Alert.alert(t('common.error'), t('common.networkError')); }
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
        <Text style={styles.title}>{t('maintenance.title')}</Text>
        <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Urgent banner */}
      {urgentCount > 0 && (
        <View style={styles.urgentBanner}>
          <Text style={styles.urgentText}>⚠ {urgentCount} {t('maintenance.urgentAttention', { count: urgentCount > 1 ? 's' : '' })}</Text>
        </View>
      )}

      {/* Filter tabs */}
      <View style={styles.tabRow}>
        {([
          { key: 'all', label: t('maintenance.tabAll') },
          { key: 'open', label: t('maintenance.tabOpen') },
          { key: 'in_progress', label: t('maintenance.tabInProgress') },
          { key: 'completed', label: t('maintenance.tabCompleted') },
        ] as { key: FilterTab; label: string }[]).map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, filter === tab.key && styles.tabActive]}
            onPress={() => setFilter(tab.key)}
          >
            <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
            onRefresh={() => {
              refreshCache();
              setRefreshing(true);
              setTrigger(t => t + 1);
            }}
          />
        }
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyCenter}>
            <Text style={styles.emptyIcon}>🔧</Text>
            <Text style={styles.emptyTitle}>{t('maintenance.noTickets')}</Text>
            <Text style={styles.emptySub}>{t('maintenance.noTicketsSub')}</Text>
          </View>
        ) : filtered.map((ticket) => (
          <TouchableOpacity
            key={ticket.id}
            style={styles.ticketCard}
            activeOpacity={0.8}
            onPress={() => setDetailTicket(ticket)}
          >
            <View style={styles.ticketTop}>
              <Text style={styles.ticketTitle}>{ticket.title}</Text>
              <View style={[styles.priorityBadge, { backgroundColor: priorityBg(ticket.priority) }]}>
                <Text style={[styles.priorityText, { color: priorityColor(ticket.priority) }]}>{t(`maintenance.priority${ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}`)}</Text>
              </View>
            </View>
            <View style={styles.ticketMeta}>
              <Text style={styles.ticketUnit}>{unitRef(ticket)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusBg(ticket.status) }]}>
                <Text style={[styles.statusText, { color: statusColor(ticket.status) }]}>{t(`maintenance.status${ticket.status.replace(/_/g, '').replace(/^(.)/, c => c.toUpperCase())}`)}</Text>
              </View>
            </View>
            <Text style={styles.ticketDate}>
              {new Date(ticket.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Create ticket modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('maintenance.newTicket')}</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('maintenance.formTitle')}</Text>
              <TextInput
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder={t('maintenance.placeholderTicketTitle')}
                placeholderTextColor={SLATE_500}
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('maintenance.formDescription')}</Text>
              <TextInput
                value={formDesc}
                onChangeText={setFormDesc}
                placeholder={t('maintenance.placeholderTicketDesc')}
                placeholderTextColor={SLATE_500}
                multiline
                numberOfLines={3}
                style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('maintenance.formPriority')}</Text>
              <View style={styles.priorityRow}>
                {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.priorityOption, formPriority === p && { borderColor: priorityColor(p), backgroundColor: priorityBg(p) }]}
                    onPress={() => setFormPriority(p)}
                  >
                    <Text style={[styles.priorityOptionText, formPriority === p && { color: priorityColor(p) }]}>{t(`maintenance.priority${p.charAt(0).toUpperCase() + p.slice(1)}`)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity style={styles.submitBtn} onPress={submitTicket}>
              <Text style={styles.submitBtnText}>{t('maintenance.submitBtn')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Detail modal */}
      <Modal visible={!!detailTicket} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('maintenance.ticketDetails')}</Text>
              <TouchableOpacity onPress={() => setDetailTicket(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {detailTicket && (
              <>
                <Text style={styles.detailTitle}>{detailTicket.title}</Text>
                <View style={styles.detailMeta}>
                  <View style={[styles.detailChip, { backgroundColor: priorityBg(detailTicket.priority) }]}>
                    <Text style={[styles.detailChipText, { color: priorityColor(detailTicket.priority) }]}>{t(`maintenance.priority${detailTicket.priority.charAt(0).toUpperCase() + detailTicket.priority.slice(1)}`)}</Text>
                  </View>
                  <View style={[styles.detailChip, { backgroundColor: statusBg(detailTicket.status) }]}>
                    <Text style={[styles.detailChipText, { color: statusColor(detailTicket.status) }]}>{t(`maintenance.status${detailTicket.status.replace(/_/g, '').replace(/^(.)/, c => c.toUpperCase())}`)}</Text>
                  </View>
                  <Text style={styles.detailDate}>
                    {new Date(detailTicket.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.detailSectionLabel}>{t('maintenance.unitLabel')}</Text>
                <Text style={styles.detailValue}>{unitRef(detailTicket)}</Text>
                {detailTicket.tenant?.name && (
                  <>
                    <Text style={styles.detailSectionLabel}>{t('maintenance.tenantLabel')}</Text>
                    <Text style={styles.detailValue}>{detailTicket.tenant.name}</Text>
                  </>
                )}
                <Text style={styles.detailSectionLabel}>{t('maintenance.descriptionLabel')}</Text>
                <Text style={styles.detailDesc}>{detailTicket.description || t('maintenance.noDescription')}</Text>
              </>
            )}
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
  urgentBanner: {
    marginHorizontal: 20,
    backgroundColor: '#FFF1F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  urgentText: { fontSize: 13, color: RED_500, fontWeight: '700' },
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
  ticketCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: SLATE_200,
  },
  ticketTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 },
  ticketTitle: { fontSize: 15, fontWeight: '700', color: SLATE_700, flex: 1, marginRight: 8 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityText: { fontSize: 10, fontWeight: '700', textTransform: 'lowercase' },
  ticketMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ticketUnit: { fontSize: 12, color: SLATE_500, fontWeight: '500' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  ticketDate: { fontSize: 11, color: SLATE_400, fontWeight: '500', marginTop: 6 },
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
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: SLATE_200,
    backgroundColor: '#fff',
  },
  priorityOptionText: { fontSize: 12, fontWeight: '700', color: SLATE_500, textTransform: 'lowercase' },
  submitBtn: {
    backgroundColor: CORAL,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  detailTitle: { fontSize: 18, fontWeight: '800', color: SLATE_700, marginBottom: 12 },
  detailMeta: { flexDirection: 'row', gap: 8, marginBottom: 16, alignItems: 'center' },
  detailChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  detailChipText: { fontSize: 11, fontWeight: '700', textTransform: 'lowercase' },
  detailDate: { fontSize: 12, color: SLATE_400, fontWeight: '600' },
  detailSectionLabel: { fontSize: 11, fontWeight: '700', color: SLATE_500, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 4 },
  detailValue: { fontSize: 14, color: SLATE_700, fontWeight: '500' },
  detailDesc: { fontSize: 14, color: SLATE_600, lineHeight: 22 },
});
