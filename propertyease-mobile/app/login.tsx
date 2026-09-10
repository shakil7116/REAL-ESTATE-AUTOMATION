/**
 * LoginScreen — PropertyEase mobile authentication.
 *
 * Accepts email + password, calls the real web API at /api/auth/login,
 * stores the session in AsyncStorage (lib/session.ts), and navigates
 * to the dashboard on success. Auto-login is handled by the root
 * layout checking for a valid session.
 */
import { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, TextInput,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PRIMARY, CORAL, WORKSPACE_BG, SLATE_500, SLATE_700, SLATE_200, SLATE_400 } from './colors';
import { saveSession } from '../lib/session';
import { t } from '../lib/i18n';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function LoginScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('login.errorFill'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const json = await res.json();

      if (json.ok && json.data) {
        const { id, email: storedEmail, name: storedName, token } = json.data;
        const displayName = name.trim() || storedName || storedEmail.split('@')[0];
        await saveSession({ id, email: storedEmail, name: displayName }, token);
        router.replace('/dashboard');
      } else {
        Alert.alert(t('login.errorCreds'), json.error?.message || '');
      }
    } catch (err) {
      Alert.alert(t('login.errorConnectTitle'), t('login.errorConnect'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Logo area */}
        <View style={styles.logoArea}>
          <View style={styles.logoBox}>
            <Text style={styles.logoLetter}>P</Text>
          </View>
          <Text style={styles.brandName}>{t('login.title')}</Text>
          <Text style={styles.tagline}>{t('login.tagline')}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>{t('login.welcomeBack')}</Text>
          <Text style={styles.formSubtitle}>{t('login.subtitle')}</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('login.formName')}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('login.placeholderName')}
              placeholderTextColor={SLATE_500}
              autoCapitalize="words"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('login.email')}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t('login.placeholderEmail')}
              placeholderTextColor={SLATE_500}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('login.password')}</Text>
            <View style={styles.passwordRow}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={t('login.placeholderPassword')}
                placeholderTextColor={SLATE_500}
                secureTextEntry={!showPassword}
                style={[styles.input, { flex: 1 }]}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>{t('login.signIn')}</Text>
            )}
          </TouchableOpacity>

          {/* Demo hint */}
          <Text style={styles.hint}>{t('login.hint')}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WORKSPACE_BG },
  content: { flex: 1, paddingHorizontal: 24 },
  logoArea: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 48,
  },
  logoBox: {
    width: 64, height: 64, borderRadius: 18, backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  logoLetter: { color: '#fff', fontSize: 32, fontWeight: '800' },
  brandName: { fontSize: 28, fontWeight: '800', color: PRIMARY, marginTop: 16 },
  tagline: { fontSize: 14, color: SLATE_500, fontWeight: '500', marginTop: 6, textAlign: 'center' },
  form: { flex: 1 },
  formTitle: { fontSize: 24, fontWeight: '800', color: SLATE_700 },
  formSubtitle: { fontSize: 14, color: SLATE_500, marginTop: 4, fontWeight: '500' },
  field: { marginTop: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: SLATE_700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: SLATE_200,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: SLATE_700,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { paddingHorizontal: 14 },
  eyeText: { fontSize: 18 },
  loginBtn: {
    backgroundColor: CORAL,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
    shadowColor: CORAL, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  hint: { fontSize: 11, color: SLATE_400, textAlign: 'center', marginTop: 16, fontWeight: '500' },
});
