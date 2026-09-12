/**
 * MaintenanceScreen — PropertyEase mobile maintenance tickets list.
 *
 * Renders immediately (empty list) and populates via GET /api/maintenance.
 * Shows ticket cards with priority/urgency badges and status.
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

interface MaintenanceTicket {
  id: string;
  title: string;
  description?: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  property_id?: string | null;
  property_name?: string;
  unit_id?: string | null;
  unit_number?: string;
  tenant_name?: string;
  requestor_name?: string;
}

function urgencyColor(priority: string): string {
  if (priority === 'urgent') return '#DC2626';
  if (priority === 'high') return '#D97706';
  if (priority === 'medium') return '#2563EB';
  return '#64748B';
}

function urgencyLabel(priority: string): string {
  if (priority === 'urgent') return t('maintenance.urgent');
  if (priority === 'high') return t('maintenance.high');
  if (priority === 'medium') return t('maintenance.medium');
  return t('maintenance.low');
}

function statusColor(status: string): string {
  if (status === 'open') return '#DC2626';
  if (status === 'in_progress') return '#2563EB';
  if (status === 'completed') return '#059669';
  if (status === 'cancelled') return '#94A3B8';
  return '#64748B';
}

function statusLabel(status: string): string {
  if (status === 'open') return t('maintenance.open');
  if (status === 'in_progress') return t('maintenance.inProgress');
  if (status === 'completed') return t('maintenance.completed');
  if (status === 'cancelled') return t('maintenance.cancelled');
  return status;
}

export default function MaintenanceScreen() {
  const router = useRouter();
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  // Show spinner only during pull-to-refresh — never on initial load.
  const [refreshing, setRefreshing] = useState(false);
  const [trigger, setTrigger] = useState(0);

  useFocusEffect(() => refreshCache());

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const json = await getCached(`${API_BASE}/api/maintenance`, { token }) as { ok: boolean; data?: MaintenanceTicket[] };
        if (json.ok && Array.isArray(json.data)) setTickets(json.data);
      } catch { /* show empty — don't block UI */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const openCount = tickets.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length;
  const urgentCount = tickets.filter(t => t.priority === 'urgent' && t.status !== 'completed' && t.status !== 'cancelled').length;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('maintenance.title')}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => {}}>
          <Text style={styles.addButtonText}>+ {t('common.newTicket')}</Text>
        </TouchableOpacity>
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
        {/* Summary chips */}
        {tickets.length > 0 && (
          <View style={styles.summaryRow}>
            <View style={[styles.chip, { borderLeftColor: '#DC2626', borderRightColor: '#DC2626' }]}>
              <Text style={styles.chipValue}>{openCount}</Text>
              <Text style={styles.chipLabel}>{t('maintenance.openTickets')}</Text>
            </View>
            {urgentCount > 0 && (
              <View style={[styles.chip, { borderLeftColor: '#DC2626', borderRightColor: '#DC2626' }]}>
                <Text style={styles.chipValue}>{urgentCount}</Text>
                <Text style={styles.chipLabel}>{t('maintenance.urgent')}</Text>
              </View>
            )}
          </View>
        )}

        {tickets.length === 0 ? (
          <View style={styles.emptyCenter}>
            <Text style={styles.emptyIcon}>🔧</Text>
            <Text style={styles.emptyTitle}>{t('maintenance.noTickets')}</Text>
            <Text style={styles.emptySub}>{t('maintenance.noTicketsSub')}</Text>
          </View>
        ) : (
          tickets.map((ticket) => (
            <TouchableOpacity
              key={ticket.id}
              style={styles.ticketCard}
              activeOpacity={0.85}
              onPress={() => router.push(`/maintenance/${ticket.id}`)}
            >
              <View style={styles.ticketTop}>
                <View style={[styles.priorityBar, { backgroundColor: urgencyColor(ticket.priority) }]} />
                <View style={styles.ticketBody}>
                  <Text style={styles.ticketTitle}>{ticket.title}</Text>
                  {ticket.description ? (
                    <Text style={styles.ticketDesc} numberOfLines={2}>{ticket.description}</Text>
                  ) : null}
                  <Text style={styles.ticketMeta}>
                    {ticket.property_name && `${ticket.property_name}`}
                    {ticket.unit_number ? ` · ${ticket.unit_number}` : ''}
                    {ticket.tenant_name ? ` · ${ticket.tenant_name}` : ''}
                  </Text>
                  <Text style={styles.ticketTime}>
                    {new Date(ticket.created_at).toLocaleDateString(undefined, {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.ticketStatus}>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor(ticket.status) + '15' }]}>
                    <Text style={[styles.statusText, { color: statusColor(ticket.status) }]}>
                      {statusLabel(ticket.status)}
                    </Text>
                  </View>
                  <View style={[styles.priorityBadge, { backgroundColor: urgencyColor(ticket.priority) + '15' }]}>
                    <Text style={[styles.priorityText, { color: urgencyColor(ticket.priority) }]}>
                      {urgencyLabel(ticket.priority)}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: WORKSPACE_BG,
  },
  title: { fontSize: 24, fontWeight: '800', color: SLATE_700 },
  addButton: {
    backgroundColor: CORAL,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
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
  chipValue: { fontSize: 18, fontWeight: '800', color: '#DC2626', minWidth: 28 },
  chipLabel: { fontSize: 11, color: SLATE_500, fontWeight: '600', marginLeft: 6 },
  ticketCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: SLATE_200,
  },
  ticketTop: { flexDirection: 'row' },
  priorityBar: { width: 4, flex: 0 },
  ticketBody: { flex: 1, padding: 14 },
  ticketTitle: { fontSize: 15, fontWeight: '700', color: SLATE_700, marginBottom: 4 },
  ticketDesc: { fontSize: 12, color: SLATE_500, lineHeight: 18, marginBottom: 6 },
  ticketMeta: { fontSize: 11, color: SLATE_400, fontWeight: '600' },
  ticketTime: { fontSize: 10, color: SLATE_400, marginTop: 4, fontWeight: '600' },
  ticketStatus: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    gap: 6,
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 9, fontWeight: '700' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityText: { fontSize: 9, fontWeight: '700' },
  emptyCenter: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: SLATE_700, marginBottom: 6 },
  emptySub: { fontSize: 13, color: SLATE_400, textAlign: 'center' },
});
