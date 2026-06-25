import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { STUDIOS, Studio } from '../../constants/studios';

const CARD_GAP = 10;
const SIDE_PAD = 16;

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardWidth = (width - SIDE_PAD * 2 - CARD_GAP) / 2;
  const cardHeight = cardWidth * 1.38;

  const handleStudio = useCallback(
    (studio: Studio) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/studio/${studio.id}`);
    },
    [router],
  );

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* ── Header ───────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.headerTitle}>AI Studios</Text>
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

        {/* ── Search bar ───────────────────────────────── */}
        <TouchableOpacity style={styles.searchBar} activeOpacity={0.8}>
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" />
          <Text style={styles.searchText}>Search AI studios...</Text>
        </TouchableOpacity>

        {/* ── Scrollable content ───────────────────────── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: Platform.OS === 'ios' ? 100 : 80 },
          ]}
        >
          {/* Section header */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Studios</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {/* 2-column grid */}
          <View style={styles.grid}>
            {STUDIOS.map((studio) => (
              <StudioCard
                key={studio.id}
                studio={studio}
                width={cardWidth}
                height={cardHeight}
                onPress={handleStudio}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* ── Studio Card ─────────────────────────────────────────────────────────── */

interface CardProps {
  studio: Studio;
  width: number;
  height: number;
  onPress: (s: Studio) => void;
}

function StudioCard({ studio, width, height, onPress }: CardProps) {
  return (
    <TouchableOpacity
      onPress={() => onPress(studio)}
      activeOpacity={0.88}
      style={[styles.card, { width, height }]}
    >
      <ImageBackground
        source={{ uri: studio.imageUrl }}
        style={styles.cardBg}
        imageStyle={styles.cardImage}
        resizeMode="cover"
      >
        {/* Dark gradient overlay — bottom-heavy so text is readable */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.75)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Top-left icon badge */}
        <View style={styles.iconBadge}>
          <Ionicons name={studio.icon as any} size={16} color="#fff" />
        </View>

        {/* Premium badge */}
        {studio.isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>PRO</Text>
          </View>
        )}

        {/* Bottom text */}
        <View style={styles.cardFooter}>
          <Text style={styles.cardTitle}>{studio.title}</Text>
          <Text style={styles.cardSubtitle}>{studio.subtitle}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

/* ── Styles ──────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  safeArea: {
    flex: 1,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIDE_PAD,
    paddingTop: 6,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Search */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: SIDE_PAD,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.38)',
  },

  /* Scroll */
  scroll: {
    paddingHorizontal: SIDE_PAD,
  },

  /* Section */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.brand.purpleLight,
  },

  /* Grid */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },

  /* Card */
  card: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.bg.card,
  },
  cardBg: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardImage: {
    borderRadius: Radius.lg,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  premiumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#F59E0B',
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  premiumText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
  },
  cardFooter: {
    padding: 12,
    paddingBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.65)',
  },
});
