import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { Colors, Radius } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function signIn() {
    if (!email.trim() || !password) {
      return Alert.alert('Required', 'Enter your Gmail address and password.');
    }
    try {
      setLoading(true);
      await api.login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Sign in failed', error?.response?.data?.detail || 'Check your email and password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Image source={require('../../assets/brand/anva-mark.png')} style={styles.logo} />
          <Text style={styles.brand}>ANVA AI</Text>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>Sign in with your email and password</Text>
          <View style={styles.field}>
            <Ionicons name="mail-outline" size={19} color="#777" />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={styles.field}>
            <Ionicons name="lock-closed-outline" size={19} color="#777" />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#666"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword((value) => !value)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={19} color="#777" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.button} onPress={signIn} disabled={loading}>
            <LinearGradient colors={[Colors.brand.goldDark, Colors.brand.goldLight]} style={StyleSheet.absoluteFill} />
            {loading ? <ActivityIndicator color="#090909" /> : <Text style={styles.buttonText}>Sign In</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={styles.link}>New to Anva AI? <Text style={styles.gold}>Create account</Text></Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  safe: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 13 },
  logo: { width: 70, height: 70, borderRadius: 20, alignSelf: 'center' },
  brand: { color: Colors.brand.gold, fontSize: 11, fontWeight: '800', letterSpacing: 3, textAlign: 'center' },
  title: { color: '#fff', fontSize: 34, fontWeight: '800', textAlign: 'center' },
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
