import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Platform, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius } from '../../constants/theme';
import { useFocusEffect } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  getSavedCreations,
  removeSavedCreation,
  SavedCreation,
} from '../../services/savedCreations';
import { saveMediaToDevice } from '../../services/mediaDownload';

const FILTER_TABS = ['All', 'Videos', 'Photos', 'Occasions'];

function SavedVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
  });
  return (
    <VideoView
      player={player}
      style={styles.cardImage}
      pointerEvents="none"
      contentFit="cover"
    />
  );
}

function PreviewVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
    instance.play();
  });
  return <VideoView player={player} style={styles.previewMedia} nativeControls contentFit="contain" />;
}

export default function HistoryScreen() {
  const SIDE_PAD = 16;
  const [creations, setCreations] = useState<SavedCreation[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [preview, setPreview] = useState<SavedCreation | null>(null);
  const [savingToGallery, setSavingToGallery] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getSavedCreations().then((items) => {
        if (active) setCreations(items);
      });
      return () => { active = false; };
    }, []),
  );

  const filtered = creations.filter((item) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Videos') return item.type === 'video';
    if (activeFilter === 'Photos') return item.type === 'photo';
    if (activeFilter === 'Occasions') return ['Royal Birthday', 'Ivory Royal'].includes(item.title);
    return true;
  });

  async function removeCreation(id: string) {
    await removeSavedCreation(id);
    setCreations((items) => items.filter((item) => item.id !== id));
    if (preview?.id === id) setPreview(null);
  }

  async function savePreviewToGallery() {
    if (!preview || savingToGallery) return;
    setSavingToGallery(true);
    try {
      await saveMediaToDevice(preview.uri, preview.type);
      Alert.alert(
        Platform.OS === 'web' ? 'Download started' : 'Saved to gallery',
        Platform.OS === 'web'
          ? 'Your browser is downloading the creation.'
          : 'The creation is now in your Anva AI gallery album.',
      );
    } catch (error: any) {
      Alert.alert('Could not save', error.message || 'Please try again.');
    } finally {
      setSavingToGallery(false);
    }
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandLabel}>ANVA AI</Text>
            <Text style={styles.title}>My Studio</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="filter-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Saved', value: String(creations.length), icon: 'bookmark' },
            { label: 'Photos', value: String(creations.filter((item) => item.type === 'photo').length), icon: 'images' },
            { label: 'Videos', value: String(creations.filter((item) => item.type === 'video').length), icon: 'film' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Ionicons name={stat.icon as any} size={16} color={Colors.brand.gold} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Filter tabs */}
        <ScrollView
          horizontal
          style={styles.filterScroll}
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
                    colors={[Colors.brand.goldDark, Colors.brand.gold]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Text
                  allowFontScaling={false}
                  style={[styles.filterText, active && styles.filterTextActive]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="film-outline" size={56} color="rgba(255,255,255,0.15)" />
            <Text style={styles.emptyTitle}>No creations yet</Text>
            <Text style={styles.emptySub}>
              Generate your first AI image or video to see it here
            </Text>
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
                  style={styles.card}
                  activeOpacity={0.88}
                  onPress={() => setPreview(item)}
                >
                  {item.type === 'video'
                    ? <SavedVideo uri={item.uri} />
                    : (
                      <Image
                        source={{ uri: item.uri }}
                        style={styles.cardImage}
                        resizeMode="cover"
                      />
                    )}
                  {item.type === 'video' && (
                    <View style={styles.durationBadge}>
                      <Ionicons name="play" size={11} color="#fff" />
                      <Text style={styles.durationText}>VIDEO</Text>
                    </View>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.78)']}
                    locations={[0.42, 1]}
                    style={StyleSheet.absoluteFill}
                  />
                  <TouchableOpacity
                    style={styles.heartBtn}
                    onPress={() => removeCreation(item.id)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={17}
                      color="#fff"
                    />
                  </TouchableOpacity>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardTool} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.cardDate} numberOfLines={1}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>

      <Modal
        visible={preview !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreview(null)}
      >
        <View style={styles.previewShade}>
          <View style={styles.previewPanel}>
            <View style={styles.previewHeader}>
              <View style={styles.previewHeading}>
                <Text style={styles.previewEyebrow}>
                  {preview?.type === 'video' ? 'VIDEO PREVIEW' : 'IMAGE PREVIEW'}
                </Text>
                <Text style={styles.previewTitle} numberOfLines={1}>{preview?.title}</Text>
              </View>
              <TouchableOpacity style={styles.previewClose} onPress={() => setPreview(null)}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {preview && (
              preview.type === 'video'
                ? <PreviewVideo uri={preview.uri} />
                : <Image source={{ uri: preview.uri }} style={styles.previewMedia} resizeMode="contain" />
            )}

            <TouchableOpacity
              style={styles.galleryButton}
              onPress={savePreviewToGallery}
              disabled={savingToGallery}
            >
              {savingToGallery
                ? <ActivityIndicator size="small" color="#090909" />
                : <Ionicons name="download-outline" size={20} color="#090909" />}
              <Text style={styles.galleryButtonText}>
                {Platform.OS === 'web' ? 'Download' : 'Save to Gallery'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.previewDelete}
              onPress={() => preview && removeCreation(preview.id)}
            >
              <Ionicons name="trash-outline" size={17} color="#ff7777" />
              <Text style={styles.previewDeleteText}>Remove from My Studio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 20,
  },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 14 },
  statCard: {
    flex: 1, backgroundColor: Colors.bg.card, borderRadius: Radius.md,
    alignItems: 'center', paddingVertical: 12, gap: 3,
    borderWidth: 1, borderColor: Colors.border.gold,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  filterScroll: { flexGrow: 0, flexShrink: 0 },
  filterRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 14,
    minHeight: 52,
    alignItems: 'flex-start',
  },
  filterTab: {
    minHeight: 38, minWidth: 72,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full,
    backgroundColor: Colors.bg.card,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
    overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  filterTabActive: { borderColor: 'transparent' },
  filterText: {
    fontSize: 13, lineHeight: 18, fontWeight: '600',
    color: 'rgba(255,255,255,0.5)', includeFontPadding: false,
  },
  filterTextActive: { color: '#000', fontWeight: '700' },
  grid: { paddingTop: 4 },
  twoCol: {
    width: '100%', alignSelf: 'center', flexDirection: 'row',
    flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10,
  },
  card: {
    width: '48.5%', aspectRatio: 0.69,
    borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: Colors.bg.card,
  },
  cardImage: { width: '100%', height: '100%' },
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
  emptySub: {
    fontSize: 13, color: 'rgba(255,255,255,0.35)',
    textAlign: 'center', paddingHorizontal: 40,
  },
  previewShade: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  previewPanel: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '92%',
    padding: 14,
    borderRadius: Radius.xl,
    backgroundColor: '#111113',
    borderWidth: 1,
    borderColor: Colors.border.gold,
    gap: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewHeading: { flex: 1, paddingRight: 12 },
  previewEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.7,
    color: Colors.brand.gold,
  },
  previewTitle: { marginTop: 3, fontSize: 19, fontWeight: '800', color: '#fff' },
  previewClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  previewMedia: {
    width: '100%',
    height: Platform.OS === 'web' ? 510 : 460,
    maxHeight: '68%',
    borderRadius: Radius.lg,
    backgroundColor: '#050505',
  },
  galleryButton: {
    minHeight: 52,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  galleryButtonText: { fontSize: 15, fontWeight: '800', color: '#090909' },
  previewDelete: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  previewDeleteText: { fontSize: 12, fontWeight: '600', color: '#ff7777' },
});
