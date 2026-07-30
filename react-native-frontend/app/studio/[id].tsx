import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator, Platform, TextInput, useWindowDimensions,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useVideoPlayer, VideoView } from 'expo-video';
import { BlurView } from 'expo-blur';
import { Colors, Radius } from '../../constants/theme';
import { getStudioImageSource, STUDIOS } from '../../constants/studios';
import { API_BASE, authFetch } from '../../services/api';
import { saveCreation } from '../../services/savedCreations';

// Gold accent constants
const GOLD = Colors.brand.gold;
const GOLD_LIGHT = Colors.brand.goldLight;
const GOLD_DARK = Colors.brand.goldDark;

const SIDE_PAD = 16;

type PremiumTemplate = {
  id: string;
  label: string;
  subtitle: string;
  image: ImageSourcePropType;
  gender: 'male' | 'female';
};

// Original Anva templates. Every preview is the exact target image sent to
// Anva AI, so the result preserves the selected outfit, scene and lighting.
const PREMIUM_TEMPLATES: PremiumTemplate[] = [
  {
    id: 'premium_formal',
    label: 'Midnight Executive',
    subtitle: 'Black tailoring · gold studio light',
    image: require('../../assets/templates/anva-formal-v2.png'),
    gender: 'male',
  },
  {
    id: 'premium_birthday',
    label: 'Royal Birthday',
    subtitle: 'Purple couture · gold celebration',
    image: require('../../assets/templates/anva-birthday-v2.png'),
    gender: 'female',
  },
  {
    id: 'premium_cyber',
    label: 'Neon Future',
    subtitle: 'Violet cyber fashion · blue rim light',
    image: require('../../assets/templates/anva-cyber-v2.png'),
    gender: 'female',
  },
  {
    id: 'premium_fantasy',
    label: 'Golden Warrior',
    subtitle: 'Cinematic armor · castle atmosphere',
    image: require('../../assets/templates/anva-fantasy-v2.png'),
    gender: 'male',
  },
  {
    id: 'premium_wedding',
    label: 'Ivory Royal',
    subtitle: 'Luxury wedding · warm floral bokeh',
    image: require('../../assets/templates/anva-wedding-v2.png'),
    gender: 'female',
  },
  {
    id: 'premium_street',
    label: 'Night City',
    subtitle: 'Rainy editorial · violet and gold',
    image: require('../../assets/templates/anva-street-v2.png'),
    gender: 'male',
  },
  {
    id: 'premium_festival_kid',
    label: 'Raksha Bandhan Kid',
    subtitle: 'Child-safe festive portrait · warm celebration',
    image: require('../../assets/templates/effects/festival-kid-target.png'),
    gender: 'male',
  },
  {
    id: 'premium_effect_executive',
    label: 'Executive Transform',
    subtitle: 'New black-suit transformation target',
    image: require('../../assets/templates/effects/executive-target.png'),
    gender: 'male',
  },
  {
    id: 'premium_effect_neon',
    label: 'Neon Transform',
    subtitle: 'New violet cyber transformation target',
    image: require('../../assets/templates/effects/neon-target.png'),
    gender: 'female',
  },
];

const STUDIO_TEMPLATE: Record<string, string> = {
  ai_portrait: 'premium_formal',
  birthday: 'premium_birthday',
  birthday_queen: 'premium_birthday',
  futuristic_2026: 'premium_cyber',
  photo_styles: 'premium_cyber',
  fantasy_armor: 'premium_fantasy',
  wedding_look: 'premium_wedding',
  ai_videos: 'premium_street',
  dance_video: 'premium_street',
};

const TALKING_PREVIEWS: Record<string, ImageSourcePropType> = {
  male_news: require('../../assets/templates/talking/news-presenter.png'),
  female_guide: require('../../assets/templates/talking/friendly-guide.png'),
  male_podcast: require('../../assets/templates/talking/podcast-storyteller.png'),
  female_product: require('../../assets/templates/talking/product-host.png'),
  kids_storytime: require('../../assets/templates/talking/kids-storytime.png'),
  kids_learning: require('../../assets/templates/talking/kids-learning.png'),
};

const EFFECT_PREVIEWS: Record<string, ImageSourcePropType> = {
  executive: require('../../assets/templates/effects/executive-transform.gif'),
  neon: require('../../assets/templates/effects/neon-transform.gif'),
  festival: require('../../assets/templates/effects/festival-transform.gif'),
};

const MOTION_TEMPLATES = [
  { id: 'motion_subtle', label: 'Natural', icon: 'eye-outline', subtitle: 'Blink & breathe' },
  { id: 'motion_cinematic', label: 'Cinematic', icon: 'videocam-outline', subtitle: 'Slow camera push' },
  { id: 'motion_confident', label: 'Confident', icon: 'person-outline', subtitle: 'Head turn' },
  { id: 'motion_smile', label: 'Warm Smile', icon: 'happy-outline', subtitle: 'Natural expression' },
  { id: 'motion_wind', label: 'Soft Wind', icon: 'leaf-outline', subtitle: 'Hair & clothing' },
  { id: 'motion_orbit', label: 'Orbit', icon: 'sync-outline', subtitle: 'Camera parallax' },
] as const;



const VIDEO_STUDIOS = new Set(['ai_videos', 'horse_riding', 'fantasy_armor', 'dance_video', 'talking_photo', 'stadium_cam',
  'kids_cartoon', 'kids_superhero', 'kids_fairy_tale', 'kids_space', 'kids_dinosaur', 'kids_underwater']);
const TEXT_TOOLS = new Set<string>([]); // reserved for future text-to-video

function ResultVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
    instance.play();
  });
  return (
    <VideoView
      player={player}
      style={styles.resultImg}
      nativeControls
      contentFit="cover"
    />
  );
}

export default function StudioScreen() {
  const { width } = useWindowDimensions();
  const {
    id,
    gender: presetGender,
    motion: presetMotion,
    templateId,
    voiceName: presetVoiceName,
    audience,
    templateName,
    style: presetStyle,
    effectPreview,
  } = useLocalSearchParams<{
    id: string;
    gender?: 'male' | 'female';
    motion?: string;
    templateId?: string;
    voiceName?: string;
    audience?: 'adult' | 'kids';
    templateName?: string;
    style?: string;
    effectPreview?: string;
  }>();
  const router = useRouter();
  const studio = STUDIOS.find((s) => s.id === id);
  const isTalkingPhoto = id === 'talking_photo';
  const isKidsTemplate = audience === 'kids';
  const isMotionStudio = VIDEO_STUDIOS.has(id ?? '') && !isTalkingPhoto;

  const [selectedStyle, setSelectedStyle] = useState<string | null>(presetStyle ?? null);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(
    presetGender === 'male' || presetGender === 'female' ? presetGender : null
  );
  const [selectedMotion, setSelectedMotion] = useState<string>(
    presetMotion || 'motion_subtle'
  );
  const [audioAsset, setAudioAsset] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [audioMode, setAudioMode] = useState<'generate' | 'upload'>('generate');
  const [voiceScript, setVoiceScript] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoAsset, setPhotoAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [textPrompt, setTextPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUri, setResultUri] = useState<string | null>(null);

  // Every tool needs a photo upload; text tools (none yet) use a prompt instead
  const needsImage = !TEXT_TOOLS.has(id ?? '');
  const needsText  = TEXT_TOOLS.has(id ?? '');
  const studioTemplateId = STUDIO_TEMPLATE[id ?? ''];
  const styleOptions = isTalkingPhoto || !selectedGender
    ? []
    : PREMIUM_TEMPLATES.filter(
        (template) =>
          template.id === (presetStyle || studioTemplateId)
          && template.gender === selectedGender
      );
  const heroSource = effectPreview && EFFECT_PREVIEWS[effectPreview]
    ? EFFECT_PREVIEWS[effectPreview]
    : isTalkingPhoto
    ? (templateId && TALKING_PREVIEWS[templateId]
        ? TALKING_PREVIEWS[templateId]
        : TALKING_PREVIEWS.male_news)
    : getStudioImageSource(studio?.id ?? id ?? '');

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
      mediaTypes: ['images'],
      allowsEditing: true, aspect: [3, 4], quality: 0.9,
    });
    if (!res.canceled) {
      setPhotoAsset(res.assets[0]);
      setPhotoUri(res.assets[0].uri);
      setResultUri(null);
    }
  }

  async function takePhoto() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed', 'Allow camera access.'); return; }
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.9 });
    if (!res.canceled) {
      setPhotoAsset(res.assets[0]);
      setPhotoUri(res.assets[0].uri);
      setResultUri(null);
    }
  }

  async function pickAudio() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/x-aiff', 'audio/flac'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (!result.canceled) {
      setAudioAsset(result.assets[0]);
      setResultUri(null);
    }
  }

  async function generate() {
    const ready = needsText
      ? textPrompt.trim().length > 0
      : !!photoUri
        && !!selectedGender
        && (
          isTalkingPhoto
            ? audioMode === 'upload' ? !!audioAsset : voiceScript.trim().length >= 3
            : !!selectedStyle
        )
        && (!isMotionStudio || !!selectedMotion);
    if (!ready) {
      Alert.alert('Almost there!', needsText
        ? 'Please enter a text prompt.'
        : isTalkingPhoto
          ? 'Choose a character type, upload a clear photo, then enter a voice script or add audio.'
          : 'Choose Man or Woman, upload a photo, and select a matching template.');
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
      if (photoUri) {
        if (Platform.OS === 'web') {
          // Browser FormData requires a real File/Blob. The React Native
          // `{ uri, type, name }` object never produces a multipart upload.
          const browserFile = photoAsset?.file;
          const blob = (browserFile ?? await fetch(photoUri).then((response) => {
            if (!response.ok) throw new Error('Could not read the selected photo.');
            return response.blob();
          })) as Blob;
          formData.append(
            'file',
            blob,
            photoAsset?.fileName || browserFile?.name || 'upload.jpg',
          );
        } else {
          formData.append('file', {
            uri: photoUri,
            type: photoAsset?.mimeType || 'image/jpeg',
            name: photoAsset?.fileName || 'upload.jpg',
          } as any);
        }
      }
      formData.append('pose_template_id', '1');
      formData.append('studio_id', studio!.id);
      formData.append('pose_id', selectedStyle ?? 'default');
      formData.append('motion_id', selectedMotion);
      formData.append('gender', selectedGender ?? 'auto');
      if (audioMode === 'upload' && audioAsset) {
        if (Platform.OS === 'web') {
          const browserAudio = audioAsset.file;
          const audioBlob = (browserAudio ?? await fetch(audioAsset.uri).then((response) => {
            if (!response.ok) throw new Error('Could not read the selected audio.');
            return response.blob();
          })) as Blob;
          formData.append('audio', audioBlob, audioAsset.name || browserAudio?.name || 'speech.mp3');
        } else {
          formData.append('audio', {
            uri: audioAsset.uri,
            type: audioAsset.mimeType || 'audio/mpeg',
            name: audioAsset.name || 'speech.mp3',
          } as any);
        }
      }
      if (isTalkingPhoto && audioMode === 'generate') {
        formData.append('voice_text', voiceScript.trim());
        formData.append('voice_name', presetVoiceName || 'Morgan Freeman');
      }
      formData.append('style_prompt', needsText ? textPrompt : `${studio!.title} ${selectedStyle} style`);

      const resp = await authFetch(`${API_BASE}/api/generate`, { method: 'POST', body: formData });
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
          const statusResponse = await authFetch(`${API_BASE}/api/generate/${data.id}/status`);
          const s = await statusResponse.json().catch(() => ({}));
          if (!statusResponse.ok) {
            throw new Error(s.detail || `Could not check generation (${statusResponse.status})`);
          }
          setProgress(s.progress ?? 90);
          if (s.status === 'completed' && s.result_image_url) {
            setProgress(100);
            setResultUri(`${API_BASE}${s.result_image_url}&t=${Date.now()}`);
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

  const canGenerate = needsText
    ? textPrompt.trim().length > 0
    : !!photoUri
      && !!selectedGender
      && (
        isTalkingPhoto
          ? audioMode === 'upload' ? !!audioAsset : voiceScript.trim().length >= 3
          : !!selectedStyle
      )
      && (!isMotionStudio || !!selectedMotion);

  async function saveResult() {
    if (!resultUri) return;
    try {
      const template = styleOptions.find((style) => style.id === selectedStyle);
      const mediaType = isTalkingPhoto || isMotionStudio ? 'video' : 'photo';
      await saveCreation({
        uri: resultUri,
        title: template?.label ?? studio!.title,
        type: mediaType,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved to My Studio', 'Open My Studio to preview it or save it to your gallery.');
    } catch (error: any) {
      Alert.alert('Could not save', error.message || 'Please try again.');
    }
  }

  return (
    <View style={styles.root}>
      {/* Hero */}
      <View style={[styles.hero, isTalkingPhoto && styles.talkingHero, { width }]}>
        <Image
          source={heroSource}
          style={[styles.heroBackdrop, isTalkingPhoto && styles.talkingHeroBackdrop]}
          resizeMode="cover"
          blurRadius={isTalkingPhoto ? 28 : 18}
        />
        <View style={[styles.heroPortraitWrap, isTalkingPhoto && styles.talkingPortraitWrap]}>
          <Image
            source={heroSource}
            style={styles.heroImage}
            resizeMode={isTalkingPhoto ? 'cover' : 'contain'}
          />
        </View>
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
        <View style={[styles.heroFooter, isTalkingPhoto && styles.talkingHeroFooter]}>
          <View style={styles.iconBadge}>
            <Ionicons name={studio.icon as any} size={18} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>
            {templateName || studio.title}
          </Text>
          <Text style={styles.heroSub}>
            {isTalkingPhoto
              ? isKidsTemplate
                ? 'Child-safe voice generation and natural lip-sync'
                : 'Template-matched voice generation and natural lip-sync'
              : studio.subtitle}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: 130 }]} showsVerticalScrollIndicator={false}>

        {needsImage && (
          <>
            <Text style={styles.sectionLabel}>Person in Your Photo</Text>
            <View style={styles.genderRow}>
              {([
                { id: 'male', label: isKidsTemplate ? 'Boy' : 'Man', icon: 'male-outline' },
                { id: 'female', label: isKidsTemplate ? 'Girl' : 'Woman', icon: 'female-outline' },
              ] as const).map((option) => {
                const selected = selectedGender === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.genderButton, selected && styles.genderButtonSelected]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedGender(option.id);
                      setSelectedStyle(null);
                      setResultUri(null);
                    }}
                  >
                    <Ionicons
                      name={option.icon}
                      size={19}
                      color={selected ? '#090909' : 'rgba(255,255,255,0.65)'}
                    />
                    <Text style={[styles.genderText, selected && styles.genderTextSelected]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.genderHint}>
              Templates are filtered to prevent a character mismatch.
            </Text>
          </>
        )}

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

        {isTalkingPhoto && (
          <>
            <Text style={styles.sectionLabel}>Voice & Lip-Sync</Text>
            <View style={styles.audioModeRow}>
              {([
                { id: 'generate', label: 'Generate Voice', icon: 'sparkles' },
                { id: 'upload', label: 'Upload Audio', icon: 'musical-notes' },
              ] as const).map((mode) => {
                const selected = audioMode === mode.id;
                return (
                  <TouchableOpacity
                    key={mode.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setAudioMode(mode.id);
                      setResultUri(null);
                    }}
                    style={[styles.audioModeButton, selected && styles.audioModeButtonSelected]}
                  >
                    <Ionicons name={mode.icon} size={16} color={selected ? '#090909' : GOLD} />
                    <Text style={[styles.audioModeText, selected && styles.audioModeTextSelected]}>
                      {mode.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {audioMode === 'generate' ? (
              <View style={styles.voiceBox}>
                <View style={styles.voicePreset}>
                  <Ionicons name="volume-high" size={17} color={GOLD} />
                  <View>
                    <Text style={styles.voicePresetTitle}>Template-matched voice</Text>
                    <Text style={styles.voicePresetSub}>The selected template chooses the voice automatically</Text>
                  </View>
                </View>
                <TextInput
                  value={voiceScript}
                  onChangeText={setVoiceScript}
                  placeholder="Type what the photo should say…"
                  placeholderTextColor="rgba(255,255,255,0.28)"
                  style={styles.voiceScriptInput}
                  multiline
                  maxLength={240}
                  textAlignVertical="top"
                />
                <Text style={styles.characterCount}>{voiceScript.length}/240</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.audioPicker} onPress={pickAudio}>
                <View style={styles.audioIcon}>
                  <Ionicons name="musical-notes" size={20} color={GOLD} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.audioTitle}>
                    {audioAsset ? audioAsset.name : 'Choose audio file'}
                  </Text>
                  <Text style={styles.audioHint}>
                    {audioAsset ? 'Ready for lip-sync' : 'MP3, WAV, AAC, AIFF or FLAC'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.35)" />
              </TouchableOpacity>
            )}
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
                    <Image source={style.image} style={styles.styleImg} resizeMode="cover" />
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

        {!isTalkingPhoto && !!selectedGender && !!studioTemplateId && styleOptions.length === 0 && (
          <View style={styles.templateMismatch}>
            <Ionicons name="alert-circle-outline" size={20} color={GOLD} />
            <Text style={styles.templateMismatchText}>
              This studio look is designed for the other character type. Choose the matching
              Man or Woman option to use its template.
            </Text>
          </View>
        )}

        {isMotionStudio && (
          <>
            <Text style={styles.sectionLabel}>Motion Template</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.motionRow}>
              {MOTION_TEMPLATES.map((motion) => {
                const selected = selectedMotion === motion.id;
                return (
                  <TouchableOpacity
                    key={motion.id}
                    style={[styles.motionCard, selected && styles.motionCardSelected]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedMotion(motion.id);
                      setResultUri(null);
                    }}
                  >
                    <Ionicons name={motion.icon} size={22} color={selected ? '#090909' : GOLD} />
                    <Text style={[styles.motionTitle, selected && styles.motionTitleSelected]}>
                      {motion.label}
                    </Text>
                    <Text style={[styles.motionSubtitle, selected && styles.motionSubtitleSelected]}>
                      {motion.subtitle}
                    </Text>
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
              {VIDEO_STUDIOS.has(id ?? '')
                ? <ResultVideo uri={resultUri} />
                : <Image source={{ uri: resultUri }} style={styles.resultImg} resizeMode="cover" />}
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.resultGradient} />
              <View style={styles.resultActions}>
                <TouchableOpacity style={styles.resultBtn} onPress={saveResult}>
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
          <BlurView
            pointerEvents="none"
            tint="dark"
            intensity={85}
            style={StyleSheet.absoluteFill}
          />
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
            Platform.OS === 'web' ? (
              <button
                type="button"
                aria-label="Generate now"
                onClick={() => void generate()}
                style={{
                  width: '100%',
                  height: 56,
                  border: 0,
                  borderRadius: 999,
                  cursor: 'pointer',
                  color: '#000',
                  fontSize: 16,
                  fontWeight: 700,
                  background: canGenerate
                    ? `linear-gradient(90deg, ${GOLD_DARK}, ${GOLD}, ${GOLD_LIGHT})`
                    : 'rgba(201,168,76,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  position: 'relative',
                  zIndex: 102,
                }}
              >
                <Ionicons name="sparkles" size={20} color="#000" />
                Generate Now
              </button>
            ) : (
              <TouchableOpacity
                onPress={() => void generate()}
                style={[styles.ctaBtn, !canGenerate && styles.ctaBtnDisabled]}
                activeOpacity={0.88}
              >
                <LinearGradient
                  pointerEvents="none"
                  colors={canGenerate
                    ? [GOLD_DARK, GOLD, GOLD_LIGHT]
                    : ['rgba(201,168,76,0.3)', 'rgba(201,168,76,0.2)']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="sparkles" size={20} color="#000" />
                <Text style={[styles.ctaLabel, { color: '#000' }]}>Generate Now</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg.primary },
  hero: { height: 240, position: 'relative', alignSelf: 'center' },
  talkingHero: {
    height: 300,
    backgroundColor: '#12110F',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,168,76,0.18)',
  },
  heroBackdrop: {
    ...StyleSheet.absoluteFillObject,
    width: '100%', height: '100%', opacity: 0.36,
    transform: [{ scale: 1.08 }],
  },
  talkingHeroBackdrop: {
    opacity: 0,
  },
  heroPortraitWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  talkingPortraitWrap: {
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  heroImage: { width: '100%', height: '100%' },
  heroTopBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: SIDE_PAD, paddingTop: 6,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroFooter: { position: 'absolute', bottom: 16, left: SIDE_PAD, right: SIDE_PAD },
  talkingHeroFooter: { right: SIDE_PAD },
  iconBadge: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  heroTitle: { fontSize: 26, fontWeight: '700', color: '#fff' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2, lineHeight: 19 },
  scroll: { flex: 1 },
  scrollContent: {
    width: '100%', maxWidth: 1024, alignSelf: 'center',
    paddingHorizontal: SIDE_PAD, paddingTop: 20,
  },
  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 10, marginTop: 6,
  },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderButton: {
    flex: 1, height: 48, borderRadius: Radius.full,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.bg.card,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  genderButtonSelected: { backgroundColor: GOLD, borderColor: GOLD },
  genderText: { color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: '700' },
  genderTextSelected: { color: '#090909' },
  genderHint: {
    color: 'rgba(255,255,255,0.38)', fontSize: 11, lineHeight: 16,
    marginTop: 7, marginBottom: 18,
  },
  promptBox: {
    backgroundColor: Colors.bg.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
    padding: 14, marginBottom: 20, minHeight: 110,
  },
  promptInput: {
    width: '100%', minHeight: 120, fontSize: 15,
    color: '#fff', lineHeight: 23, flex: 1, textAlignVertical: 'top',
  },
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
  audioPicker: {
    minHeight: 72, borderRadius: Radius.md, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bg.card,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.28)',
    marginBottom: 22,
  },
  audioModeRow: {
    flexDirection: 'row', gap: 8, marginBottom: 10,
    padding: 4, borderRadius: Radius.full, backgroundColor: Colors.bg.card,
  },
  audioModeButton: {
    flex: 1, minHeight: 42, borderRadius: Radius.full,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
  },
  audioModeButtonSelected: { backgroundColor: GOLD },
  audioModeText: { color: 'rgba(255,255,255,0.62)', fontSize: 12, fontWeight: '700' },
  audioModeTextSelected: { color: '#090909' },
  voiceBox: {
    minHeight: 178, borderRadius: Radius.md, padding: 14, marginBottom: 22,
    backgroundColor: Colors.bg.card,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.24)',
  },
  voicePreset: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingBottom: 11, marginBottom: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  voicePresetTitle: { color: '#fff', fontSize: 12, fontWeight: '700' },
  voicePresetSub: { color: 'rgba(255,255,255,0.38)', fontSize: 9, marginTop: 2 },
  voiceScriptInput: {
    width: '100%', minHeight: 92, color: '#fff', fontSize: 15, lineHeight: 22,
    padding: 0, paddingRight: 4,
  },
  characterCount: {
    alignSelf: 'flex-end', color: 'rgba(255,255,255,0.28)', fontSize: 9,
  },
  audioIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(201,168,76,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  audioTitle: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 3 },
  audioHint: { color: 'rgba(255,255,255,0.42)', fontSize: 10, lineHeight: 14 },
  uploadTitle: { fontSize: 13, fontWeight: '600', color: '#fff' },
  uploadHint: { fontSize: 11, color: 'rgba(255,255,255,0.38)' },
  photoPreview: { flex: 1, height: 126, borderRadius: Radius.md, overflow: 'hidden' },
  previewImg: { width: '100%', height: '100%' },
  changeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  changeText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  styleRow: { paddingBottom: 8, paddingRight: SIDE_PAD, gap: 10 },
  styleCard: {
    width: 108, height: 144, borderRadius: Radius.md,
    overflow: 'hidden', borderWidth: 2, borderColor: 'transparent',
    justifyContent: 'flex-end',
  },
  styleCardSel: { borderColor: GOLD },
  styleImg: { width: '100%', height: '100%' },
  styleLabel: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    fontSize: 12, fontWeight: '600', color: '#fff', padding: 8, paddingBottom: 10,
  },
  styleCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
  },
  templateMismatch: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 14, marginBottom: 8, borderRadius: Radius.md,
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.24)',
  },
  templateMismatchText: {
    flex: 1, color: 'rgba(255,255,255,0.62)',
    fontSize: 12, lineHeight: 18,
  },
  motionRow: { paddingBottom: 10, paddingRight: SIDE_PAD, gap: 10 },
  motionCard: {
    width: 120, minHeight: 104, borderRadius: Radius.md, padding: 12,
    justifyContent: 'center', backgroundColor: Colors.bg.card,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
  },
  motionCardSelected: { backgroundColor: GOLD, borderColor: GOLD },
  motionTitle: { color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 9 },
  motionTitleSelected: { color: '#090909' },
  motionSubtitle: { color: 'rgba(255,255,255,0.42)', fontSize: 10, marginTop: 3 },
  motionSubtitleSelected: { color: 'rgba(9,9,9,0.62)' },
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
    paddingHorizontal: SIDE_PAD,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 14, overflow: 'hidden',
    zIndex: 100,
    elevation: 20,
  },
  ctaBtn: {
    height: 56, borderRadius: Radius.full,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, overflow: 'hidden',
    zIndex: 101,
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
