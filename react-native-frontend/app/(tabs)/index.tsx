import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  useWindowDimensions, Platform, Image, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Radius } from '../../constants/theme';

const SIDE_PAD = 16;

const FEED_ITEMS = [
  { id: 'dance_video',      type: 'VIDEO' as const, title: 'AI Kids Dance',
    subtitle: "Turn your child's photo into a dance moment",
    imageUrl: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&h=900&fit=crop&q=85' },
  { id: 'ai_portrait',      type: 'IMAGE' as const, title: 'AI Studio Portrait',
    subtitle: 'Professional studio-quality headshots in seconds',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=900&fit=crop&q=85' },
  { id: 'futuristic_2026',  type: 'IMAGE' as const, title: '2026 Futuristic Style',
    subtitle: 'Sleek AI-enhanced portraits with neon vibes',
    imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&h=900&fit=crop&q=85' },
  { id: 'horse_riding',     type: 'VIDEO' as const, title: 'Horse Riding Video',
    subtitle: 'Cinematic clip of you riding through a scene',
    imageUrl: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&h=900&fit=crop&q=85' },
  { id: 'anime_style',      type: 'IMAGE' as const, title: 'Anime / Manga Style',
    subtitle: 'Turn yourself into stunning anime art',
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&h=900&fit=crop&q=85' },
  { id: 'birthday',         type: 'IMAGE' as const, title: 'Birthday Photoshoots',
    subtitle: 'AI birthday portraits & celebration cards',
    imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&h=900&fit=crop&q=85' },
  { id: 'stadium_cam',      type: 'VIDEO' as const, title: 'AI Stadium Cam',
    subtitle: 'Put yourself in a live stadium crowd',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=900&fit=crop&q=85' },
  { id: 'face_swap',        type: 'IMAGE' as const, title: 'Face Swap',
    subtitle: 'Swap faces with anyone in any photo',
    imageUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=900&fit=crop&q=85' },
  { id: 'wedding_look',     type: 'IMAGE' as const, title: 'Wedding Look',
    subtitle: 'Bridal & groom AI photoshoot',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=900&fit=crop&q=85' },
  { id: 'fantasy_armor',    type: 'VIDEO' as const, title: 'Fantasy Armor',
    subtitle: 'Transform into a cinematic fantasy warrior',
    imageUrl: 'https://images.unsplash.com/photo-1535666669445-e8c15cd2e7d9?w=800&h=900&fit=crop&q=85' },
];

type FeedItem = typeof FEED_ITEMS[0];

function FeedCard({ item, cardH, onPress }: { item: FeedItem; cardH: number; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.92}
      style={[styles.card, { height: cardH }]}
    >
      <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.30)', 'rgba(0,0,0,0.80)']}
        locations={[0.2, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Type badge */}
      <View style={[styles.typeBadge, item.type === 'VIDEO' ? styles.badgeVideo : styles.badgeImage]}>
        <Ionicons name={item.type === 'VIDEO' ? 'play' : 'image'} size={10} color="#fff" />
        <Text style={styles.badgeText}>{item.type}</Text>
      </View>
      {/* Content */}
      <View style={styles.cardFooter}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSub}>{item.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function StudioScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardH = Math.min(Math.floor(width * 0.80), 340);

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
            <Text style={styles.brandLabel}>ANVA AI</Text>
            <Text style={styles.heroTitle}>Studio</Text>
            <Text style={styles.heroSub}>
              Cinematic AI transformations.{'\n'}Curated templates. Studio quality.
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
  brandLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    color: Colors.brand.gold,
    marginBottom: 4,
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
