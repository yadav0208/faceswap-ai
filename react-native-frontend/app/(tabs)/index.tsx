import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  useWindowDimensions, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Radius } from '../../constants/theme';
import { STUDIOS, Studio } from '../../constants/studios';

const SIDE_PAD = 16;
const CARD_GAP = 10;

const TABS = [
  { id: 'all',      label: 'For You' },
  { id: 'trending', label: 'Trending' },
  { id: 'video',    label: 'AI Video' },
  { id: 'photo',    label: 'AI Photo' },
  { id: 'occasion', label: 'Occasions' },
  { id: 'kids',     label: '👦 Kids' },
  { id: 'swap',     label: 'Face Swap' },
];

const FEATURED = [
  {
    id: 'ai_videos',
    title: 'Create Fun\nAI Videos',
    imageUrl: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800&h=600&fit=crop&q=85',
    accent: '#22C55E',
  },
  {
    id: 'birthday',
    title: 'Birthday\nPhotoshoots',
    imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&h=600&fit=crop&q=85',
    accent: '#EC4899',
  },
  {
    id: 'stadium_cam',
    title: 'AI Stadium\nCam Trend',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=600&fit=crop&q=85',
    accent: '#F59E0B',
  },
  {
    id: 'photo_styles',
    title: 'Trending AI\nPhoto Styles',
    imageUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=600&fit=crop&q=85',
    accent: '#7C3AED',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState('all');
  const [featuredIdx, setFeaturedIdx] = useState(0);

  const cardW = Math.floor((width - SIDE_PAD * 2 - CARD_GAP) / 2);
  const cardH = Math.floor(cardW * 1.45);
  const bannerH = Math.min(Math.floor(width * 0.65), 340);

  const filtered = STUDIOS.filter(
    (s) => activeTab === 'all' || s.category === activeTab,
  );

  const handlePress = useCallback((studio: Studio) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/studio/${studio.id}`);
  }, [router]);

  const badgeColor = (b?: string) =>
    b === 'HOT' ? '#EF4444' : b === 'NEW' ? '#22C55E' : b === 'TRENDING' ? '#F59E0B' : '#7C3AED';

  const feat = FEATURED[featuredIdx];

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>AI Catch ✦</Text>
            <Text style={styles.tagline}>AI Video Maker & Photo Generator</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={22} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarBtn}>
              <Ionicons name="person-circle" size={34} color={Colors.brand.purple} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 100 : 80 }}
        >
          {/* ── Featured Banner ──────────────────────────────────────────── */}
          <TouchableOpacity
            activeOpacity={0.92}
            style={[styles.banner, { height: bannerH }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push(`/studio/${feat.id}`);
            }}
          >
            {/* Background image */}
            <Image
              source={{ uri: feat.imageUrl }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
            {/* Dark overlay */}
            <LinearGradient
              colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.75)']}
              locations={[0.2, 1]}
              style={StyleSheet.absoluteFillObject}
            />
            {/* Content */}
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>{feat.title}</Text>
              <View style={[styles.bannerCta, { backgroundColor: feat.accent }]}>
                <Text style={styles.bannerCtaText}>Create Now</Text>
              </View>
            </View>
            {/* Dot indicators */}
            <View style={styles.dots}>
              {FEATURED.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => setFeaturedIdx(i)} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
                  <View style={[styles.dot, i === featuredIdx && styles.dotActive]} />
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>

          {/* ── Category Tabs ────────────────────────────────────────────── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.tabRow, { paddingHorizontal: SIDE_PAD }]}
          >
            {TABS.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => { Haptics.selectionAsync(); setActiveTab(tab.id); }}
                  style={[styles.tabPill, active && styles.tabPillActive]}
                  activeOpacity={0.8}
                >
                  {active && (
                    <LinearGradient
                      colors={[Colors.brand.purple, Colors.brand.purpleLight]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                  )}
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── Section Title ────────────────────────────────────────────── */}
          <View style={[styles.sectionHeader, { paddingHorizontal: SIDE_PAD }]}>
            <Text style={styles.sectionTitle}>
              {activeTab === 'all' ? '🔥 Popular Now'
                : activeTab === 'trending' ? '📈 Trending'
                : activeTab === 'video' ? '🎬 AI Videos'
                : activeTab === 'photo' ? '📸 AI Photo Styles'
                : activeTab === 'occasion' ? '🎉 Special Occasions'
                : activeTab === 'kids' ? '👦 Kids Fun'
                : '🔄 Face Swap & Edit'}
            </Text>
            <TouchableOpacity onPress={() => router.push('/explore')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {/* ── 2-col card grid ──────────────────────────────────────────── */}
          <View style={[styles.grid, { paddingHorizontal: SIDE_PAD }]}>
            {filtered.map((studio) => (
              <TouchableOpacity
                key={studio.id}
                onPress={() => handlePress(studio)}
                activeOpacity={0.88}
                style={[styles.card, { width: cardW, height: cardH }]}
              >
                {/* Card image */}
                <Image
                  source={{ uri: studio.imageUrl }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                {/* Gradient overlay */}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.22)', 'rgba(0,0,0,0.86)']}
                  locations={[0, 0.45, 1]}
                  style={StyleSheet.absoluteFillObject}
                />
                {/* Icon top-left */}
                <View style={styles.cardIcon}>
                  <Ionicons name={studio.icon as any} size={14} color="#fff" />
                </View>
                {/* Badge top-right */}
                {(studio.badge || studio.isPremium) && (
                  <View style={[styles.badge, {
                    backgroundColor: studio.isPremium && !studio.badge
                      ? '#F59E0B' : badgeColor(studio.badge),
                  }]}>
                    <Text style={styles.badgeText}>{studio.badge ?? 'PRO'}</Text>
                  </View>
                )}
                {/* Footer text + CTA */}
                <View style={styles.cardFooter}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{studio.title}</Text>
                  <Text style={styles.cardSub} numberOfLines={1}>{studio.subtitle}</Text>
                  <View style={styles.createBtn}>
                    <Text style={styles.createBtnText}>Create Now</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  safe: { flex: 1 },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIDE_PAD, paddingTop: 6, paddingBottom: 10,
  },
  appName: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  tagline: { fontSize: 10, color: 'rgba(255,255,255,0.38)', marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },

  /* Banner */
  banner: {
    width: '100%', overflow: 'hidden',
    marginBottom: 16, position: 'relative',
    justifyContent: 'flex-end',
  },
  bannerContent: { padding: 20, paddingBottom: 42 },
  bannerTitle: {
    fontSize: 30, fontWeight: '800', color: '#fff',
    lineHeight: 36, marginBottom: 14,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  bannerCta: {
    alignSelf: 'flex-start',
    paddingHorizontal: 22, paddingVertical: 11,
    borderRadius: Radius.full,
  },
  bannerCtaText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  dots: {
    position: 'absolute', bottom: 14, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { width: 20, backgroundColor: '#fff', borderRadius: 3 },

  /* Tabs */
  tabRow: { gap: 8, paddingBottom: 14 },
  tabPill: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', overflow: 'hidden',
  },
  tabPillActive: { borderColor: 'transparent' },
  tabText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  tabTextActive: { color: '#fff' },

  /* Section */
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  seeAll: { fontSize: 13, fontWeight: '600', color: Colors.brand.purpleLight },

  /* Grid */
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP },

  /* Card */
  card: {
    borderRadius: Radius.lg, overflow: 'hidden',
    backgroundColor: Colors.bg.card, position: 'relative',
  },
  cardImage: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%',
  },
  cardIcon: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    position: 'absolute', top: 10, left: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  badge: {
    position: 'absolute', top: 10, right: 10,
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeText: { fontSize: 8, fontWeight: '800', color: '#fff' },
  cardFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 10, paddingBottom: 12,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 2 },
  cardSub: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 7 },
  createBtn: {
    backgroundColor: Colors.brand.purple,
    borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  createBtnText: { fontSize: 10, fontWeight: '700', color: '#fff' },
});
