/**
 * MaintenanceScreen — PropertyEase mobile maintenance ticket tracker.
 *
 * Fetches tickets from GET /api/maintenance using the stored auth token.
 * Groups by status (open / in-progress / completed).
 * Each card shows title, unit reference, priority badge, status badge, date opened.
 * Tap a ticket to see details. FAB to create a new ticket.
 */
import { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getToken } from '../lib/session';
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
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [formDesc, setFormDesc] = useState('');

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/api/maintenance`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.ok && Array.isArray(json.data)) setTickets(json.data);
      } catch { /* fallback */ }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = filter === 'all'
    ? tickets
    : tickets.filter(t => t.status === filter);

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

  const unitRef = (t: Ticket) => {
    if (t.unit?.property?.name && t.unit.unit_number)
      return `${t.unit.property.name} · Unit ${t.unit.unit_number}`;
    return `#${t.unit_id.slice(-4)}`;
  };

  const urgentCount = tickets.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;

  const submitTicket = async () => {
    const token = await getToken();
    if (!token) return;
    if (!formTitle.trim()) {
      Alert.alert('Error', 'Please enter a title');
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
        Alert.alert('Error', json.error?.message || 'Failed to save ticket');
      }
    } catch { Alert.alert('Error', 'Network error'); }
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
        <Text style={styles.title}>Maintenance</Text>
        <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Urgent banner */}
      {urgentCount > 0 && (
        <View style={styles.urgentBanner}>
          <Text style={styles.urgentText}>⚠ {urgentCount} urgent ticket{urgentCount > 1 ? 's' : ''} need attention</Text>
        </View>
      )}

      {/* Filter tabs */}
      <View style={styles.tabRow}>
        {([
          { key: 'all', label: 'All' },
          { key: 'open', label: 'Open' },
          { key: 'in_progress', label: 'In Progress' },
          { key: 'completed', label: 'Done' },
        ] as { key: FilterTab; label: string }[]).map(t => (
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
            <Text style={styles.emptyIcon}>🔧</Text>
            <Text style={styles.emptyTitle}>No tickets</Text>
            <Text style={styles.emptySub}>Tap + to create a maintenance request</Text>
          </View>
        ) : filtered.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={styles.ticketCard}
            activeOpacity={0.8}
            onPress={() => setDetailTicket(t)}
          >
            <View style={styles.ticketTop}>
              <Text style={styles.ticketTitle}>{t.title}</Text>
              <View style={[styles.priorityBadge, { backgroundColor: priorityBg(t.priority) }]}>
                <Text style={[styles.priorityText, { color: priorityColor(t.priority) }]}>{t.priority}</Text>
              </View>
            </View>
            <View style={styles.ticketMeta}>
              <Text style={styles.ticketUnit}>{unitRef(t)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusBg(t.status) }]}>
                <Text style={[styles.statusText, { color: statusColor(t.status) }]}>{t.status.replace('_', ' ')}</Text>
              </View>
            </View>
            <Text style={styles.ticketDate}>
              {new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
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
              <Text style={styles.modalTitle}>New Ticket</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder="e.g. Elevator repair"
                placeholderTextColor={SLATE_500}
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                value={formDesc}
                onChangeText={setFormDesc}
                placeholder="Describe the issue…"
                placeholderTextColor={SLATE_500}
                multiline
                numberOfLines={3}
                style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Priority</Text>
              <View style={styles.priorityRow}>
                {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.priorityOption, formPriority === p && { borderColor: priorityColor(p), backgroundColor: priorityBg(p) }]}
                    onPress={() => setFormPriority(p)}
                  >
                    <Text style={[styles.priorityOptionText, formPriority === p && { color: priorityColor(p) }]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity style={styles.submitBtn} onPress={submitTicket}>
              <Text style={styles.submitBtnText}>Create Ticket</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Detail modal */}
      <Modal visible={!!detailTicket} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ticket Details</Text>
              <TouchableOpacity onPress={() => setDetailTicket(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {detailTicket && (
              <>
                <Text style={styles.detailTitle}>{detailTicket.title}</Text>
                <View style={styles.detailMeta}>
                  <View style={[styles.detailChip, { backgroundColor: priorityBg(detailTicket.priority) }]}>
                    <Text style={[styles.detailChipText, { color: priorityColor(detailTicket.priority) }]}>{detailTicket.priority}</Text>
                  </View>
                  <View style={[styles.detailChip, { backgroundColor: statusBg(detailTicket.status) }]}>
                    <Text style={[styles.detailChipText, { color: statusColor(detailTicket.status) }]}>{detailTicket.status.replace('_', ' ')}</Text>
                  </View>
                  <Text style={styles.detailDate}>
                    {new Date(detailTicket.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.detailSectionLabel}>Unit</Text>
                <Text style={styles.detailValue}>{unitRef(detailTicket)}</Text>
                {detailTicket.tenant?.name && (
                  <>
                    <Text style={styles.detailSectionLabel}>Tenant</Text>
                    <Text style={styles.detailValue}>{detailTicket.tenant.name}</Text>
                  </>
                )}
                <Text style={styles.detailSectionLabel}>Description</Text>
                <Text style={styles.detailDesc}>{detailTicket.description || 'No description provided.'}</Text>
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
