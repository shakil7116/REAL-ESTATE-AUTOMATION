/**
 * TenantsScreen — PropertyEase mobile tenants & leads list.
 *
 * Fetches tenants from GET /api/tenants and leads from GET /api/leads
 * using the stored auth token. Merges into a tabbed view (Tenants | Leads).
 * Shows tenant name, unit reference, rent amount, status badge.
 * Shows lead name, source, budget, status.
 */
import { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getToken } from '../lib/session';
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
    direct: 'Direct',
    phone_call: 'Phone',
    whatsapp: 'WhatsApp',
    meta_ads: 'Meta Ads',
    google_ads: 'Google Ads',
    bayut: 'Bayut',
    property_finder: 'Property Finder',
    referral: 'Referral',
    other: 'Other',
  };
  return map[source] || source;
}

function statusColor(status?: string): string {
  if (status === 'active') return '#059669';
  if (status === 'expired') return '#DC2626';
  if (status === 'pending_renewal') return '#D97706';
  return '#64748B';
}

export default function TenantsScreen() {
  const [tab, setTab] = useState<'tenants' | 'leads'>('tenants');
  const [tenants, setTenants] = useState<Array<Tenant & { unitRef?: string; rent?: number; status?: string }>>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) { setLoading(false); return; }
      try {
        const [tRes, lRes, uRes, lsRes] = await Promise.all([
          fetch(`${API_BASE}/api/tenants`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/leads`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/units`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/leases`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const tJson = await tRes.json();
        const lJson = await lRes.json();
        const uJson = await uRes.json();
        const lsJson = await lsRes.json();
        if (tJson.ok) {
          const enriched = enrichTenants(tJson.data || [], lsJson.data || [], uJson.data || []);
          setTenants(enriched);
        }
        if (lJson.ok && Array.isArray(lJson.data)) setLeads(lJson.data);
      } catch { /* fallback */ }
      finally { setLoading(false); }
    })();
  }, []);

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

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
        <Text style={styles.title}>Tenants & Leads</Text>
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
            Tenants ({tenants.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'leads' && styles.tabBtnActive]}
          onPress={() => setTab('leads')}
        >
          <Text style={[styles.tabText, tab === 'leads' && styles.tabTextActive]}>
            Leads ({leads.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {tab === 'tenants' ? (
          tenants.length === 0 ? (
            <View style={styles.emptyCenter}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No tenants yet</Text>
              <Text style={styles.emptySub}>Leasing a unit will create a tenant record</Text>
            </View>
          ) : tenants.map((t, i) => (
            <TouchableOpacity key={t.id || i} style={styles.tenantCard} activeOpacity={0.8}>
              <View style={styles.tenantAvatar}>
                <Text style={styles.tenantAvatarText}>{getInitials(t.name)}</Text>
              </View>
              <View style={styles.tenantInfo}>
                <Text style={styles.tenantName}>{t.name}</Text>
                <Text style={styles.tenantUnit}>
                  {t.unitRef ? `Unit ${t.unitRef}` : 'No unit assigned'}
                  {t.rent ? ` · QAR ${t.rent.toLocaleString()}/yr` : ''}
                </Text>
              </View>
              <View style={styles.tenantRight}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(t.status) + '15' }]}>
                  <Text style={[styles.statusText, { color: statusColor(t.status) }]}>
                    {t.status || 'active'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          leads.length === 0 ? (
            <View style={styles.emptyCenter}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyTitle}>No leads yet</Text>
              <Text style={styles.emptySub}>Leads appear when prospects inquire about units</Text>
            </View>
          ) : leads.map((l, i) => (
            <View key={l.id || i} style={styles.leadCard}>
              <View style={styles.leadAvatar}>
                <Text style={styles.leadAvatarText}>{getInitials(l.name)}</Text>
              </View>
              <View style={styles.leadInfo}>
                <Text style={styles.leadName}>{l.name}</Text>
                <Text style={styles.leadSource}>
                  {sourceLabel(l.source)}
                  {l.property_interest ? ` · ${l.property_interest}` : ''}
                  {l.budget ? ` · QAR ${l.budget.toLocaleString()}` : ''}
                </Text>
              </View>
              <View style={[styles.leadStatus, { backgroundColor: '#EFF6FF' }]}>
                <Text style={styles.leadStatusText}>{l.status}</Text>
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
