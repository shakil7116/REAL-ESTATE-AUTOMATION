import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PRIMARY, CORAL, WORKSPACE_BG } from './app/colors';

export default function App() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <View style={styles.logoBox}>
          <Text style={styles.logoLetter}>P</Text>
        </View>
        <Text style={styles.brandName}>PropertyEase</Text>
        <Text style={styles.tagline}>Smart Property Management</Text>
        <View style={styles.divider} />
        <Text style={styles.hint}>Use Expo Router for navigation</Text>
        <Text style={styles.hint2}>Run: npx expo start</Text>
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WORKSPACE_BG },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logoBox: {
    width: 80, height: 80, borderRadius: 22, backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10,
  },
  logoLetter: { color: '#fff', fontSize: 36, fontWeight: '800' },
  brandName: { fontSize: 32, fontWeight: '800', color: PRIMARY, marginTop: 20 },
  tagline: { fontSize: 14, color: '#64748B', fontWeight: '500', marginTop: 6, textAlign: 'center' },
  divider: { width: 48, height: 3, backgroundColor: CORAL, borderRadius: 2, marginVertical: 24 },
  hint: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  hint2: { fontSize: 13, color: '#94A3B8', fontWeight: '600', marginTop: 4 },
});
