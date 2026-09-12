/**
 * TenantsScreen — PropertyEase mobile tenants & leads list.
 *
 * Fetches tenants from GET /api/tenants and leads from GET /api/leads.
 * Renders immediately (empty tabs) and populates asynchronously.
 *
 * Cache invalidation: pull-to-refresh clears cache; useFocusEffect runs on tab focus.
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
  PRIMARY, CORAL, WORKSPACE_BG, SLATE_500, SLATE_700, SLATE_200, SLATE_400, EMERALD_500,
} from './colors';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface Tenant {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  company?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  budget?: number | null;
  status: 'new' | 'contacted' | 'interested' | 'visited' | 'negotiating' | 'converted' | 'lost';
  property_interest?: string | null;
  created_at: string;
}

// Map lease-based tenant data: find the most recent lease for each tenant to get unit + rent
function enrichTenants(
  tenants: Tenant[],
  leases: any[],
  units: any[],
): Array<Tenant & { unitRef?: string; rent?: number; status?: string }> {
  const unitMap = new Map(units.map((u: any) => [u.id, u]));
  const leaseByTenant = new Map<string, any>();
  for (const lease of leases) {
    const existing = leaseByTenant.get(lease.tenant_id);
    if (!existing || lease.created_at > existing.created_at) {
      leaseByTenant.set(lease.tenant_id, lease);
    }
  }
  return tenants.map(t => {
    const lease = leaseByTenant.get(t.id);
    const unit = lease ? unitMap.get(lease.unit_id) : null;
    return {
      ...t,
      unitRef: unit ? `${unit.unit_number}` : undefined,
      rent: lease?.monthly_rent,
      status: lease?.status,
    };
  });
}

function sourceLabel(source: string): string {
  const map: Record<string, string> = {
    direct: 'direct',
    phone_call: 'phone',
    whatsapp: 'whatsapp',
    meta_ads: 'metaAds',
    google_ads: 'googleAds',
    bayut: 'bayut',
    property_finder: 'propertyFinder',
    referral: 'referral',
    other: 'other',
  };
  const key = map[source];
  return key ? t(`tenants.source${key.charAt(0).toUpperCase() + key.slice(1)}`) : source;
}

function statusColor(status?: string): string {
  if (status === 'active') return '#059669';
  if (status === 'expired') return '#DC2626';
  if (status === 'pending_renewal') return '#D97706';
  return '#64748B';
}

export default function TenantsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'tenants' | 'leads'>('tenants');
  const [tenants, setTenants] = useState<Array<Tenant & { unitRef?: string; rent?: number; status?: string }>>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  // Show spinner only during pull-to-refresh — never on initial load.
  const [refreshing, setRefreshing] = useState(false);
  const [trigger, setTrigger] = useState(0);

  useFocusEffect(() => refreshCache());

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const [tJson, lJson, uJson, lsJson] = await Promise.all([
          getCached(`${API_BASE}/api/tenants`, { token }) as Promise<{ ok: boolean; data?: Tenant[] }>,
          getCached(`${API_BASE}/api/leads`, { token }) as Promise<{ ok: boolean; data?: Lead[] }>,
          getCached(`${API_BASE}/api/units`, { token }) as Promise<{ ok: boolean; data?: any[] }>,
          getCached(`${API_BASE}/api/leases`, { token }) as Promise<{ ok: boolean; data?: any[] }>,
        ]);
        if (tJson.ok) {
          const enriched = enrichTenants(tJson.data || [], lsJson.data || [], uJson.data || []);
          setTenants(enriched);
        }
        if (lJson.ok && Array.isArray(lJson.data)) setLeads(lJson.data);
      } catch { /* show empty — don't block UI */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('tenants.title')}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => {}}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'tenants' && styles.tabBtnActive]}
          onPress={() => setTab('tenants')}
        >
          <Text style={[styles.tabText, tab === 'tenants' && styles.tabTextActive]}>
            {t('tenants.title')} ({tenants.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'leads' && styles.tabBtnActive]}
          onPress={() => setTab('leads')}
        >
          <Text style={[styles.tabText, tab === 'leads' && styles.tabTextActive]}>
            {t('tenants.leads')} ({leads.length})
          </Text>
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
        {tab === 'tenants' ? (
          tenants.length === 0 ? (
            <View style={styles.emptyCenter}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>{t('tenants.noTenants')}</Text>
              <Text style={styles.emptySub}>{t('tenants.noTenantsSub')}</Text>
            </View>
          ) : tenants.map((tenant, i) => (
            <TouchableOpacity key={tenant.id || i} style={styles.tenantCard} activeOpacity={0.8}>
              <View style={styles.tenantAvatar}>
                <Text style={styles.tenantAvatarText}>{getInitials(tenant.name)}</Text>
              </View>
              <View style={styles.tenantInfo}>
                <Text style={styles.tenantName}>{tenant.name}</Text>
                <Text style={styles.tenantUnit}>
                  {tenant.unitRef ? `${t('tenants.unitLabel')} ${tenant.unitRef}` : t('tenants.noUnit')}
                  {tenant.rent ? ` · QAR ${tenant.rent.toLocaleString()}${t('tenants.perYear')}` : ''}
                </Text>
              </View>
              <View style={styles.tenantRight}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(tenant.status) + '15' }]}>
                  <Text style={[styles.statusText, { color: statusColor(tenant.status) }]}>
                    {tenant.status ? t(`tenants.status${tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}`) : t('tenants.active')}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          leads.length === 0 ? (
            <View style={styles.emptyCenter}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyTitle}>{t('tenants.noLeads')}</Text>
              <Text style={styles.emptySub}>{t('tenants.noLeadsSub')}</Text>
            </View>
          ) : leads.map((lead, i) => (
            <View key={lead.id || i} style={styles.leadCard}>
              <View style={styles.leadAvatar}>
                <Text style={styles.leadAvatarText}>{getInitials(lead.name)}</Text>
              </View>
              <View style={styles.leadInfo}>
                <Text style={styles.leadName}>{lead.name}</Text>
                <Text style={styles.leadSource}>
                  {sourceLabel(lead.source)}
                  {lead.property_interest ? ` · ${lead.property_interest}` : ''}
                  {lead.budget ? ` · QAR ${lead.budget.toLocaleString()}` : ''}
                </Text>
              </View>
              <View style={[styles.leadStatus, { backgroundColor: '#EFF6FF' }]}>
                <Text style={styles.leadStatusText}>{t(`tenants.leadStatus${lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}`)}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: WORKSPACE_BG,
  },
  title: { fontSize: 24, fontWeight: '800', color: SLATE_700 },
  addBtn: {
    backgroundColor: CORAL,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  tabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: SLATE_200,
    marginBottom: 16,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: PRIMARY },
  tabText: { fontSize: 13, fontWeight: '600', color: SLATE_500 },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  tenantCard: {
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
  tenantAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  tenantAvatarText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  tenantInfo: { flex: 1 },
  tenantName: { fontSize: 15, fontWeight: '700', color: SLATE_700 },
  tenantUnit: { fontSize: 12, color: SLATE_500, fontWeight: '500', marginTop: 2 },
  tenantRight: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },
  leadCard: {
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
  leadAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: CORAL,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  leadAvatarText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  leadInfo: { flex: 1 },
  leadName: { fontSize: 15, fontWeight: '700', color: SLATE_700 },
  leadSource: { fontSize: 12, color: SLATE_500, fontWeight: '500', marginTop: 2 },
  leadStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  leadStatusText: { fontSize: 10, fontWeight: '700', color: '#2563EB' },
  emptyCenter: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: SLATE_700, marginBottom: 6 },
  emptySub: { fontSize: 13, color: SLATE_400, textAlign: 'center' },
});
