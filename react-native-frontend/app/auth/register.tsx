import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { Colors, Radius } from '../../constants/theme';

function registrationErrorMessage(error: any): string {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && typeof detail[0]?.msg === 'string') {
    return detail[0].msg.replace(/^Value error,\s*/i, '');
  }
  if (error?.code === 'ECONNABORTED') {
    return 'The server took too long to respond. Please try again in a moment.';
  }
  if (!error?.response) {
    return 'The Anva AI server is unavailable. Check your connection and try again.';
  }
  return 'Something went wrong while creating your account. Please try again.';
}

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function createAccount() {
    if (!email.trim() || password.length < 8) {
      return Alert.alert('Required', 'Enter an email and a password of at least 8 characters.');
    }
    try {
      setLoading(true);
      const normalized = email.trim().toLowerCase();
      const randomSuffix = Math.random().toString(36).slice(2, 8);
      const username = `user_${Date.now().toString(36)}_${randomSuffix}`;
      await api.register(username, normalized, password, fullName.trim() || undefined);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Could not create account', registrationErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.brand}>ANVA AI</Text>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Use your email and choose a secure password</Text>
          <Field icon="person-outline" value={fullName} onChangeText={setFullName} placeholder="Full name" />
          <Field icon="mail-outline" value={email} onChangeText={setEmail} placeholder="Email address" email />
          <Field icon="lock-closed-outline" value={password} onChangeText={setPassword} placeholder="Password (8+ characters)" secure />
          <TouchableOpacity style={styles.button} onPress={createAccount} disabled={loading}>
            <LinearGradient colors={[Colors.brand.goldDark, Colors.brand.goldLight]} style={StyleSheet.absoluteFill} />
            {loading ? <ActivityIndicator color="#090909" /> : <Text style={styles.buttonText}>Create Account</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/auth/login')}>
            <Text style={styles.link}>Already registered? <Text style={styles.gold}>Sign in</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function Field({ icon, email, secure, ...props }: any) {
  return (
    <View style={styles.field}>
      <Ionicons name={icon} size={19} color="#777" />
      <TextInput
        {...props}
        style={styles.input}
        placeholderTextColor="#666"
        keyboardType={email ? 'email-address' : 'default'}
        autoCapitalize={email ? 'none' : 'words'}
        secureTextEntry={secure}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  safe: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 13 },
  back: { position: 'absolute', top: 18, left: 20, padding: 8 },
  brand: { color: Colors.brand.gold, fontSize: 11, fontWeight: '800', letterSpacing: 3, textAlign: 'center' },
  title: { color: '#fff', fontSize: 32, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#777', fontSize: 15, textAlign: 'center', marginBottom: 12 },
  field: {
    minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 11,
    paddingHorizontal: 16, borderRadius: Radius.md, backgroundColor: Colors.bg.card,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
  },
  input: { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 16, outlineStyle: 'none' } as any,
  button: { height: 56, borderRadius: Radius.full, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  buttonText: { color: '#090909', fontSize: 16, fontWeight: '800' },
  link: { color: '#777', textAlign: 'center', marginTop: 7 },
  gold: { color: Colors.brand.gold, fontWeight: '700' },
});
