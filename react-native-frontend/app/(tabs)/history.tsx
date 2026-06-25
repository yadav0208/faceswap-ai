import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius } from '../../constants/theme';

// Demo history items
const DEMO_HISTORY = [
  {
    id: '1',
    studio: 'Outfit Studio',
    pose: 'Standing',
    date: '2 hours ago',
    resultUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&q=80',
    status: 'completed',
  },
  {
    id: '2',
    studio: 'Fitness',
    pose: 'Power Flex',
    date: 'Yesterday',
    resultUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
    status: 'completed',
  },
  {
    id: '3',
    studio: 'Professional',
    pose: 'Standing',
    date: '2 days ago',
    resultUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
    status: 'completed',
  },
  {
    id: '4',
    studio: 'Hairstyle',
    pose: 'Front View',
    date: '3 days ago',
    resultUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80',
    status: 'completed',
  },
  {
    id: '5',
    studio: 'Makeup',
    pose: 'Glam',
    date: 'Last week',
    resultUrl: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&q=80',
    status: 'completed',
  },
  {
    id: '6',
    studio: 'Travel',
    pose: 'Beach',
    date: 'Last week',
    resultUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
    status: 'completed',
  },
];

export default function HistoryScreen() {
  const { width } = useWindowDimensions();
  const SIDE_PAD = 16;
  const GAP = 10;
  const cardW = (width - SIDE_PAD * 2 - GAP) / 2;
  const cardH = cardW * 1.45;
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Looks</Text>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="filter-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Generated', value: '24' },
            { label: 'Saved', value: '12' },
            { label: 'Shared', value: '6' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {DEMO_HISTORY.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={56} color="rgba(255,255,255,0.15)" />
            <Text style={styles.emptyTitle}>No looks yet</Text>
            <Text style={styles.emptySub}>Generate your first AI look to see it here</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.grid,
              {
                paddingHorizontal: SIDE_PAD,
                paddingBottom: Platform.OS === 'ios' ? 100 : 80,
              },
            ]}
          >
            <View style={styles.twoCol}>
              {DEMO_HISTORY.map((item) => (
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
                    colors={['transparent', 'rgba(0,0,0,0.75)']}
                    locations={[0.45, 1]}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Heart */}
                  <TouchableOpacity
                    style={styles.heartBtn}
                    onPress={() => setLiked((p) => ({ ...p, [item.id]: !p[item.id] }))}
                  >
                    <Ionicons
                      name={liked[item.id] ? 'heart' : 'heart-outline'}
                      size={18}
                      color={liked[item.id] ? '#EF4444' : '#fff'}
                    />
                  </TouchableOpacity>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardStudio}>{item.studio}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#fff' },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.md,
    alignItems: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statValue: { fontSize: 22, fontWeight: '700', color: Colors.brand.purpleLight },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  grid: { paddingTop: 4 },
  twoCol: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.bg.card,
  },
  heartBtn: {
    position: 'absolute',
    top: 10, right: 10,
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 10,
  },
  cardStudio: { fontSize: 13, fontWeight: '700', color: '#fff' },
  cardDate: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 100,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  emptySub: { fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center', paddingHorizontal: 40 },
});
