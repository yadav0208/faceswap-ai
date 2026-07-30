import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform, Image, StatusBar, ImageSourcePropType, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Colors, Radius } from '../../constants/theme';

const SIDE_PAD = 16;

type FeedItem = {
  id: string;
  studioId: string;
  type: 'ANVA AI' | 'BEFORE / AFTER';
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  animated?: boolean;
  params?: Record<string, string>;
};

const FEED_ITEMS: FeedItem[] = [
  { id: 'ai_portrait', studioId: 'ai_portrait', type: 'ANVA AI', title: 'Midnight Executive',
    subtitle: 'Black tailoring · gold studio light',
    image: require('../../assets/templates/anva-formal-v2.png') as ImageSourcePropType },
  { id: 'birthday', studioId: 'birthday', type: 'ANVA AI', title: 'Royal Birthday',
    subtitle: 'Purple couture · gold celebration',
    image: require('../../assets/templates/anva-birthday-v2.png') as ImageSourcePropType },
  { id: 'futuristic_2026', studioId: 'futuristic_2026', type: 'ANVA AI', title: 'Neon Future',
    subtitle: 'Violet cyber fashion · blue rim light',
    image: require('../../assets/templates/anva-cyber-v2.png') as ImageSourcePropType },
  { id: 'fantasy_armor', studioId: 'fantasy_armor', type: 'ANVA AI', title: 'Golden Warrior',
    subtitle: 'Cinematic armor · castle atmosphere',
    image: require('../../assets/templates/anva-fantasy-v2.png') as ImageSourcePropType },
  { id: 'wedding_look', studioId: 'wedding_look', type: 'ANVA AI', title: 'Ivory Royal',
    subtitle: 'Luxury wedding · warm floral bokeh',
    image: require('../../assets/templates/anva-wedding-v2.png') as ImageSourcePropType },
  { id: 'effect_executive', studioId: 'ai_portrait', type: 'BEFORE / AFTER', title: 'Executive Transform',
    subtitle: 'Casual portrait → premium studio look',
    image: require('../../assets/templates/effects/executive-transform.gif') as ImageSourcePropType,
    animated: true,
    params: { gender: 'male', style: 'premium_effect_executive', effectPreview: 'executive', templateName: 'Executive Transform' } },
  { id: 'effect_neon', studioId: 'futuristic_2026', type: 'BEFORE / AFTER', title: 'Neon Transform',
    subtitle: 'Natural portrait → neon future style',
    image: require('../../assets/templates/effects/neon-transform.gif') as ImageSourcePropType,
    animated: true,
    params: { gender: 'female', style: 'premium_effect_neon', effectPreview: 'neon', templateName: 'Neon Transform' } },
  { id: 'effect_festival', studioId: 'birthday', type: 'BEFORE / AFTER', title: 'Festival Transform',
    subtitle: 'Everyday photo → Raksha Bandhan celebration',
    image: require('../../assets/templates/effects/festival-transform.gif') as ImageSourcePropType,
    animated: true,
    params: { gender: 'male', style: 'premium_festival_kid', effectPreview: 'festival', templateName: 'Festival Transform', audience: 'kids' } },
];

function FeedCard({ item, onPress }: { item: FeedItem; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.92}
      style={styles.card}
    >
      <ExpoImage
        source={item.image}
        style={styles.cardImage}
        contentFit="cover"
        autoplay={item.animated}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.30)', 'rgba(0,0,0,0.80)']}
        locations={[0.2, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Type badge */}
      <View style={[styles.typeBadge, styles.badgeImage]}>
        <Ionicons name={item.animated ? 'repeat' : 'sparkles'} size={10} color="#fff" />
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
  const [preview, setPreview] = useState<FeedItem | null>(null);

  const handlePress = useCallback((item: FeedItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/studio/[id]',
      params: { id: item.studioId, ...item.params },
    });
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
              Image and animated effect templates.{'\n'}See before and after, then add your photo.
            </Text>
          </View>
          <TouchableOpacity style={styles.historyBtn} onPress={() => router.push('/history')}>
            <Ionicons name="archive-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Feed list */}
        <FlatList
          data={FEED_ITEMS}
          numColumns={2}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.feedRow}
          contentContainerStyle={[
            styles.feedContent,
            { paddingBottom: Platform.OS === 'ios' ? 110 : 90 },
          ]}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <FeedCard
              item={item}
              onPress={() => item.animated ? setPreview(item) : handlePress(item)}
            />
          )}
        />
        <Modal
          visible={preview !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setPreview(null)}
        >
          <View style={styles.previewShade}>
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <View>
                  <Text style={styles.previewEyebrow}>BEFORE → AFTER</Text>
                  <Text style={styles.previewTitle}>{preview?.title}</Text>
                </View>
                <TouchableOpacity style={styles.previewClose} onPress={() => setPreview(null)}>
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              {preview && (
                <ExpoImage
                  source={preview.image}
                  style={styles.previewGif}
                  contentFit="cover"
                  autoplay
                />
              )}
              <Text style={styles.previewDescription}>{preview?.subtitle}</Text>
              <TouchableOpacity
                style={styles.useTemplate}
                onPress={() => {
                  if (!preview) return;
                  const selected = preview;
                  setPreview(null);
                  handlePress(selected);
                }}
              >
                <Ionicons name="sparkles" size={17} color="#090909" />
                <Text style={styles.useTemplateText}>Use this template</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  feedRow: {
    gap: 10,
  },

  card: {
    width: '48.5%',
    aspectRatio: 0.704,
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
  previewShade: {
    flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.82)',
  },
  previewCard: {
    width: '100%', maxWidth: 430, padding: 14, borderRadius: Radius.lg,
    backgroundColor: '#151515', borderWidth: 1, borderColor: Colors.border.gold,
  },
  previewHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 4, marginBottom: 12,
  },
  previewEyebrow: {
    color: Colors.brand.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.4,
  },
  previewTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 3 },
  previewClose: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center',
    justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)',
  },
  previewGif: {
    width: '100%', aspectRatio: 0.704, borderRadius: Radius.md,
    overflow: 'hidden', backgroundColor: Colors.bg.card,
  },
  previewDescription: {
    color: 'rgba(255,255,255,0.62)', fontSize: 12, lineHeight: 18,
    marginVertical: 12,
  },
  useTemplate: {
    height: 50, borderRadius: Radius.full, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.brand.gold,
  },
  useTemplateText: { color: '#090909', fontSize: 14, fontWeight: '900' },
});
