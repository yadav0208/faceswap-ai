import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors, Radius } from '../../constants/theme';
import { api, User } from '../../services/api';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({ images: 0, videos: 0, total_creations: 0 });
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<'profile' | 'password' | null>(null);
  const [fullName, setFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    Promise.all([api.getMe(), api.getProfileStats()])
      .then(([profile, creationStats]) => {
        if (!active) return;
        setUser(profile);
        setStats(creationStats);
      })
      .catch(() => {
        if (active) router.replace('/auth/login');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [router]));

  async function logout() {
    await api.logout();
    router.replace('/auth/login');
  }

  function openProfileEditor() {
    setFullName(user?.full_name || '');
    setEditor('profile');
  }

  async function saveProfile() {
    if (!fullName.trim()) return Alert.alert('Name required', 'Enter your display name.');
    try {
      setSaving(true);
      setUser(await api.updateProfile(fullName.trim()));
      setEditor(null);
    } catch (error: any) {
      Alert.alert('Could not update profile', error?.response?.data?.detail || 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function savePassword() {
    if (newPassword.length < 8) {
      return Alert.alert('Password too short', 'Use at least 8 characters.');
    }
    try {
      setSaving(true);
      await api.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setEditor(null);
      Alert.alert('Password updated', 'Your new password is active.');
    } catch (error: any) {
      Alert.alert('Could not change password', error?.response?.data?.detail || 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.brand.gold} />
        <Text style={styles.loadingText}>Loading your secure profile…</Text>
      </View>
    );
  }

  const displayName = user?.full_name || user?.username || 'Anva Creator';
  const identity = user?.phone_number || user?.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 110 : 90 }}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>ANVA AI ACCOUNT</Text>
              <Text style={styles.title}>Profile</Text>
            </View>
            <View style={styles.secureBadge}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.brand.gold} />
              <Text style={styles.secureText}>SECURE</Text>
            </View>
          </View>

          <View style={styles.profileCard}>
            <LinearGradient
              colors={['rgba(201,168,76,0.18)', 'rgba(201,168,76,0.03)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <Text style={styles.name}>{displayName}</Text>
            <View style={styles.identityRow}>
              <Ionicons
                name={user?.phone_number ? 'phone-portrait-outline' : 'mail-outline'}
                size={13}
                color="rgba(255,255,255,0.42)"
              />
              <Text style={styles.identity}>{identity}</Text>
              <Ionicons name="checkmark-circle" size={14} color={Colors.status.success} />
            </View>
            <Text style={styles.memberSince}>
              Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'today'}
            </Text>
          </View>

          <View style={styles.stats}>
            {[
              { label: 'Images', value: stats.images, icon: 'image' },
              { label: 'Videos', value: stats.videos, icon: 'videocam' },
              { label: 'Total', value: stats.total_creations, icon: 'sparkles' },
            ].map((item) => (
              <View key={item.label} style={styles.stat}>
                <Ionicons name={item.icon as any} size={18} color={Colors.brand.gold} />
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionLabel}>ACCOUNT & PRIVACY</Text>
          <View style={styles.menu}>
            <MenuRow icon="person-outline" label="Edit profile" onPress={openProfileEditor} />
            <MenuRow
              icon="lock-closed-outline"
              label="Password & sign-in"
              onPress={() => setEditor('password')}
            />
            <MenuRow icon="mail-outline" label="Account email" value={user?.email || ''} onPress={() => Alert.alert('Account email', user?.email || '')} />
            <MenuRow icon="shield-checkmark-outline" label="Privacy controls" onPress={() => Alert.alert('Privacy', 'Creation history is private to your signed-in account. Passwords and OTP codes are stored only as secure hashes.')} last />
          </View>

          <Text style={styles.sectionLabel}>SESSION</Text>
          <View style={styles.menu}>
            <MenuRow icon="log-out-outline" label="Log out securely" danger onPress={logout} last />
          </View>

          <Text style={styles.privacyNote}>
            Passwords are stored only as secure hashes. Your private creation history is protected by your signed-in session.
          </Text>
          <Text style={styles.version}>Anva AI · v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
      <Modal visible={editor !== null} transparent animationType="fade" onRequestClose={() => setEditor(null)}>
        <View style={styles.modalShade}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editor === 'profile' ? 'Edit profile' : 'Change password'}</Text>
            {editor === 'profile' ? (
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Display name"
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoFocus
              />
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Current password"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  secureTextEntry
                />
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="New password (8+ characters)"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  secureTextEntry
                />
              </>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditor(null)} disabled={saving}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={editor === 'profile' ? saveProfile : savePassword} disabled={saving}>
                {saving ? <ActivityIndicator color="#090909" /> : <Text style={styles.saveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MenuRow({
  icon, label, value, onPress, danger, last,
}: {
  icon: any; label: string; value?: string; onPress: () => void; danger?: boolean; last?: boolean;
}) {
  return (
    <TouchableOpacity style={[styles.menuRow, !last && styles.menuBorder]} onPress={onPress}>
      <View style={[styles.menuIcon, danger && styles.dangerIcon]}>
        <Ionicons name={icon} size={18} color={danger ? Colors.status.error : 'rgba(255,255,255,0.65)'} />
      </View>
      <Text style={[styles.menuLabel, danger && styles.dangerText]}>{label}</Text>
      {value && <Text style={styles.menuValue}>{value}</Text>}
      {!danger && <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.20)" />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  safe: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.bg.primary },
  loadingText: { color: 'rgba(255,255,255,0.45)', fontSize: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 16 },
  brand: { color: Colors.brand.gold, fontSize: 10, fontWeight: '900', letterSpacing: 2.4, marginBottom: 3 },
  title: { color: '#fff', fontSize: 31, fontWeight: '800' },
  secureBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.brand.goldMuted },
  secureText: { color: Colors.brand.gold, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  profileCard: { marginHorizontal: 16, padding: 22, borderRadius: Radius.lg, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: Colors.border.gold },
  avatar: { width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.brand.gold, marginBottom: 10 },
  avatarText: { color: '#090909', fontSize: 30, fontWeight: '800' },
  name: { color: '#fff', fontSize: 21, fontWeight: '800', marginBottom: 5 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  identity: { color: 'rgba(255,255,255,0.48)', fontSize: 12 },
  memberSince: { color: 'rgba(255,255,255,0.28)', fontSize: 10, marginTop: 7 },
  stats: { flexDirection: 'row', gap: 9, paddingHorizontal: 16, marginTop: 12, marginBottom: 22 },
  stat: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 13, borderRadius: Radius.md, backgroundColor: Colors.bg.card, borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)' },
  statValue: { color: '#fff', fontSize: 19, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.38)', fontSize: 10 },
  sectionLabel: { color: 'rgba(255,255,255,0.34)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, paddingHorizontal: 16, marginBottom: 8 },
  menu: { marginHorizontal: 16, marginBottom: 20, borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: Colors.bg.card, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  menuRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 13 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  dangerIcon: { backgroundColor: 'rgba(239,68,68,0.10)' },
  menuLabel: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },
  menuValue: { color: Colors.status.success, fontSize: 10, fontWeight: '700' },
  dangerText: { color: Colors.status.error },
  privacyNote: { color: 'rgba(255,255,255,0.27)', fontSize: 10, lineHeight: 15, textAlign: 'center', paddingHorizontal: 34 },
  version: { color: 'rgba(255,255,255,0.18)', fontSize: 10, textAlign: 'center', marginTop: 10 },
  modalShade: { flex: 1, backgroundColor: 'rgba(0,0,0,0.76)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 430, padding: 20, borderRadius: Radius.lg, backgroundColor: '#151515', borderWidth: 1, borderColor: Colors.border.gold, gap: 12 },
  modalTitle: { color: '#fff', fontSize: 21, fontWeight: '800', marginBottom: 3 },
  input: { height: 52, borderRadius: Radius.md, paddingHorizontal: 14, color: '#fff', backgroundColor: '#0d0d0d', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelButton: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md, backgroundColor: 'rgba(255,255,255,0.07)' },
  cancelText: { color: '#fff', fontWeight: '700' },
  saveButton: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md, backgroundColor: Colors.brand.gold },
  saveText: { color: '#090909', fontWeight: '900' },
});
