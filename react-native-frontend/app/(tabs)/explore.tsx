import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, TextInput, Platform, ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Radius } from '../../constants/theme';

type TalkingTemplate = {
  id: string;
  title: string;
  subtitle: string;
  gender: 'male' | 'female';
  audience: 'adult' | 'kids';
  motion: string;
  voiceName: string;
  badge?: string;
  image: ImageSourcePropType;
};

const TALKING_TEMPLATES: TalkingTemplate[] = [
  {
    id: 'male_news',
    title: 'News Presenter',
    subtitle: 'Professional delivery with natural lip-sync',
    gender: 'male',
    audience: 'adult',
    motion: 'motion_confident',
    voiceName: 'Barack Obama',
    badge: 'POPULAR',
    image: require('../../assets/templates/talking/news-presenter.png'),
  },
  {
    id: 'female_guide',
    title: 'Friendly Guide',
    subtitle: 'Warm conversational movement and expression',
    gender: 'female',
    audience: 'adult',
    motion: 'motion_smile',
    voiceName: 'Taylor Swift',
    badge: 'NEW',
    image: require('../../assets/templates/talking/friendly-guide.png'),
  },
  {
    id: 'male_podcast',
    title: 'Podcast Storyteller',
    subtitle: 'Expressive narration with cinematic movement',
    gender: 'male',
    audience: 'adult',
    motion: 'motion_cinematic',
    voiceName: 'Joe Rogan',
    badge: 'HOT',
    image: require('../../assets/templates/talking/podcast-storyteller.png'),
  },
  {
    id: 'female_product',
    title: 'Product Host',
    subtitle: 'Energetic presenter motion for demos and ads',
    gender: 'female',
    audience: 'adult',
    motion: 'motion_subtle',
    voiceName: 'Taylor Swift',
    image: require('../../assets/templates/talking/product-host.png'),
  },
  {
    id: 'kids_storytime',
    title: 'Kids Storytime',
    subtitle: 'Cheerful storytelling with clear child-safe motion',
    gender: 'male',
    audience: 'kids',
    motion: 'motion_smile',
    voiceName: 'SpongeBob',
    badge: 'KIDS',
    image: require('../../assets/templates/talking/kids-storytime.png'),
  },
  {
    id: 'kids_learning',
    title: 'Kids Learning Host',
    subtitle: 'Friendly educational speech and natural lip-sync',
    gender: 'female',
    audience: 'kids',
    motion: 'motion_subtle',
    voiceName: 'SpongeBob',
    badge: 'KIDS',
    image: require('../../assets/templates/talking/kids-learning.png'),
  },
];

const FILTERS = ['All', 'Man', 'Woman', 'Kids'] as const;
type Filter = typeof FILTERS[number];

export default function ExploreScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [search, setSearch] = useState('');

  const sidePad = 16;

  const templates = useMemo(() => TALKING_TEMPLATES.filter((template) => {
    const genderMatch =
      activeFilter === 'All'
      || (activeFilter === 'Man' && template.gender === 'male' && template.audience === 'adult')
      || (activeFilter === 'Woman' && template.gender === 'female' && template.audience === 'adult')
      || (activeFilter === 'Kids' && template.audience === 'kids');
    const query = search.trim().toLowerCase();
    return genderMatch && (
      !query
      || template.title.toLowerCase().includes(query)
      || template.subtitle.toLowerCase().includes(query)
    );
  }), [activeFilter, search]);

  function openTemplate(template: TalkingTemplate) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/studio/[id]',
      params: {
        id: 'talking_photo',
        gender: template.gender,
        motion: template.motion,
        templateId: template.id,
        templateName: template.title,
        voiceName: template.voiceName,
        audience: template.audience,
      },
    });
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brandLabel}>ANVA AI</Text>
            <Text style={styles.title}>Talking Photo</Text>
            <Text style={styles.headerSub}>Choose a character-compatible motion template</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="mic" size={21} color={Colors.brand.gold} />
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={17} color="rgba(255,255,255,0.4)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search talking templates…"
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.searchInput}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={17} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((filter) => {
            const selected = filter === activeFilter;
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveFilter(filter);
                }}
                style={[styles.filterPill, selected && styles.filterPillSelected]}
              >
                {selected && (
                  <LinearGradient
                    colors={[Colors.brand.goldDark, Colors.brand.gold]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Ionicons
                  name={
                    filter === 'Man' ? 'male'
                    : filter === 'Woman' ? 'female'
                    : filter === 'Kids' ? 'happy'
                    : 'apps'
                  }
                  size={15}
                  color={selected ? '#090909' : 'rgba(255,255,255,0.52)'}
                />
                <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.grid,
            {
              paddingHorizontal: sidePad,
              paddingBottom: Platform.OS === 'ios' ? 110 : 90,
            },
          ]}
        >
          <View style={styles.twoCol}>
            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                onPress={() => openTemplate(template)}
                style={styles.card}
                activeOpacity={0.88}
              >
                <Image source={template.image} style={styles.cardImage} resizeMode="cover" />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.88)']}
                  locations={[0.35, 1]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.genderBadge}>
                  <Ionicons
                    name={template.gender === 'male' ? 'male' : 'female'}
                    size={12}
                    color="#fff"
                  />
                  <Text style={styles.genderBadgeText}>
                    {template.gender === 'male' ? 'MAN' : 'WOMAN'}
                  </Text>
                </View>
                {template.badge && (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>{template.badge}</Text>
                  </View>
                )}
                <View style={styles.cardFooter}>
                  <View style={styles.talkingLabel}>
                    <Ionicons name="mic" size={11} color={Colors.brand.gold} />
                    <Text style={styles.talkingLabelText}>AI TALKING PHOTO</Text>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={2}>{template.title}</Text>
                  <Text style={styles.cardSub} numberOfLines={2}>{template.subtitle}</Text>
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
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
  },
  brandLabel: {
    fontSize: 10, fontWeight: '800', letterSpacing: 2.5,
    color: Colors.brand.gold, marginBottom: 3,
  },
  title: { fontSize: 31, lineHeight: 36, fontWeight: '800', color: '#fff', letterSpacing: -0.7 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.43)', marginTop: 4 },
  headerIcon: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(201,168,76,0.10)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.24)',
  },
  searchWrap: {
    width: 'auto', minHeight: 54,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 13,
    backgroundColor: Colors.bg.card, borderRadius: Radius.full,
    paddingHorizontal: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: { flex: 1, minHeight: 52, fontSize: 15, color: '#fff', paddingVertical: 0 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 14 },
  filterPill: {
    flex: 1, minWidth: 0, height: 40, borderRadius: Radius.full, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: Colors.bg.card,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
  },
  filterPillSelected: { borderColor: 'transparent' },
  filterText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.52)' },
  filterTextSelected: { color: '#090909' },
  grid: { paddingTop: 2 },
  twoCol: {
    width: '100%', alignSelf: 'center',
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between', rowGap: 10,
  },
  card: {
    width: '48.5%', aspectRatio: 0.704,
    borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: Colors.bg.card,
  },
  cardImage: { width: '100%', height: '100%' },
  genderBadge: {
    position: 'absolute', top: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.58)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  genderBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  statusBadge: {
    position: 'absolute', top: 10, right: 10,
    borderRadius: 5, paddingHorizontal: 6, paddingVertical: 4,
    backgroundColor: Colors.brand.gold,
  },
  statusBadgeText: { color: '#090909', fontSize: 8, fontWeight: '900' },
  cardFooter: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12 },
  talkingLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 5 },
  talkingLabelText: {
    color: Colors.brand.gold, fontSize: 8, fontWeight: '900', letterSpacing: 0.7,
  },
  cardTitle: { color: '#fff', fontSize: 15, lineHeight: 19, fontWeight: '800', marginBottom: 3 },
  cardSub: { color: 'rgba(255,255,255,0.60)', fontSize: 10, lineHeight: 14 },
});
