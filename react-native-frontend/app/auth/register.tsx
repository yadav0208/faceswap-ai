import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius } from '../../constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!form.username || !form.email || !form.password) {
      Alert.alert('Required', 'Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          full_name: form.fullName || undefined,
        }),
      });
      if (res.ok) {
        router.replace('/(tabs)');
      } else {
        const d = await res.json().catch(() => ({}));
        Alert.alert('Registration failed', d.detail || 'Something went wrong');
      }
    } catch {
      Alert.alert('Error', 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { key: 'fullName', placeholder: 'Full Name (optional)', icon: 'person-outline', secure: false },
    { key: 'username', placeholder: 'Username *', icon: 'at-outline', secure: false },
    { key: 'email', placeholder: 'Email *', icon: 'mail-outline', secure: false },
    { key: 'password', placeholder: 'Password *', icon: 'lock-closed-outline', secure: true },
  ] as const;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <TouchableOpacity style={styles.close} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={[Colors.brand.purple, Colors.brand.purpleLight]}
            style={styles.logo}
          >
            <Ionicons name="sparkles" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join Fun With AI today</Text>

          {fields.map((f) => (
            <View key={f.key} style={styles.inputWrap}>
              <Ionicons name={f.icon} size={18} color="rgba(255,255,255,0.4)" />
              <TextInput
                value={form[f.key]}
                onChangeText={(v) => setForm((p) => ({ ...p, [f.key]: v }))}
                placeholder={f.placeholder}
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry={f.secure && !showPass}
                autoCapitalize={f.key === 'email' ? 'none' : f.key === 'username' ? 'none' : 'words'}
                keyboardType={f.key === 'email' ? 'email-address' : 'default'}
                style={styles.input}
              />
              {f.secure && (
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Ionicons
                    name={showPass ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="rgba(255,255,255,0.4)"
                  />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity onPress={handleRegister} style={styles.btn} activeOpacity={0.85}>
            <LinearGradient
              colors={[Colors.brand.purple, Colors.brand.purpleLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.loginLink}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginBold}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  safe: { flex: 1 },
  close: { position: 'absolute', top: 54, right: 20, zIndex: 10, padding: 8 },
  content: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40, gap: 12 },
  logo: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8, alignSelf: 'center',
  },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginBottom: 16 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  input: { flex: 1, fontSize: 15, color: '#fff' },
  btn: {
    height: 54, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginTop: 8,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  loginLink: { alignItems: 'center', marginTop: 8 },
  loginText: { fontSize: 14, color: 'rgba(255,255,255,0.45)' },
  loginBold: { color: Colors.brand.purpleLight, fontWeight: '600' },
});
