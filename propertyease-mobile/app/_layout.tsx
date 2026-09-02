/**
 * Root layout for PropertyEase mobile app.
 *
 * Checks for a stored session on mount; if none exists, redirects to /login.
 * Otherwise renders the bottom-tab navigator.
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Tabs } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRIMARY, CORAL } from './colors';

const SESSION_KEY = 'propertyease_user';

const ICONS: Record<string, string> = {
  home: '🏠',
  building: '🏢',
  users: '👥',
  payments: '💳',
  wrench: '🔧',
  sparkles: '✨',
  settings: '⚙️',
};

function TabIcon({ name }: { name: string }) {
  return (
    <View style={{
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center' as const,
      marginBottom: 2,
      backgroundColor: '#F6F8F6',
    }}>
      <Text style={{ fontSize: 18 }}>{ICONS[name] || '•'}</Text>
    </View>
  );
}

export default function Layout() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (!raw) {
          router.replace('/login');
          return;
        }
        JSON.parse(raw);
      } catch {
        router.replace('/login');
        return;
      }
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <ActivityIndicator size="large" color={PRIMARY} style={{ flex: 1 }} />
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: CORAL,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          height: 68,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' as const, marginTop: 2 },
        tabBarItemStyle: { alignItems: 'center' as const, justifyContent: 'center' as const, paddingVertical: 4 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Dashboard', tabBarIcon: () => <TabIcon name="home" /> }}
      />
      <Tabs.Screen
        name="properties"
        options={{ title: 'Properties', tabBarIcon: () => <TabIcon name="building" /> }}
      />
      <Tabs.Screen
        name="tenants"
        options={{ title: 'Tenants', tabBarIcon: () => <TabIcon name="users" /> }}
      />
      <Tabs.Screen
        name="payments"
        options={{ title: 'Payments', tabBarIcon: () => <TabIcon name="payments" /> }}
      />
      <Tabs.Screen
        name="maintenance"
        options={{ title: 'Maintenance', tabBarIcon: () => <TabIcon name="wrench" /> }}
      />
      <Tabs.Screen
        name="copilot"
        options={{ title: 'AI Copilot', tabBarIcon: () => <TabIcon name="sparkles" /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: () => <TabIcon name="settings" /> }}
      />
    </Tabs>
  );
}
