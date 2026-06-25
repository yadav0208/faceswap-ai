// This screen is opened by the floating + button
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Radius } from '../../constants/theme';
import { STUDIOS } from '../../constants/studios';

const QUICK_ACTIONS = [
  { label: 'Face Swap', icon: 'swap-horizontal', id: 'outfit' },
  { label: 'New Hair', icon: 'cut', id: 'hairstyle' },
  { label: 'Try Makeup', icon: 'color-palette', id: 'makeup' },
  { label: 'Pro Headshot', icon: 'briefcase', id: 'professional' },
];

export default function CreateScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Create</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 100 : 80 }}
        >
          {/* Quick start */}
          <Text style={styles.sectionTitle}>Quick Start</Text>
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map((a) => (
              <TouchableOpacity
                key={a.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push(`/studio/${a.id}`);
                }}
                style={styles.quickCard}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[Colors.brand.purple + '30', Colors.brand.purpleLight + '15']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.quickIcon}>
                  <Ionicons name={a.icon as any} size={22} color={Colors.brand.purpleLight} />
                </View>
                <Text style={styles.quickLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* All studios */}
          <Text style={styles.sectionTitle}>All Studios</Text>
          {STUDIOS.map((studio) => (
            <TouchableOpacity
              key={studio.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/studio/${studio.id}`);
              }}
              style={styles.listRow}
              activeOpacity={0.85}
            >
              <View style={styles.listIcon}>
                <Ionicons name={studio.icon as any} size={20} color={Colors.brand.purpleLight} />
              </View>
              <View style={styles.listInfo}>
                <Text style={styles.listTitle}>{studio.title}</Text>
                <Text style={styles.listSub}>{studio.subtitle}</Text>
              </View>
              {studio.isPremium && (
                <View style={styles.proBadge}>
                  <Text style={styles.proText}>PRO</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.25)" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#fff' },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 20,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  quickCard: {
    width: '47%',
    height: 90,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(124,58,237,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 13, fontWeight: '600', color: '#fff' },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  listIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(124,58,237,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listInfo: { flex: 1 },
  listTitle: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 2 },
  listSub: { fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  proBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
  },
  proText: { fontSize: 9, fontWeight: '800', color: '#000' },
});
