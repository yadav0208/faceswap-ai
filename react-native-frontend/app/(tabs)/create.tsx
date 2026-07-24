import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, TextInput, Alert, ActivityIndicator,
  Image, KeyboardAvoidingView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Radius } from '../../constants/theme';
import { API_BASE } from '../../services/api';
import { saveCreation } from '../../services/savedCreations';

const SIDE_PAD = 16;

const SUGGESTIONS = [
  'A cinematic wolf howling under a full moon, dramatic lighting',
  'A stunning aerial view of a neon city at night, cyberpunk',
  'A magical forest with glowing fireflies and a misty waterfall',
  'An astronaut floating in space with Earth reflected in the visor',
  'A vintage 1960s film still of a detective in a rainy alley',
  'A hyperrealistic oil painting of a lion in golden savannah light',
  'A fashion model in a futuristic silver dress on a glass runway',
  'A close-up portrait of a warrior queen with gold armor at sunset',
];

const VISUAL_STYLES = [
  {
    id: 'formal',
    label: 'Executive',
    image: require('../../assets/templates/anva-formal-v2.png'),
    prompt: 'premium black and gold executive editorial photography',
  },
  {
    id: 'birthday',
    label: 'Birthday',
    image: require('../../assets/templates/anva-birthday-v2.png'),
    prompt: 'luxury royal birthday portrait with purple couture and warm gold lights',
  },
  {
    id: 'cyber',
    label: 'Neon Future',
    image: require('../../assets/templates/anva-cyber-v2.png'),
    prompt: 'cinematic violet and blue futuristic editorial style',
  },
  {
    id: 'fantasy',
    label: 'Fantasy',
    image: require('../../assets/templates/anva-fantasy-v2.png'),
    prompt: 'epic premium fantasy portrait with ornate dark armor and cinematic lighting',
  },
  {
    id: 'wedding',
    label: 'Ivory Royal',
    image: require('../../assets/templates/anva-wedding-v2.png'),
    prompt: 'luxury ivory and gold wedding editorial with warm floral bokeh',
  },
  {
    id: 'street',
    label: 'Night City',
    image: require('../../assets/templates/anva-street-v2.png'),
    prompt: 'rainy night city fashion editorial with violet and gold bokeh',
  },
] as const;

export default function CreateScreen() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [providerReady, setProviderReady] = useState<boolean | null>(null);
  const [progress, setProgress] = useState(0);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [visualStyleId, setVisualStyleId] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((response) => response.json())
      .then((data) => setProviderReady(Boolean(data.provider_configured)))
      .catch(() => setProviderReady(false));
  }, []);

  async function enhancePrompt() {
    if (prompt.trim().length < 3) {
      Alert.alert('Add an idea', 'Write a short idea first, then let AI improve it.');
      return;
    }
    setEnhancing(true);
    try {
      const formData = new FormData();
      const visualStyle = VISUAL_STYLES.find((style) => style.id === visualStyleId);
      const generationPrompt = visualStyle
        ? `${prompt.trim()}, ${visualStyle.prompt}`
        : prompt.trim();
      formData.append('prompt', generationPrompt);
      const response = await fetch(`${API_BASE}/api/generate/enhance-prompt`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || 'Could not enhance the prompt.');
      setPrompt(data.prompt);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert('Prompt assistant', error.message || 'Could not reach the AI assistant.');
    } finally {
      setEnhancing(false);
    }
  }

  async function generate() {
    if (!prompt.trim()) {
      Alert.alert('Add a prompt', 'Describe what you want Anva to create.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGenerating(true);
    setResultUri(null);
    setProgress(5);

    const progressInterval = setInterval(() => {
      setProgress(p => { if (p >= 85) { clearInterval(progressInterval); return 85; } return p + 4; });
    }, 600);

    try {
      const formData = new FormData();
      const visualStyle = VISUAL_STYLES.find((style) => style.id === visualStyleId);
      const generationPrompt = visualStyle
        ? `${prompt.trim()}, ${visualStyle.prompt}`
        : prompt.trim();
      formData.append('prompt', generationPrompt);

      const resp = await fetch(`${API_BASE}/api/generate/prompt`, {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error((err as any).detail || `Server error ${resp.status}`);
      }
      const data = await resp.json();
      clearInterval(progressInterval);
      setProgress(88);

      let tries = 0;
      const poll = async () => {
        tries++;
        try {
          const s = await fetch(`${API_BASE}/api/generate/${data.id}/status`).then(r => r.json());
          setProgress(s.progress ?? 88);
          if (s.status === 'completed' && s.result_image_url) {
            setProgress(100);
            setResultUri(`${API_BASE}${s.result_image_url}?t=${Date.now()}`);
            setGenerating(false);
          } else if (s.status === 'failed') {
            throw new Error(s.error_message || 'Generation failed');
          } else if (tries > 60) {
            throw new Error('Timed out. Please try again.');
          } else {
            pollRef.current = setTimeout(poll, 1500);
          }
        } catch (e: any) {
          setGenerating(false);
          Alert.alert('Error', e.message || 'Something went wrong');
        }
      };
      poll();
    } catch (e: any) {
      clearInterval(progressInterval);
      setGenerating(false);
      Alert.alert('Failed', e.message || 'Could not connect to server.');
    }
  }

  function useSuggestion(s: string) {
    Haptics.selectionAsync();
    setPrompt(s);
    inputRef.current?.focus();
  }

  async function saveResult() {
    if (!resultUri) return;
    try {
      const selectedStyle = VISUAL_STYLES.find((style) => style.id === visualStyleId);
      await saveCreation({
        uri: resultUri,
        title: selectedStyle?.label ?? 'Anva Creation',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Your image is now in My Studio.');
    } catch {
      Alert.alert('Could not save', 'Please try again.');
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView edges={['top']} style={styles.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scroll,
              { paddingBottom: Platform.OS === 'ios' ? 190 : 170 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Header ── */}
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View>
                  <Text style={styles.sectionLabel}>ANVA CREATE</Text>
                  <Text style={styles.heroTitle}>Create an image</Text>
                </View>
                <View style={styles.creditPill}>
                  <Ionicons name="sparkles" size={13} color={Colors.brand.gold} />
                  <Text style={styles.creditText}>AI</Text>
                </View>
              </View>
              <Text style={styles.heroSub}>
                Turn a simple idea into a studio-quality visual.
              </Text>
            </View>

            <Text style={styles.tryLabel}>MODEL</Text>
            <View style={styles.modelCard}>
              <View style={styles.modelIcon}>
                <Ionicons name="color-wand" size={20} color="#090909" />
              </View>
              <View style={styles.modelCopy}>
                <Text style={styles.modelName}>Anva Image Studio</Text>
                <Text style={styles.modelSub}>
                  {providerReady === null
                    ? 'Checking image provider…'
                    : providerReady
                      ? 'FLUX Schnell · ready'
                      : 'Free API key required'}
                </Text>
              </View>
              <View style={[styles.activeDot, providerReady === false && styles.inactiveDot]} />
            </View>

            <Text style={styles.tryLabel}>VISUAL STYLE</Text>
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.visualStyleRow}
            >
              {VISUAL_STYLES.map((style) => {
                const selected = visualStyleId === style.id;
                return (
                  <TouchableOpacity
                    key={style.id}
                    activeOpacity={0.84}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setVisualStyleId(selected ? null : style.id);
                    }}
                    style={[styles.visualStyleCard, selected && styles.visualStyleCardSelected]}
                  >
                    <Image source={style.image} style={styles.visualStyleImage} resizeMode="cover" />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.88)']}
                      style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.visualStyleLabel} numberOfLines={1}>{style.label}</Text>
                    {selected && (
                      <View style={styles.visualStyleCheck}>
                        <Ionicons name="checkmark" size={12} color="#000" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* ── Prompt Input ── */}
            <View style={styles.promptHeading}>
              <Text style={[styles.tryLabel, styles.promptHeadingLabel]}>PROMPT</Text>
              <TouchableOpacity
                onPress={enhancePrompt}
                disabled={enhancing || prompt.trim().length < 3}
                style={styles.enhanceBtn}
              >
                {enhancing
                  ? <ActivityIndicator size="small" color={Colors.brand.gold} />
                  : <Ionicons name="sparkles-outline" size={14} color={Colors.brand.gold} />}
                <Text style={styles.enhanceText}>{enhancing ? 'Improving…' : 'Enhance with AI'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputCard}>
              <TextInput
                ref={inputRef}
                value={prompt}
                onChangeText={setPrompt}
                placeholder="Describe the subject, scene, mood and style…"
                placeholderTextColor="rgba(255,255,255,0.25)"
                style={styles.input}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              {prompt.length > 0 && (
                <TouchableOpacity style={styles.clearBtn} onPress={() => setPrompt('')}>
                  <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.28)" />
                </TouchableOpacity>
              )}
            </View>

            {/* ── Suggestion chips ── */}
            <Text style={styles.tryLabel}>INSPIRATION</Text>
            <View style={styles.chips}>
              {SUGGESTIONS.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => useSuggestion(s)}
                  style={styles.chip}
                  activeOpacity={0.72}
                >
                  <Text style={styles.chipText} numberOfLines={1}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Result ── */}
            {resultUri && (
              <View style={styles.resultSection}>
                <Text style={styles.resultLabel}>YOUR CREATION</Text>
                <View style={styles.resultCard}>
                  <Image source={{ uri: resultUri }} style={styles.resultImg} resizeMode="cover" />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.70)']}
                    style={styles.resultGradient}
                  />
                  <View style={styles.resultActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={saveResult}>
                      <Ionicons name="download-outline" size={18} color="#fff" />
                      <Text style={styles.actionBtnText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}>
                      <Ionicons name="share-outline" size={18} color="#fff" />
                      <Text style={styles.actionBtnText}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnGold]}
                      onPress={() => { setResultUri(null); generate(); }}
                    >
                      <Ionicons name="refresh-outline" size={18} color="#000" />
                      <Text style={[styles.actionBtnText, { color: '#000' }]}>Again</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* ── Generate CTA ── */}
          <View style={styles.ctaWrap}>
            {generating ? (
              <View style={styles.progressWrap}>
                <View style={styles.progressRow}>
                  <ActivityIndicator color={Colors.brand.gold} size="small" />
                  <Text style={styles.progressText}>Generating… {Math.round(progress)}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <LinearGradient
                    colors={[Colors.brand.goldDark, Colors.brand.gold, Colors.brand.goldLight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: `${progress}%` as any }]}
                  />
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={generate}
                style={[styles.ctaBtn, !prompt.trim() && styles.ctaBtnDim]}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={
                    prompt.trim()
                      ? [Colors.brand.goldDark, Colors.brand.gold, Colors.brand.goldLight]
                      : ['rgba(201,168,76,0.3)', 'rgba(201,168,76,0.2)']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="sparkles" size={20} color="#000" />
                <Text style={styles.ctaLabel}>Generate</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  safe: { flex: 1 },
  scroll: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: SIDE_PAD,
  },

  /* Header */
  header: { paddingTop: 8, paddingBottom: 24 },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    color: Colors.brand.gold,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
    lineHeight: 40,
    marginBottom: 10,
  },
  heroSub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.52)',
    lineHeight: 22,
  },
  creditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.brand.goldMuted,
    borderWidth: 1,
    borderColor: Colors.border.gold,
    borderRadius: Radius.full,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginTop: 4,
  },
  creditText: { color: Colors.brand.gold, fontSize: 11, fontWeight: '800' },
  modelCard: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.gold,
    padding: 12,
    marginBottom: 22,
  },
  modelIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brand.gold,
  },
  modelCopy: { flex: 1, paddingHorizontal: 12 },
  modelName: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 3 },
  modelSub: { color: Colors.text.tertiary, fontSize: 12 },
  activeDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Colors.status.success,
  },
  inactiveDot: { backgroundColor: Colors.status.error },
  visualStyleRow: { gap: 10, paddingRight: SIDE_PAD, paddingBottom: 22 },
  visualStyleCard: {
    width: 104,
    height: 132,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'flex-end',
    backgroundColor: Colors.bg.card,
  },
  visualStyleCardSelected: { borderColor: Colors.brand.gold },
  visualStyleImage: { width: '100%', height: '100%' },
  visualStyleLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    color: '#fff',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    paddingHorizontal: 9,
    paddingBottom: 10,
  },
  visualStyleCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brand.gold,
  },
  promptHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  promptHeadingLabel: { marginBottom: 0 },
  enhanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.goldMuted,
  },
  enhanceText: { color: Colors.brand.gold, fontSize: 11, fontWeight: '700' },

  /* Prompt input */
  inputCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    minHeight: 148,
    marginBottom: 24,
  },
  input: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 24,
  },
  clearBtn: { position: 'absolute', top: 12, right: 12 },

  /* Suggestions */
  tryLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 12,
  },
  chips: { gap: 10 },
  chip: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.28)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chipText: {
    fontSize: 13,
    color: Colors.brand.gold,
    fontWeight: '500',
  },

  /* Result */
  resultSection: { marginTop: 28 },
  resultLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 12,
  },
  resultCard: {
    height: 390,
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
    height: '42%',
  },
  resultActions: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  actionBtnGold: {
    backgroundColor: Colors.brand.gold,
    borderColor: 'transparent',
  },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },

  /* CTA bar */
  ctaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 84 : 64,
    paddingHorizontal: SIDE_PAD,
    paddingBottom: 12,
    paddingTop: 12,
    backgroundColor: Colors.bg.primary,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
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
  ctaBtnDim: { opacity: 0.55 },
  ctaLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -0.2,
  },

  /* Progress */
  progressWrap: { gap: 10 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
  },
  progressText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 2 },
});
