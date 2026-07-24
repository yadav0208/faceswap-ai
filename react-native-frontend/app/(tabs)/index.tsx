import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  useWindowDimensions, Platform, Image, StatusBar, ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Radius } from '../../constants/theme';

const SIDE_PAD = 16;

// The five curated target templates used by the Magic Hour face-swap flow.
const FEED_ITEMS = [
  { id: 'ai_portrait', type: 'MAGIC HOUR' as const, title: 'Midnight Executive',
    subtitle: 'Black tailoring · gold studio light',
    image: require('../../assets/templates/anva-formal-v2.png') as ImageSourcePropType },
  { id: 'birthday', type: 'MAGIC HOUR' as const, title: 'Royal Birthday',
    subtitle: 'Purple couture · gold celebration',
    image: require('../../assets/templates/anva-birthday-v2.png') as ImageSourcePropType },
  { id: 'futuristic_2026', type: 'MAGIC HOUR' as const, title: 'Neon Future',
    subtitle: 'Violet cyber fashion · blue rim light',
    image: require('../../assets/templates/anva-cyber-v2.png') as ImageSourcePropType },
  { id: 'fantasy_armor', type: 'MAGIC HOUR' as const, title: 'Golden Warrior',
    subtitle: 'Cinematic armor · castle atmosphere',
    image: require('../../assets/templates/anva-fantasy-v2.png') as ImageSourcePropType },
  { id: 'wedding_look', type: 'MAGIC HOUR' as const, title: 'Ivory Royal',
    subtitle: 'Luxury wedding · warm floral bokeh',
    image: require('../../assets/templates/anva-wedding-v2.png') as ImageSourcePropType },
];

type FeedItem = typeof FEED_ITEMS[0];

function FeedCard({ item, cardH, onPress }: { item: FeedItem; cardH: number; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.92}
      style={[styles.card, { height: cardH }]}
    >
      <Image source={item.image} style={styles.cardImage} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.30)', 'rgba(0,0,0,0.80)']}
        locations={[0.2, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Type badge */}
      <View style={[styles.typeBadge, styles.badgeImage]}>
        <Ionicons name="sparkles" size={10} color="#fff" />
        <Text style={styles.badgeText}>{item.type}</Text>
      </View>
      {/* Content */}
      <View style={styles.cardFooter}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardSub} numberOfLines={2}>{item.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function StudioScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardH = Math.min(Math.max(Math.floor(width * 0.62), 230), 292);

  const handlePress = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/studio/${id}`);
  }, [router]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.brandRow}>
              <Image
                source={require('../../assets/brand/anva-mark.png')}
                style={styles.brandMark}
                resizeMode="contain"
              />
              <Text style={styles.brandLabel}>ANVA AI</Text>
            </View>
            <Text style={styles.heroTitle}>Studio</Text>
            <Text style={styles.heroSub}>
              Five curated Magic Hour looks.{'\n'}Choose a template and add your photo.
            </Text>
          </View>
          <TouchableOpacity style={styles.historyBtn} onPress={() => router.push('/history')}>
            <Ionicons name="archive-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Feed list */}
        <FlatList
          data={FEED_ITEMS}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.feedContent,
            { paddingBottom: Platform.OS === 'ios' ? 110 : 90 },
          ]}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          renderItem={({ item }) => (
            <FeedCard item={item} cardH={cardH} onPress={() => handlePress(item.id)} />
          )}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: SIDE_PAD,
    paddingTop: 4,
    paddingBottom: 20,
  },
  headerLeft: { flex: 1, paddingRight: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  brandMark: { width: 34, height: 34, borderRadius: 8 },
  brandLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    color: Colors.brand.gold,
    marginBottom: 0,
  },
  heroTitle: {
    fontSize: 44,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1.5,
    lineHeight: 48,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.50)',
    lineHeight: 21,
  },
  historyBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    marginTop: 32,
  },

  feedContent: {
    paddingHorizontal: SIDE_PAD,
  },

  card: {
    width: '100%',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.bg.card,
  },
  cardImage: { width: '100%', height: '100%' },
  typeBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  badgeVideo: { backgroundColor: Colors.brand.gold },
  badgeImage: {
    backgroundColor: 'rgba(40,40,40,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.45)',
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  cardFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
    paddingBottom: 20,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  cardSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.68)',
    lineHeight: 20,
  },
});
