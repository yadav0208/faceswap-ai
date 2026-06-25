import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { STUDIOS } from '../../constants/studios';

const { width: SW } = Dimensions.get('window');

/* Pose options for each studio */
const POSES: Record<string, { id: string; label: string; imageUrl: string }[]> = {
  fitness: [
    { id: 'gym_power', label: 'Power Flex', imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300&q=80' },
    { id: 'gym_lean', label: 'Lean Stance', imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=80' },
    { id: 'gym_run', label: 'Running', imageUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=300&q=80' },
    { id: 'gym_yoga', label: 'Yoga Pose', imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300&q=80' },
  ],
  outfit: [
    { id: 'out_stand', label: 'Standing', imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&q=80' },
    { id: 'out_walk', label: 'Walking', imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=80' },
    { id: 'out_sit', label: 'Sitting', imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&q=80' },
    { id: 'out_pose', label: 'Editorial', imageUrl: 'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?w=300&q=80' },
  ],
  hairstyle: [
    { id: 'hair_front', label: 'Front View', imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&q=80' },
    { id: 'hair_side', label: 'Side View', imageUrl: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=300&q=80' },
    { id: 'hair_back', label: 'Back View', imageUrl: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=300&q=80' },
    { id: 'hair_top', label: 'Top Angle', imageUrl: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=300&q=80' },
  ],
  makeup: [
    { id: 'mk_glam', label: 'Glam', imageUrl: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=300&q=80' },
    { id: 'mk_natural', label: 'Natural', imageUrl: 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=300&q=80' },
    { id: 'mk_bold', label: 'Bold Lip', imageUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=300&q=80' },
    { id: 'mk_smokey', label: 'Smokey Eye', imageUrl: 'https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=300&q=80' },
  ],
  professional: [
    { id: 'pro_stand', label: 'Standing', imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80' },
    { id: 'pro_desk', label: 'At Desk', imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300&q=80' },
    { id: 'pro_conf', label: 'Conference', imageUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=300&q=80' },
    { id: 'pro_arms', label: 'Arms Crossed', imageUrl: 'https://images.unsplash.com/photo-1580894742597-87bc8789db3d?w=300&q=80' },
  ],
  travel: [
    { id: 'tr_street', label: 'Street', imageUrl: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=300&q=80' },
    { id: 'tr_beach', label: 'Beach', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&q=80' },
    { id: 'tr_mtn', label: 'Mountains', imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300&q=80' },
    { id: 'tr_city', label: 'City View', imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=300&q=80' },
  ],
  wedding: [
    { id: 'wed_stand', label: 'Bride Stand', imageUrl: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=300&q=80' },
    { id: 'wed_walk', label: 'Aisle Walk', imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=300&q=80' },
    { id: 'wed_groom', label: 'Groom Pose', imageUrl: 'https://images.unsplash.com/photo-1553254718-bfdc69c04f88?w=300&q=80' },
    { id: 'wed_couple', label: 'Couple', imageUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=300&q=80' },
  ],
  avatar: [
    { id: 'av_cyber', label: 'Cyberpunk', imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300&q=80' },
    { id: 'av_anime', label: 'Anime Style', imageUrl: 'https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=300&q=80' },
    { id: 'av_3d', label: '3D Render', imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&q=80' },
    { id: 'av_neon', label: 'Neon Art', imageUrl: 'https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=300&q=80' },
  ],
};

export default function StudioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const studio = STUDIOS.find((s) => s.id === id);
  const poses = POSES[id ?? ''] ?? [];

  const [selectedPose, setSelectedPose] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUri, setResultUri] = useState<string | null>(null);

  if (!studio) {
    return (
      <View style={styles.notFound}>
        <Text style={{ color: '#fff' }}>Studio not found</Text>
      </View>
    );
  }

  async function pickPhoto() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow access to your photo library.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.9,
    });
    if (!res.canceled) {
      setPhotoUri(res.assets[0].uri);
      setResultUri(null);
    }
  }

  async function takePhoto() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow camera access.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.9,
    });
    if (!res.canceled) {
      setPhotoUri(res.assets[0].uri);
      setResultUri(null);
    }
  }

  async function generate() {
    if (!photoUri || !selectedPose) {
      Alert.alert('Almost there!', 'Please upload a photo and select a pose style.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGenerating(true);
    setProgress(5);

    // Animate progress bar while waiting
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 88) { clearInterval(interval); return 88; }
        return p + Math.random() * 8;
      });
    }, 800);

    try {
      // Use machine IP so the phone can reach the backend on LAN
      const API = 'http://10.159.49.23:8000';

      const formData = new FormData();
      formData.append('file', { uri: photoUri, type: 'image/jpeg', name: 'upload.jpg' } as any);
      formData.append('pose_template_id', '1');   // DB template id
      formData.append('studio_id', studio!.id);   // e.g. "fitness"
      formData.append('pose_id', selectedPose);   // e.g. "gym_power"
      formData.append('gender', 'auto');
      formData.append('style_prompt', `${studio!.title} ${selectedPose} style`);

      const resp = await fetch(`${API}/api/generate`, {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${resp.status}`);
      }

      const data = await resp.json();
      clearInterval(interval);
      setProgress(90);

      // Poll until completed
      let tries = 0;
      const poll = async () => {
        tries++;
        try {
          const s = await fetch(`${API}/api/generate/${data.id}/status`).then(r => r.json());
          setProgress(s.progress ?? 90);

          if (s.status === 'completed' && s.result_image_url) {
            setProgress(100);
            setResultUri(`${API}${s.result_image_url}?t=${Date.now()}`);
            setGenerating(false);
          } else if (s.status === 'failed') {
            throw new Error(s.error_message || 'Generation failed');
          } else if (tries > 60) {
            throw new Error('Timed out. Please try again.');
          } else {
            setTimeout(poll, 1500);
          }
        } catch (e: any) {
          setGenerating(false);
          Alert.alert('Error', e.message || 'Something went wrong');
        }
      };
      poll();

    } catch (e: any) {
      clearInterval(interval);
      setGenerating(false);
      Alert.alert('Generation Failed', e.message || 'Could not connect to server. Make sure backend is running.');
    }
  }

  return (
    <View style={styles.root}>
      {/* ── Header image hero ─────────────────────────────── */}
      <View style={styles.hero}>
        <Image source={{ uri: studio.imageUrl }} style={styles.heroImage} resizeMode="cover" />
        <LinearGradient
          colors={['rgba(13,13,20,0)', 'rgba(13,13,20,0.6)', '#0D0D14']}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
        {/* Back button */}
        <SafeAreaView edges={['top']} style={styles.heroTopBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn}>
            <Ionicons name="heart-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>

        <View style={styles.heroFooter}>
          <View style={styles.iconBadge}>
            <Ionicons name={studio.icon as any} size={18} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>{studio.title}</Text>
          <Text style={styles.heroSub}>{studio.subtitle}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Upload photo ───────────────────────────────── */}
        <Text style={styles.sectionLabel}>Upload Your Photo</Text>

        <View style={styles.uploadRow}>
          {photoUri ? (
            <TouchableOpacity onPress={pickPhoto} style={styles.photoPreview}>
              <Image source={{ uri: photoUri }} style={styles.previewImg} resizeMode="cover" />
              <View style={styles.changeOverlay}>
                <Ionicons name="camera" size={20} color="#fff" />
                <Text style={styles.changeText}>Change</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={pickPhoto} style={styles.uploadBox}>
              <LinearGradient
                colors={['rgba(124,58,237,0.12)', 'rgba(124,58,237,0.04)']}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="image-outline" size={32} color={Colors.brand.purpleLight} />
              <Text style={styles.uploadTitle}>Choose Photo</Text>
              <Text style={styles.uploadHint}>From library</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={takePhoto} style={styles.cameraBox}>
            <LinearGradient
              colors={['rgba(124,58,237,0.12)', 'rgba(124,58,237,0.04)']}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="camera-outline" size={32} color={Colors.brand.purpleLight} />
            <Text style={styles.uploadTitle}>Camera</Text>
            <Text style={styles.uploadHint}>Take a selfie</Text>
          </TouchableOpacity>
        </View>

        {/* ── Pose selector ─────────────────────────────── */}
        <Text style={styles.sectionLabel}>Choose Style</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.poseRow}
        >
          {poses.map((pose) => {
            const sel = selectedPose === pose.id;
            return (
              <TouchableOpacity
                key={pose.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedPose(pose.id);
                  setResultUri(null);
                }}
                style={[styles.poseCard, sel && styles.poseCardSel]}
                activeOpacity={0.85}
              >
                <Image
                  source={{ uri: pose.imageUrl }}
                  style={styles.poseImg}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.75)']}
                  style={StyleSheet.absoluteFill}
                />
                {sel && (
                  <LinearGradient
                    colors={[Colors.brand.purple, Colors.brand.purpleLight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.poseSelRing}
                  />
                )}
                <Text style={styles.poseLabel}>{pose.label}</Text>
                {sel && (
                  <View style={styles.poseCheck}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Result preview ────────────────────────────── */}
        {resultUri && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionLabel}>Your Generated Look ✨</Text>
            <View style={styles.resultCard}>
              <Image source={{ uri: resultUri }} style={styles.resultImg} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.resultGradient}
              />
              <View style={styles.resultActions}>
                <TouchableOpacity style={styles.resultBtn}>
                  <Ionicons name="download-outline" size={20} color="#fff" />
                  <Text style={styles.resultBtnText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.resultBtn}>
                  <Ionicons name="share-outline" size={20} color="#fff" />
                  <Text style={styles.resultBtnText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.resultBtn, styles.resultBtnPrimary]}>
                  <Ionicons name="refresh-outline" size={20} color="#fff" />
                  <Text style={styles.resultBtnText}>Regenerate</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Generate CTA ──────────────────────────────────── */}
      {!resultUri && (
        <View style={styles.ctaContainer}>
          <BlurView tint="dark" intensity={85} style={StyleSheet.absoluteFill} />
          {generating ? (
            <View style={styles.generatingRow}>
              <ActivityIndicator color={Colors.brand.purple} size="small" />
              <Text style={styles.generatingText}>
                Generating... {Math.round(progress)}%
              </Text>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={[Colors.brand.purple, Colors.brand.purpleLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={generate}
              style={[
                styles.ctaBtn,
                (!photoUri || !selectedPose) && styles.ctaBtnDisabled,
              ]}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={
                  photoUri && selectedPose
                    ? [Colors.brand.purple, Colors.brand.purpleLight]
                    : ['rgba(124,58,237,0.3)', 'rgba(155,92,246,0.3)']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="sparkles" size={20} color="#fff" />
              <Text style={styles.ctaLabel}>Generate My Look</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg.primary },

  /* Hero */
  hero: { width: SW, height: 260, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFooter: { position: 'absolute', bottom: 16, left: 16 },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroTitle: { fontSize: 26, fontWeight: '700', color: '#fff' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },

  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 8,
  },

  /* Upload */
  uploadRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  uploadBox: {
    flex: 1,
    height: 130,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(124,58,237,0.4)',
    overflow: 'hidden',
    gap: 6,
  },
  cameraBox: {
    flex: 1,
    height: 130,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(124,58,237,0.4)',
    overflow: 'hidden',
    gap: 6,
  },
  uploadTitle: { fontSize: 14, fontWeight: '600', color: '#fff' },
  uploadHint: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  photoPreview: {
    flex: 2,
    height: 130,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  previewImg: { width: '100%', height: '100%' },
  changeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  changeText: { fontSize: 12, color: '#fff', fontWeight: '600' },

  /* Pose row */
  poseRow: { paddingBottom: 8, gap: 10 },
  poseCard: {
    width: 110,
    height: 148,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'flex-end',
  },
  poseCardSel: { borderColor: Colors.brand.purple },
  poseImg: { ...StyleSheet.absoluteFillObject } as any,
  poseSelRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.md,
    opacity: 0.25,
  },
  poseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    padding: 8,
    paddingBottom: 10,
  },
  poseCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.brand.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Result */
  resultSection: { marginTop: 24 },
  resultCard: {
    height: 400,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.bg.card,
  },
  resultImg: { width: '100%', height: '100%' },
  resultGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  resultActions: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    gap: 8,
  },
  resultBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  resultBtnPrimary: {
    flex: 1.5,
    backgroundColor: Colors.brand.purple,
    borderColor: 'transparent',
  },
  resultBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },

  /* CTA */
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 14,
    overflow: 'hidden',
  },
  ctaBtn: {
    height: 56,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  ctaBtnDisabled: { opacity: 0.5 },
  ctaLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
  generatingRow: {
    alignItems: 'center',
    gap: 8,
  },
  generatingText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
});
