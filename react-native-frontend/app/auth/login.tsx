import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username || !password) {
      Alert.alert('Required', 'Enter your username and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://10.99.217.247:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.replace('/(tabs)');
      } else {
        const d = await res.json().catch(() => ({}));
        Alert.alert('Login failed', d.detail || 'Invalid credentials');
      }
    } catch {
      Alert.alert('Error', 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <TouchableOpacity style={styles.close} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Logo */}
          <LinearGradient
            colors={[Colors.brand.goldDark, Colors.brand.gold]}
            style={styles.logo}
          >
            <Ionicons name="sparkles" size={28} color="#000" />
          </LinearGradient>

          <Text style={styles.brandLabel}>ANVA AI</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          {/* Username */}
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.4)" />
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor="rgba(255,255,255,0.3)"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          {/* Password */}
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.4)" />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="rgba(255,255,255,0.3)"
              secureTextEntry={!showPass}
              style={styles.input}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Ionicons
                name={showPass ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color="rgba(255,255,255,0.4)"
              />
            </TouchableOpacity>
          </View>

          {/* Sign in button */}
          <TouchableOpacity
            onPress={handleLogin}
            style={styles.loginBtn}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.brand.goldDark, Colors.brand.gold, Colors.brand.goldLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Register link */}
          <TouchableOpacity
            onPress={() => router.push('/auth/register')}
            style={styles.registerLink}
          >
            <Text style={styles.registerText}>
              Don't have an account?{' '}
              <Text style={styles.registerBold}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  safe: { flex: 1 },
  close: { position: 'absolute', top: 54, right: 20, zIndex: 10, padding: 8 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingBottom: 40,
    gap: 12,
  },
  logo: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4, alignSelf: 'center',
  },
  brandLabel: {
    fontSize: 11, fontWeight: '800', letterSpacing: 2.5,
    color: Colors.brand.gold, textAlign: 'center', marginBottom: 4,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', textAlign: 'center' },
  subtitle: {
    fontSize: 15, color: 'rgba(255,255,255,0.45)',
    textAlign: 'center', marginBottom: 16,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  input: { flex: 1, fontSize: 15, color: '#fff' },
  loginBtn: {
    height: 54, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginTop: 8,
  },
  loginBtnText: { fontSize: 16, fontWeight: '800', color: '#000' },
  registerLink: { alignItems: 'center', marginTop: 8 },
  registerText: { fontSize: 14, color: 'rgba(255,255,255,0.45)' },
  registerBold: { color: Colors.brand.gold, fontWeight: '600' },
});
