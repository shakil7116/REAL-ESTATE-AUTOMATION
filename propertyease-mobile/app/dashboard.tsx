/**
 * DashboardScreen — PropertyEase mobile main dashboard.
 *
 * Fetches real stats from GET /api/dashboard using the stored auth token.
 * Shows a loading skeleton first, then portfolio overview cards, quick actions,
 * health score banner, and recent activity from GET /api/activities.
 */
import { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  PRIMARY, CORAL, WORKSPACE_BG, SLATE_500, SLATE_700, SLATE_200,
  EMERALD_500, AMBER_500, SLATE_400,
} from './colors';
import { getUser, getToken } from '../lib/session';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface DashboardStats {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  totalRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  openTickets: number;
  totalLeads: number;
  activeLeads: number;
}

interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  entity_id: string;
  details?: string | null;
  created_at: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('User');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const user = await getUser();
      if (user) setUserName(user.name);

      const token = await getToken();
      if (!token) { router.replace('/login'); return; }

      try {
        const [statsRes, actRes] = await Promise.all([
          fetch(`${API_BASE}/api/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/activities?limit=5`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const statsJson = await statsRes.json();
        if (statsJson.ok && statsJson.data) setStats(statsJson.data);

        const actJson = await actRes.json();
        if (actJson.ok && Array.isArray(actJson.data)) setActivities(actJson.data);
      } catch {
        // Fall through — show what we have
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const fmtCurrency = (n: number) => {
    if (n >= 1_000_000) return `QAR ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `QAR ${Math.round(n / 1_000)}K`;
    return `QAR ${n.toLocaleString()}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.skeletonContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.skeletonText}>Loading dashboard…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const occRate = stats?.occupancyRate ?? 0;
  const healthScore = Math.min(100, Math.round(occRate + (stats?.openTickets ?? 0) * 0.5));

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}, {userName}</Text>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.avatar} onPress={() => router.push('/settings')}>
          <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Stat Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Portfolio Overview</Text>
          <View style={styles.statsGrid}>
            {[
              {
                label: 'Total Revenue',
                value: stats ? fmtCurrency(stats.totalRevenue) : '—',
                change: `${stats?.totalProperties ?? 0} properties`,
                up: true,
                color: CORAL,
                icon: '💵',
              },
              {
                label: 'Occupied Units',
                value: stats ? `${stats.occupiedUnits}/${stats.totalUnits}` : '—',
                change: `${occRate}% rate`,
                up: true,
                color: EMERALD_500,
                icon: '🏠',
              },
              {
                label: 'Pending Payments',
                value: String(stats?.pendingPayments ?? 0),
                change: `${stats?.overduePayments ?? 0} overdue`,
                up: false,
                color: AMBER_500,
                icon: '📧',
              },
              {
                label: 'Open Tickets',
                value: String(stats?.openTickets ?? 0),
                change: 'needs attention',
                up: false,
                color: '#6366F1',
                icon: '🔧',
              },
            ].map((card, i) => (
              <View key={i} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: card.color + '15' }]}>
                  <Text style={{ fontSize: 18 }}>{card.icon}</Text>
                </View>
                <Text style={[styles.statValue, { color: card.color }]}>{card.value}</Text>
                <Text style={styles.statLabel}>{card.label}</Text>
                <Text style={styles.statChange}>{card.change}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {[
              { label: 'Properties', icon: '🏢', route: '/properties' as const },
              { label: 'Record Payment', icon: '💰', route: '/payments' as const },
              { label: 'Create Ticket', icon: '🔧', route: '/maintenance' as const },
              { label: 'View Tenants', icon: '👥', route: '/tenants' as const },
            ].map((action, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickAction}
                activeOpacity={0.8}
                onPress={() => router.push(action.route)}
              >
                <Text style={styles.quickActionIcon}>{action.icon}</Text>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Health Score Banner */}
        <View style={styles.healthBanner}>
          <View style={styles.healthLeft}>
            <Text style={styles.healthTitle}>Portfolio Health Score</Text>
            <Text style={styles.healthSub}>Based on occupancy & payments</Text>
          </View>
          <View style={styles.healthScore}>
            <Text style={styles.healthScoreValue}>{healthScore}</Text>
            <Text style={styles.healthScoreLabel}>Score</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {activities.length === 0 ? (
            <Text style={styles.emptyText}>No recent activity</Text>
          ) : (
            activities.slice(0, 5).map((item, i) => (
              <View key={item.id || i} style={styles.activityItem}>
                <View style={[styles.activityDot, { backgroundColor: EMERALD_500 }]} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>
                    {item.action} {item.entity}
                    {item.details ? ` (${item.details})` : ''}
                  </Text>
                  <Text style={styles.activityTime}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WORKSPACE_BG },
  scroll: { flex: 1 },
  skeletonContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  skeletonText: { marginTop: 12, fontSize: 14, color: SLATE_500, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: WORKSPACE_BG,
  },
  greeting: { fontSize: 12, color: SLATE_500, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: 24, fontWeight: '800', color: SLATE_700, marginTop: 2 },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: SLATE_500, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  statValue: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11, color: SLATE_500, fontWeight: '600' },
  statChange: { fontSize: 11, color: SLATE_400, marginTop: 4, fontWeight: '500' },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickAction: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: SLATE_200,
    alignItems: 'center',
  },
  quickActionIcon: { fontSize: 24, marginBottom: 8 },
  quickActionLabel: { fontSize: 13, fontWeight: '700', color: SLATE_700, textAlign: 'center' },
  healthBanner: {
    marginHorizontal: 20,
    backgroundColor: PRIMARY,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  healthLeft: { flex: 1 },
  healthTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  healthSub: { fontSize: 12, color: '#8EA499', marginTop: 4 },
  healthScore: { alignItems: 'flex-end' },
  healthScoreValue: { fontSize: 36, fontWeight: '800', color: CORAL },
  healthScoreLabel: { fontSize: 10, color: '#8EA499', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  activityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, marginRight: 12, flexShrink: 0 },
  activityContent: { flex: 1 },
  activityText: { fontSize: 14, color: SLATE_700, fontWeight: '500', lineHeight: 20 },
  activityTime: { fontSize: 11, color: SLATE_500, fontWeight: '600', marginTop: 2 },
  emptyText: { fontSize: 14, color: SLATE_400, textAlign: 'center', paddingVertical: 16 },
});
