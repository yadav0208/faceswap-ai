import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, useWindowDimensions, TextInput, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Radius } from '../../constants/theme';
import {
  getStudioFallbackSource,
  getStudioImageSource,
  STUDIOS,
} from '../../constants/studios';

const CATEGORIES = ['All', 'Trending', 'AI Video', 'AI Photo', 'Occasions', 'Face Swap'];

const CATEGORY_MAP: Record<string, string> = {
  trending: 'Trending',
  video:    'AI Video',
  photo:    'AI Photo',
  occasion: 'Occasions',
  swap:     'Face Swap',
};

function StudioImage({ id }: { id: string }) {
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => setUseFallback(false), [id]);

  return (
    <Image
      source={useFallback ? getStudioFallbackSource(id) : getStudioImageSource(id)}
      style={styles.cardImage}
      resizeMode="cover"
      onError={() => setUseFallback(true)}
    />
  );
}

export default function ExploreScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const SIDE_PAD = 16;
  const GAP = 10;
  const availableWidth = Math.min(width, 720);
  const cardW = (availableWidth - SIDE_PAD * 2 - GAP) / 2;
  const cardH = cardW * 1.42;

  const filtered = STUDIOS.filter((s) => {
    const catMatch =
      activeCategory === 'All' || CATEGORY_MAP[s.category] === activeCategory;
    const searchMatch =
      !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.subtitle.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  const badgeColor = (b?: string) =>
    b === 'HOT' ? '#EF4444' : b === 'NEW' ? '#22C55E' : b === 'TRENDING' ? Colors.brand.gold : Colors.brand.gold;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandLabel}>ANVA AI</Text>
            <Text style={styles.title}>Explore</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="options-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.4)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search AI tools & effects…"
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category pills */}
        <ScrollView
          horizontal
          style={styles.catScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
        >
          {CATEGORIES.map((cat) => {
            const active = cat === activeCategory;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => { Haptics.selectionAsync(); setActiveCategory(cat); }}
                style={[styles.catPill, active && styles.catPillActive]}
                activeOpacity={0.8}
              >
                {active && (
                  <LinearGradient
                    colors={[Colors.brand.goldDark, Colors.brand.gold]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Text
                  allowFontScaling={false}
                  style={[styles.catText, active && styles.catTextActive]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Grid */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.grid,
            { paddingHorizontal: SIDE_PAD, paddingBottom: Platform.OS === 'ios' ? 100 : 80 },
          ]}
        >
          {filtered.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color="rgba(255,255,255,0.15)" />
              <Text style={styles.emptyText}>No tools found</Text>
            </View>
          )}
          <View style={[styles.twoCol, { maxWidth: availableWidth, alignSelf: 'center' }]}>
            {filtered.map((studio) => (
              <TouchableOpacity
                key={studio.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/studio/${studio.id}`);
                }}
                style={[styles.card, { width: cardW, height: cardH }]}
                activeOpacity={0.88}
              >
                <StudioImage id={studio.id} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.82)']}
                  locations={[0.38, 1]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.cardIconBadge}>
                  <Ionicons name={studio.icon as any} size={14} color="#fff" />
                </View>
                {(studio.badge || studio.isPremium) && (
                  <View style={[
                    styles.badgePill,
                    {
                      backgroundColor:
                        studio.isPremium && !studio.badge
                          ? Colors.brand.gold
                          : badgeColor(studio.badge),
                    },
                  ]}>
                    <Text style={styles.badgeText}>{studio.badge ?? 'PRO'}</Text>
                  </View>
                )}
                <View style={styles.cardFooter}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{studio.title}</Text>
                  <Text style={styles.cardSub} numberOfLines={2}>{studio.subtitle}</Text>
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
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14,
  },
  brandLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2.5,
    color: Colors.brand.gold, marginBottom: 2,
  },
  title: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  filterBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 20,
  },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 14, gap: 10,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#fff' },
  catScroll: { flexGrow: 0, flexShrink: 0 },
  catRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 14,
    minHeight: 54,
    alignItems: 'flex-start',
  },
  catPill: {
    minHeight: 40,
    minWidth: 72,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.bg.card,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catPillActive: { borderColor: 'transparent' },
  catText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    includeFontPadding: false,
  },
  catTextActive: { color: '#000', fontWeight: '700' },
  grid: { paddingTop: 6 },
  twoCol: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: Colors.bg.card },
  cardImage: { width: '100%', height: '100%' },
  cardIconBadge: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    margin: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  badgePill: {
    position: 'absolute', top: 10, right: 10,
    borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2,
  },
  badgeText: { fontSize: 8, fontWeight: '800', color: '#fff' },
  cardFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  cardTitle: { fontSize: 14, lineHeight: 18, fontWeight: '700', color: '#fff', marginBottom: 3 },
  cardSub: { fontSize: 11, lineHeight: 15, color: 'rgba(255,255,255,0.6)' },
  empty: { flex: 1, alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 15 },
});
