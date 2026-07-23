import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius } from '../../constants/theme';

const MENU_ITEMS = [
  { icon: 'person-outline',           label: 'Edit Profile',           section: 'account' },
  { icon: 'notifications-outline',    label: 'Notifications',          section: 'account' },
  { icon: 'shield-checkmark-outline', label: 'Privacy & Security',     section: 'account' },
  { icon: 'diamond-outline',          label: 'Upgrade to Pro',         section: 'billing', highlight: true },
  { icon: 'flash-outline',            label: 'Buy Credits',            section: 'billing' },
  { icon: 'card-outline',             label: 'Billing & Subscription', section: 'billing' },
  { icon: 'help-circle-outline',      label: 'Help & Support',         section: 'support' },
  { icon: 'star-outline',             label: 'Rate the App',           section: 'support' },
  { icon: 'share-social-outline',     label: 'Share with Friends',     section: 'support' },
  { icon: 'log-out-outline',          label: 'Log Out',                section: 'danger', danger: true },
];

const SECTIONS = ['account', 'billing', 'support', 'danger'];
const SECTION_LABELS: Record<string, string> = {
  account: 'Account',
  billing: 'Subscription & Credits',
  support: 'Support',
  danger: '',
};

export default function ProfileScreen() {
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 100 : 80 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.brandLabel}>ANVA AI</Text>
              <Text style={styles.title}>Profile</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="settings-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Avatar card */}
          <View style={styles.avatarCard}>
            <LinearGradient
              colors={[Colors.brand.gold + '22', Colors.brand.goldLight + '08']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.avatarWrap}>
              <LinearGradient
                colors={[Colors.brand.goldDark, Colors.brand.gold]}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarInitial}>A</Text>
              </LinearGradient>
              <TouchableOpacity style={styles.avatarEdit}>
                <Ionicons name="camera" size={14} color="#000" />
              </TouchableOpacity>
            </View>
            <Text style={styles.name}>AI Creator</Text>
            <Text style={styles.email}>creator@anvaai.app</Text>

            <View style={styles.freeBadge}>
              <Ionicons name="flash" size={12} color={Colors.brand.gold} />
              <Text style={styles.freeBadgeText}>Free Plan · 5 credits left</Text>
            </View>

            <TouchableOpacity style={styles.upgradeBtn} activeOpacity={0.85}>
              <LinearGradient
                colors={[Colors.brand.goldDark, Colors.brand.gold, Colors.brand.goldLight]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="diamond-outline" size={16} color="#000" />
              <Text style={styles.upgradeBtnText}>Upgrade to Pro — Unlimited</Text>
            </TouchableOpacity>
          </View>

          {/* Usage stats */}
          <View style={styles.statsRow}>
            {[
              { label: 'Videos',  value: '16', icon: 'film' },
              { label: 'Images',  value: '8',  icon: 'image' },
              { label: 'Credits', value: '5',  icon: 'flash' },
            ].map((s) => (
              <View key={s.label} style={styles.statCard}>
                <Ionicons name={s.icon as any} size={18} color={Colors.brand.gold} />
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Menu sections */}
          {SECTIONS.map((section) => {
            const items = MENU_ITEMS.filter((m) => m.section === section);
            if (items.length === 0) return null;
            return (
              <View key={section} style={styles.menuSection}>
                {SECTION_LABELS[section] ? (
                  <Text style={styles.menuSectionLabel}>{SECTION_LABELS[section]}</Text>
                ) : null}
                <View style={styles.menuGroup}>
                  {items.map((item, i) => (
                    <TouchableOpacity
                      key={item.label}
                      style={[styles.menuRow, i < items.length - 1 && styles.menuRowBorder]}
                      activeOpacity={0.75}
                    >
                      <View style={[
                        styles.menuIconWrap,
                        (item as any).highlight && styles.menuIconHighlight,
                        (item as any).danger   && styles.menuIconDanger,
                      ]}>
                        <Ionicons
                          name={item.icon as any}
                          size={18}
                          color={
                            (item as any).danger    ? Colors.status.error :
                            (item as any).highlight ? Colors.brand.gold :
                            'rgba(255,255,255,0.65)'
                          }
                        />
                      </View>
                      <Text style={[
                        styles.menuLabel,
                        (item as any).danger    && styles.menuLabelDanger,
                        (item as any).highlight && styles.menuLabelHighlight,
                      ]}>
                        {item.label}
                      </Text>
                      {!(item as any).danger && (
                        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}

          <Text style={styles.version}>Anva AI · v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14,
  },
  brandLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2.5,
    color: Colors.brand.gold, marginBottom: 2,
  },
  title: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 20,
  },
  avatarCard: {
    marginHorizontal: 16, borderRadius: Radius.lg, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border.gold,
    overflow: 'hidden', marginBottom: 14,
  },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatarGradient: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 32, fontWeight: '700', color: '#000' },
  avatarEdit: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.brand.gold,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.bg.primary,
  },
  name: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 12 },
  freeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: Colors.brand.goldMuted,
    borderRadius: Radius.full, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border.gold,
  },
  freeBadgeText: { fontSize: 12, fontWeight: '600', color: Colors.brand.gold },
  upgradeBtn: {
    width: '100%', height: 46, borderRadius: Radius.full,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, overflow: 'hidden',
  },
  upgradeBtnText: { fontSize: 14, fontWeight: '800', color: '#000' },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: Colors.bg.card, borderRadius: Radius.md,
    alignItems: 'center', paddingVertical: 14, gap: 4,
    borderWidth: 1, borderColor: Colors.border.gold,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  menuSection: { marginBottom: 20 },
  menuSectionLabel: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase', letterSpacing: 1.5,
    paddingHorizontal: 16, marginBottom: 8,
  },
  menuGroup: {
    marginHorizontal: 16, backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 14, gap: 12,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  menuIconHighlight: { backgroundColor: Colors.brand.goldMuted },
  menuIconDanger: { backgroundColor: 'rgba(239,68,68,0.1)' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#fff' },
  menuLabelDanger: { color: Colors.status.error },
  menuLabelHighlight: { color: Colors.brand.gold },
  version: {
    textAlign: 'center', fontSize: 12,
    color: 'rgba(255,255,255,0.2)', marginBottom: 10, marginTop: 4,
  },
});
