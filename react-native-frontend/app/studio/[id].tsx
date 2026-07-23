import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Dimensions, Alert, ActivityIndicator, Platform, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { Colors, Radius } from '../../constants/theme';
import { STUDIOS } from '../../constants/studios';

// Gold accent constants
const GOLD = Colors.brand.gold;
const GOLD_LIGHT = Colors.brand.goldLight;
const GOLD_DARK = Colors.brand.goldDark;

const { width: SW } = Dimensions.get('window');
const API = 'http://10.99.217.247:8000';

// Style options per tool — matches Fun With AI content
const STYLES: Record<string, { id: string; label: string; imageUrl: string }[]> = {
  ai_videos: [
    { id: 'collage',   label: 'Character Collage', imageUrl: 'https://images.unsplash.com/photo-1536240478700-b869ad10e128?w=300&q=80' },
    { id: 'cinematic', label: 'Cinematic Scene',   imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=300&q=80' },
    { id: 'fantasy',   label: 'Fantasy World',     imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&q=80' },
    { id: 'dance',     label: 'Dance Clip',        imageUrl: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=300&q=80' },
  ],
  photo_styles: [
    { id: 'retro_1996',  label: '1996 Retro',    imageUrl: 'https://images.unsplash.com/photo-1520099458-4a0afbb74cd8?w=300&q=80' },
    { id: 'future_2026', label: '2026 Future',   imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300&q=80' },
    { id: 'film_noir',   label: 'Film Noir',     imageUrl: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=300&q=80' },
    { id: 'polaroid',    label: 'Polaroid',      imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&q=80' },
  ],
  birthday: [
    { id: 'bday_queen',  label: 'Birthday Queen', imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=300&q=80' },
    { id: 'bday_pink',   label: 'Pink Glam',      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80' },
    { id: 'bday_candles',label: 'Candlelight',    imageUrl: 'https://images.unsplash.com/photo-1602526211997-51fdd5bf3460?w=300&q=80' },
    { id: 'bday_outdoor',label: 'Outdoor Party',  imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=300&q=80' },
  ],
  stadium_cam: [
    { id: 'football',  label: 'Football Match', imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=300&q=80' },
    { id: 'concert',   label: 'Live Concert',   imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300&q=80' },
    { id: 'basketball',label: 'Basketball',     imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=300&q=80' },
    { id: 'fan_zone',  label: 'Fan Zone',       imageUrl: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=300&q=80' },
  ],
  horse_riding: [
    { id: 'snow',    label: 'Snowy Field',   imageUrl: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=300&q=80' },
    { id: 'beach',   label: 'Beach Gallop',  imageUrl: 'https://images.unsplash.com/photo-1508029387703-f5b32c9e9a44?w=300&q=80' },
    { id: 'forest',  label: 'Forest Trail',  imageUrl: 'https://images.unsplash.com/photo-1452378174528-3090a4bba7b2?w=300&q=80' },
    { id: 'meadow',  label: 'Open Meadow',   imageUrl: 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=300&q=80' },
  ],
  fantasy_armor: [
    { id: 'knight',   label: 'Dark Knight',   imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&q=80' },
    { id: 'warrior',  label: 'Warrior',       imageUrl: 'https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=300&q=80' },
    { id: 'elf',      label: 'Elf Archer',    imageUrl: 'https://images.unsplash.com/photo-1559703248-dcaaec9fab78?w=300&q=80' },
    { id: 'mage',     label: 'Mage',          imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&q=80' },
  ],
  dance_video: [
    { id: 'hiphop',  label: 'Hip-Hop',   imageUrl: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=300&q=80' },
    { id: 'salsa',   label: 'Salsa',     imageUrl: 'https://images.unsplash.com/photo-1545959570-a94084071b5d?w=300&q=80' },
    { id: 'kpop',    label: 'K-Pop',     imageUrl: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=300&q=80' },
    { id: 'viral',   label: 'Viral Trend',imageUrl:'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&q=80' },
  ],
  talking_photo: [
    { id: 'natural', label: 'Natural',   imageUrl: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=300&q=80' },
    { id: 'laugh',   label: 'Laughing',  imageUrl: 'https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?w=300&q=80' },
    { id: 'sing',    label: 'Singing',   imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&q=80' },
    { id: 'wink',    label: 'Wink',      imageUrl: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=300&q=80' },
  ],
  retro_1996: [
    { id: 'bw',      label: 'B&W Film',  imageUrl: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=300&q=80' },
    { id: 'sepia',   label: 'Sepia',     imageUrl: 'https://images.unsplash.com/photo-1520099458-4a0afbb74cd8?w=300&q=80' },
    { id: 'vhs',     label: 'VHS',       imageUrl: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=300&q=80' },
    { id: 'grunge',  label: 'Grunge',    imageUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=300&q=80' },
  ],
  futuristic_2026: [
    { id: 'neon',    label: 'Neon Glow', imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300&q=80' },
    { id: 'cyber',   label: 'Cyberpunk', imageUrl: 'https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=300&q=80' },
    { id: 'ai_art',  label: 'AI Art',    imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&q=80' },
    { id: 'glitch',  label: 'Glitch',    imageUrl: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=300&q=80' },
  ],
  anime_style: [
    { id: 'manga',    label: 'Manga',    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&q=80' },
    { id: 'ghibli',   label: 'Ghibli',   imageUrl: 'https://images.unsplash.com/photo-1489493585363-d69421e0ded3?w=300&q=80' },
    { id: 'chibi',    label: 'Chibi',    imageUrl: 'https://images.unsplash.com/photo-1535223289429-462edb15fb13?w=300&q=80' },
    { id: 'cyberpunk',label: 'Cyberpunk',imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300&q=80' },
  ],
  ai_portrait: [
    { id: 'studio',   label: 'Studio',   imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80' },
    { id: 'outdoor',  label: 'Outdoor',  imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80' },
    { id: 'linkedin', label: 'LinkedIn', imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80' },
    { id: 'creative', label: 'Creative', imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=300&q=80' },
  ],
  birthday_queen: [
    { id: 'crown',   label: 'Crown',     imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=300&q=80' },
    { id: 'floral',  label: 'Floral',    imageUrl: 'https://images.unsplash.com/photo-1490750967868-88df5691cc37?w=300&q=80' },
    { id: 'glam',    label: 'Glam',      imageUrl: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=300&q=80' },
    { id: 'casual',  label: 'Casual',    imageUrl: 'https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?w=300&q=80' },
  ],
  wedding_look: [
    { id: 'bride',   label: 'Bride',     imageUrl: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=300&q=80' },
    { id: 'groom',   label: 'Groom',     imageUrl: 'https://images.unsplash.com/photo-1553254718-bfdc69c04f88?w=300&q=80' },
    { id: 'couple',  label: 'Couple',    imageUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=300&q=80' },
    { id: 'aisle',   label: 'Aisle Walk',imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=300&q=80' },
  ],
  graduation: [
    { id: 'cap',     label: 'Cap & Gown',imageUrl: 'https://images.unsplash.com/photo-1627556704302-624286467c65?w=300&q=80' },
    { id: 'outdoor', label: 'Outdoor',   imageUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=300&q=80' },
    { id: 'party',   label: 'Grad Party',imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=300&q=80' },
    { id: 'formal',  label: 'Formal',    imageUrl: 'https://images.unsplash.com/photo-1580894742597-87bc8789db3d?w=300&q=80' },
  ],
  face_swap: [
    { id: 'photo',   label: 'Photo',     imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80' },
    { id: 'celeb',   label: 'Celebrity', imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&q=80' },
    { id: 'movie',   label: 'Movie',     imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=300&q=80' },
    { id: 'cartoon', label: 'Cartoon',   imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&q=80' },
  ],
  outfit_tryon: [
    { id: 'casual',  label: 'Casual',    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&q=80' },
    { id: 'formal',  label: 'Formal',    imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=300&q=80' },
    { id: 'sport',   label: 'Sport',     imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300&q=80' },
    { id: 'party',   label: 'Party',     imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&q=80' },
  ],
  age_filter: [
    { id: 'young',  label: 'Age -20',   imageUrl: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=300&q=80' },
    { id: 'old',    label: 'Age +30',   imageUrl: 'https://images.unsplash.com/photo-1601576084861-5de423553c0f?w=300&q=80' },
    { id: 'teen',   label: 'Teenage',   imageUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&q=80' },
    { id: 'elder',  label: 'Elder',     imageUrl: 'https://images.unsplash.com/photo-1581579186913-45ac9eac2208?w=300&q=80' },
  ],
};

const VIDEO_STUDIOS = new Set(['ai_videos', 'horse_riding', 'fantasy_armor', 'dance_video', 'talking_photo', 'stadium_cam',
  'kids_cartoon', 'kids_superhero', 'kids_fairy_tale', 'kids_space', 'kids_dinosaur', 'kids_underwater']);
const TEXT_TOOLS = new Set<string>([]); // reserved for future text-to-video

export default function StudioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const studio = STUDIOS.find((s) => s.id === id);
  const styleOptions = STYLES[id ?? ''] ?? [];

  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [textPrompt, setTextPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUri, setResultUri] = useState<string | null>(null);

  // Every tool needs a photo upload; text tools (none yet) use a prompt instead
  const needsImage = !TEXT_TOOLS.has(id ?? '');
  const needsText  = TEXT_TOOLS.has(id ?? '');

  if (!studio) {
    return (
      <View style={styles.notFound}>
        <Text style={{ color: '#fff' }}>Tool not found</Text>
      </View>
    );
  }

  async function pickPhoto() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed', 'Allow access to your photo library.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [3, 4], quality: 0.9,
    });
    if (!res.canceled) { setPhotoUri(res.assets[0].uri); setResultUri(null); }
  }

  async function takePhoto() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed', 'Allow camera access.'); return; }
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.9 });
    if (!res.canceled) { setPhotoUri(res.assets[0].uri); setResultUri(null); }
  }

  async function generate() {
    const ready = needsText ? textPrompt.trim().length > 0 : (photoUri && selectedStyle);
    if (!ready) {
      Alert.alert('Almost there!', needsText
        ? 'Please enter a text prompt.'
        : 'Please upload a photo and choose a style.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGenerating(true);
    setProgress(5);

    const interval = setInterval(() => {
      setProgress((p) => { if (p >= 88) { clearInterval(interval); return 88; } return p + Math.random() * 7; });
    }, 800);

    try {
      const formData = new FormData();
      if (photoUri) formData.append('file', { uri: photoUri, type: 'image/jpeg', name: 'upload.jpg' } as any);
      formData.append('pose_template_id', '1');
      formData.append('studio_id', studio!.id);
      formData.append('pose_id', selectedStyle ?? 'default');
      formData.append('gender', 'auto');
      formData.append('style_prompt', needsText ? textPrompt : `${studio!.title} ${selectedStyle} style`);

      const resp = await fetch(`${API}/api/generate`, { method: 'POST', body: formData });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error((err as any).detail || `Server error ${resp.status}`);
      }
      const data = await resp.json();
      clearInterval(interval);
      setProgress(90);

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
        } catch (e: any) { setGenerating(false); Alert.alert('Error', e.message || 'Something went wrong'); }
      };
      poll();
    } catch (e: any) {
      clearInterval(interval);
      setGenerating(false);
      Alert.alert('Failed', e.message || 'Could not connect to server.');
    }
  }

  const canGenerate = needsText ? textPrompt.trim().length > 0 : (!!photoUri && !!selectedStyle);

  return (
    <View style={styles.root}>
      {/* Hero */}
      <View style={styles.hero}>
        <Image source={{ uri: studio.imageUrl }} style={styles.heroImage} resizeMode="cover" />
        <LinearGradient
          colors={['rgba(13,13,20,0)', 'rgba(13,13,20,0.55)', '#0D0D14']}
          locations={[0, 0.52, 1]}
          style={StyleSheet.absoluteFill}
        />
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

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: 130 }]} showsVerticalScrollIndicator={false}>

        {/* Text prompt (text2video) */}
        {needsText && (
          <>
            <Text style={styles.sectionLabel}>Describe Your Video</Text>
            <View style={styles.promptBox}>
              <TextInput
                value={textPrompt}
                onChangeText={setTextPrompt}
                placeholder="e.g. A woman walking on a beach at sunset, cinematic..."
                placeholderTextColor="rgba(255,255,255,0.28)"
                style={styles.promptInput}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {textPrompt.length > 0 && (
                <TouchableOpacity style={styles.clearBtn} onPress={() => setTextPrompt('')}>
                  <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.35)" />
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* Photo upload (image tools) */}
        {needsImage && (
          <>
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
                  <LinearGradient colors={['rgba(201,168,76,0.12)', 'rgba(201,168,76,0.04)']} style={StyleSheet.absoluteFill} />
                  <Ionicons name="image-outline" size={30} color={Colors.brand.gold} />
                  <Text style={styles.uploadTitle}>Choose Photo</Text>
                  <Text style={styles.uploadHint}>From library</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={takePhoto} style={styles.cameraBox}>
                <LinearGradient colors={['rgba(201,168,76,0.12)', 'rgba(201,168,76,0.04)']} style={StyleSheet.absoluteFill} />
                <Ionicons name="camera-outline" size={30} color={Colors.brand.gold} />
                <Text style={styles.uploadTitle}>Camera</Text>
                <Text style={styles.uploadHint}>Take a selfie</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Style selector */}
        {styleOptions.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Choose Style</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.styleRow}>
              {styleOptions.map((style) => {
                const sel = selectedStyle === style.id;
                return (
                  <TouchableOpacity
                    key={style.id}
                    onPress={() => { Haptics.selectionAsync(); setSelectedStyle(style.id); setResultUri(null); }}
                    style={[styles.styleCard, sel && styles.styleCardSel]}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: style.imageUrl }} style={styles.styleImg} resizeMode="cover" />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.78)']} style={StyleSheet.absoluteFill} />
                    {sel && (
                      <LinearGradient
                        colors={[GOLD_DARK, GOLD]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={[StyleSheet.absoluteFill, { opacity: 0.22 }]}
                      />
                    )}
                    <Text style={styles.styleLabel}>{style.label}</Text>
                    {sel && (
                      <View style={styles.styleCheck}>
                        <Ionicons name="checkmark" size={11} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* Result */}
        {resultUri && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionLabel}>Your AI Result ✨</Text>
            <View style={styles.resultCard}>
              <Image source={{ uri: resultUri }} style={styles.resultImg} resizeMode="cover" />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.resultGradient} />
              <View style={styles.resultActions}>
                <TouchableOpacity style={styles.resultBtn}>
                  <Ionicons name="download-outline" size={19} color="#fff" />
                  <Text style={styles.resultBtnText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.resultBtn}>
                  <Ionicons name="share-outline" size={19} color="#fff" />
                  <Text style={styles.resultBtnText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.resultBtn, styles.resultBtnPrimary]}
                  onPress={() => { setResultUri(null); generate(); }}>
                  <Ionicons name="refresh-outline" size={19} color="#fff" />
                  <Text style={styles.resultBtnText}>Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Generate CTA */}
      {!resultUri && (
        <View style={styles.ctaContainer}>
          <BlurView tint="dark" intensity={85} style={StyleSheet.absoluteFill} />
          {generating ? (
            <View style={styles.generatingRow}>
              <ActivityIndicator color={GOLD} size="small" />
              <Text style={styles.generatingText}>Generating… {Math.round(progress)}%</Text>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={[GOLD_DARK, GOLD]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={generate}
              style={[styles.ctaBtn, !canGenerate && styles.ctaBtnDisabled]}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={canGenerate
                  ? [GOLD_DARK, GOLD, GOLD_LIGHT]
                  : ['rgba(201,168,76,0.3)', 'rgba(201,168,76,0.2)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="sparkles" size={20} color="#000" />
              <Text style={[styles.ctaLabel, { color: '#000' }]}>Generate Now</Text>
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
  hero: { width: SW, height: 240, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroTopBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 6,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroFooter: { position: 'absolute', bottom: 16, left: 16 },
  iconBadge: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  heroTitle: { fontSize: 26, fontWeight: '700', color: '#fff' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },
  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 10, marginTop: 6,
  },
  promptBox: {
    backgroundColor: Colors.bg.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
    padding: 14, marginBottom: 20, minHeight: 110,
  },
  promptInput: { fontSize: 14, color: '#fff', lineHeight: 22, flex: 1 },
  clearBtn: { position: 'absolute', top: 10, right: 10 },
  uploadRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  uploadBox: {
    flex: 1, height: 126, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: 'rgba(201,168,76,0.4)', overflow: 'hidden', gap: 5,
  },
  cameraBox: {
    flex: 1, height: 126, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: 'rgba(201,168,76,0.4)', overflow: 'hidden', gap: 5,
  },
  uploadTitle: { fontSize: 13, fontWeight: '600', color: '#fff' },
  uploadHint: { fontSize: 11, color: 'rgba(255,255,255,0.38)' },
  photoPreview: { flex: 2, height: 126, borderRadius: Radius.md, overflow: 'hidden' },
  previewImg: { width: '100%', height: '100%' },
  changeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  changeText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  styleRow: { paddingBottom: 8, gap: 10 },
  styleCard: {
    width: 108, height: 144, borderRadius: Radius.md,
    overflow: 'hidden', borderWidth: 2, borderColor: 'transparent',
    justifyContent: 'flex-end',
  },
  styleCardSel: { borderColor: GOLD },
  styleImg: { ...StyleSheet.absoluteFillObject } as any,
  styleLabel: { fontSize: 12, fontWeight: '600', color: '#fff', padding: 8, paddingBottom: 10 },
  styleCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
  },
  resultSection: { marginTop: 22 },
  resultCard: { height: 390, borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: Colors.bg.card },
  resultImg: { width: '100%', height: '100%' },
  resultGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '38%' },
  resultActions: {
    position: 'absolute', bottom: 14, left: 14, right: 14,
    flexDirection: 'row', gap: 8,
  },
  resultBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 10, borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  resultBtnPrimary: { flex: 1.2, backgroundColor: GOLD, borderColor: 'transparent' },
  resultBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  ctaContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 14, overflow: 'hidden',
  },
  ctaBtn: {
    height: 56, borderRadius: Radius.full,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, overflow: 'hidden',
  },
  ctaBtnDisabled: { opacity: 0.48 },
  ctaLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
  generatingRow: { alignItems: 'center', gap: 8 },
  generatingText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  progressBar: {
    width: '100%', height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
});
