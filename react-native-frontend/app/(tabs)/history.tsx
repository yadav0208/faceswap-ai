import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, useWindowDimensions, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius } from '../../constants/theme';

const FILTER_TABS = ['All', 'Videos', 'Photos', 'Occasions'];

// Demo creations matching Fun With AI content
const DEMO_HISTORY = [
  {
    id: '1', type: 'video', tool: 'Horse Riding Video', date: '2 hours ago',
    resultUrl: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=400&q=80',
    duration: '6s',
  },
  {
    id: '2', type: 'photo', tool: 'Birthday Photoshoot', date: 'Yesterday',
    resultUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    duration: null,
  },
  {
    id: '3', type: 'photo', tool: 'Trending AI Photo Styles', date: '2 days ago',
    resultUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80',
    duration: null,
  },
  {
    id: '4', type: 'video', tool: 'AI Stadium Cam', date: '3 days ago',
    resultUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&q=80',
    duration: '8s',
  },
  {
    id: '5', type: 'photo', tool: 'Anime Style', date: 'Last week',
    resultUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
    duration: null,
  },
  {
    id: '6', type: 'video', tool: 'Viral Dance Video', date: 'Last week',
    resultUrl: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=400&q=80',
    duration: '5s',
  },
];

export default function HistoryScreen() {
  const { width } = useWindowDimensions();
  const SIDE_PAD = 16;
  const GAP = 10;
  const cardW = (width - SIDE_PAD * 2 - GAP) / 2;
  const cardH = cardW * 1.45;
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = DEMO_HISTORY.filter((item) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Videos') return item.type === 'video';
    if (activeFilter === 'Photos') return item.type === 'photo';
    if (activeFilter === 'Occasions') return ['Birthday Photoshoot', 'Wedding Look'].includes(item.tool);
    return true;
  });

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Creations</Text>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="filter-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Generated', value: '24', icon: 'sparkles' },
            { label: 'Videos',    value: '16', icon: 'film' },
            { label: 'Shared',    value: '9',  icon: 'share-social' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Ionicons name={stat.icon as any} size={16} color={Colors.brand.purpleLight} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Filter tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTER_TABS.map((tab) => {
            const active = tab === activeFilter;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveFilter(tab)}
                style={[styles.filterTab, active && styles.filterTabActive]}
                activeOpacity={0.8}
              >
                {active && (
                  <LinearGradient
                    colors={[Colors.brand.purple, Colors.brand.purpleLight]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="film-outline" size={56} color="rgba(255,255,255,0.15)" />
            <Text style={styles.emptyTitle}>No creations yet</Text>
            <Text style={styles.emptySub}>Generate your first AI video or image to see it here</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.grid,
              { paddingHorizontal: SIDE_PAD, paddingBottom: Platform.OS === 'ios' ? 100 : 80 },
            ]}
          >
            <View style={styles.twoCol}>
              {filtered.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.card, { width: cardW, height: cardH }]}
                  activeOpacity={0.88}
                >
                  <Image
                    source={{ uri: item.resultUrl }}
                    style={StyleSheet.absoluteFillObject as any}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.78)']}
                    locations={[0.42, 1]}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Video duration badge */}
                  {item.duration && (
                    <View style={styles.durationBadge}>
                      <Ionicons name="play" size={8} color="#fff" />
                      <Text style={styles.durationText}>{item.duration}</Text>
                    </View>
                  )}
                  {/* Heart */}
                  <TouchableOpacity
                    style={styles.heartBtn}
                    onPress={() => setLiked((p) => ({ ...p, [item.id]: !p[item.id] }))}
                  >
                    <Ionicons
                      name={liked[item.id] ? 'heart' : 'heart-outline'}
                      size={17}
                      color={liked[item.id] ? '#EF4444' : '#fff'}
                    />
                  </TouchableOpacity>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardTool}>{item.tool}</Text>
                    <Text style={styles.cardDate}>{item.date}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#fff' },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 14 },
  statCard: {
    flex: 1, backgroundColor: Colors.bg.card, borderRadius: Radius.md,
    alignItems: 'center', paddingVertical: 12, gap: 3,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  statValue: { fontSize: 20, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },

  filterRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 14 },
  filterTab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
    overflow: 'hidden',
  },
  filterTabActive: { borderColor: 'transparent' },
  filterText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  filterTextActive: { color: '#fff' },

  grid: { paddingTop: 4 },
  twoCol: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: Colors.bg.card },
  durationBadge: {
    position: 'absolute', top: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 3,
  },
  durationText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  heartBtn: {
    position: 'absolute', top: 10, right: 10,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 },
  cardTool: { fontSize: 12, fontWeight: '700', color: '#fff' },
  cardDate: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 12, paddingBottom: 100,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  emptySub: { fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center', paddingHorizontal: 40 },
});
