import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Radius } from '../../constants/theme';
import { STUDIOS } from '../../constants/studios';

// AI Catch quick-action shortcuts
const QUICK_ACTIONS = [
  { label: 'AI Videos',     icon: 'film',              id: 'ai_videos',    color: '#22C55E' },
  { label: 'Face Swap',     icon: 'swap-horizontal',   id: 'face_swap',    color: '#DB2777' },
  { label: 'Birthday',      icon: 'gift',              id: 'birthday',     color: '#F59E0B' },
  { label: 'Photo Styles',  icon: 'sparkles',          id: 'photo_styles', color: '#7C3AED' },
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
                  colors={[a.color + '28', a.color + '0A']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[styles.quickIcon, { backgroundColor: a.color + '25' }]}>
                  <Ionicons name={a.icon as any} size={22} color={a.color} />
                </View>
                <Text style={styles.quickLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Trending */}
          <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
          {STUDIOS.filter((s) => s.category === 'trending').map((studio) => (
            <ToolRow key={studio.id} studio={studio} router={router} />
          ))}

          {/* Video Tools */}
          <Text style={styles.sectionTitle}>🎬 AI Video</Text>
          {STUDIOS.filter((s) => s.category === 'video').map((studio) => (
            <ToolRow key={studio.id} studio={studio} router={router} />
          ))}

          {/* Photo Styles */}
          <Text style={styles.sectionTitle}>📸 AI Photo Styles</Text>
          {STUDIOS.filter((s) => s.category === 'photo').map((studio) => (
            <ToolRow key={studio.id} studio={studio} router={router} />
          ))}

          {/* Occasions */}
          <Text style={styles.sectionTitle}>🎉 Special Occasions</Text>
          {STUDIOS.filter((s) => s.category === 'occasion').map((studio) => (
            <ToolRow key={studio.id} studio={studio} router={router} />
          ))}

          {/* Face Swap */}
          <Text style={styles.sectionTitle}>🔄 Face Swap & Edit</Text>
          {STUDIOS.filter((s) => s.category === 'swap').map((studio) => (
            <ToolRow key={studio.id} studio={studio} router={router} />
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ToolRow({ studio, router }: { studio: any; router: any }) {
  const badgeColor =
    studio.badge === 'HOT' ? '#EF4444' :
    studio.badge === 'NEW' ? '#22C55E' :
    studio.badge === 'TRENDING' ? '#F59E0B' : null;

  return (
    <TouchableOpacity
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
      {studio.badge && badgeColor && (
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{studio.badge}</Text>
        </View>
      )}
      {studio.isPremium && !studio.badge && (
        <View style={[styles.badge, { backgroundColor: '#F59E0B' }]}>
          <Text style={styles.badgeText}>PRO</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.25)" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#fff' },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase', letterSpacing: 1,
    paddingHorizontal: 16, marginBottom: 10, marginTop: 22,
  },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  quickCard: {
    width: '47%', height: 92,
    borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  quickIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { fontSize: 12, fontWeight: '600', color: '#fff' },
  listRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  listIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(124,58,237,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  listInfo: { flex: 1 },
  listTitle: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 2 },
  listSub: { fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  badge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4 },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
});
