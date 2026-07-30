import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, TextInput, Alert, ActivityIndicator,
  Image, KeyboardAvoidingView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as Haptics from 'expo-haptics';
import { Colors, Radius } from '../../constants/theme';
import { API_BASE, authFetch } from '../../services/api';
import { saveCreation } from '../../services/savedCreations';

const SIDE_PAD = 16;

type GenerationMode = 'image' | 'video';

const IMAGE_SUGGESTIONS = [
  'A cinematic mountain lake at sunrise, mist over the water, photorealistic landscape',
  'A premium product photograph of a minimalist wristwatch on black stone, dramatic studio light',
  'A futuristic Indian city with clean architecture and electric public transport, cinematic evening',
];

const VIDEO_SUGGESTIONS = [
  'A cheerful Indian child celebrates Raksha Bandhan with a decorated rakhi thali, looks at the camera and wishes everyone a very Happy Raksha Bandhan, warm family home, colorful festive clothes, natural speaking motion',
  'Two children exchange rakhi and sweets, smile at the camera and share a joyful Raksha Bandhan greeting, bright festive room, cinematic child-safe animation',
  'A friendly AI kid presenter explains why Raksha Bandhan celebrates love between siblings, colorful classroom, clear speaking gestures, vertical social video',
];

function ResultVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
    instance.play();
  });
  return <VideoView player={player} style={styles.resultMedia} nativeControls contentFit="cover" />;
}

export default function CreateScreen() {
  const [mode, setMode] = useState<GenerationMode>('image');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [providerReady, setProviderReady] = useState<boolean | null>(null);
  const [progress, setProgress] = useState(0);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestions = mode === 'video' ? VIDEO_SUGGESTIONS : IMAGE_SUGGESTIONS;

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((response) => response.json())
      .then((data) => setProviderReady(Boolean(data.provider_configured)))
      .catch(() => setProviderReady(false));
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  function changeMode(nextMode: GenerationMode) {
    Haptics.selectionAsync();
    setMode(nextMode);
    setPrompt('');
    setResultUri(null);
  }

  async function enhancePrompt() {
    if (prompt.trim().length < 3) {
      Alert.alert('Add an idea', `Write a short ${mode} idea first.`);
      return;
    }
    setEnhancing(true);
    try {
      const formData = new FormData();
      formData.append(
        'prompt',
        mode === 'video'
          ? `Kids domain, child-safe and age-appropriate video: ${prompt.trim()}`
          : `Text-to-image prompt: ${prompt.trim()}`
      );
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
    if (prompt.trim().length < 3) {
      Alert.alert(
        'Add a prompt',
        mode === 'video'
          ? 'Describe the kids video you want to create.'
          : 'Describe any image you want to create.'
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGenerating(true);
    setResultUri(null);
    setProgress(5);

    const progressInterval = setInterval(() => {
      setProgress((value) => {
        if (value >= 85) {
          clearInterval(progressInterval);
          return 85;
        }
        return value + (mode === 'video' ? 2 : 4);
      });
    }, 700);

    try {
      const formData = new FormData();
      formData.append('prompt', prompt.trim());
      formData.append('generation_type', mode);
      formData.append('domain', mode === 'video' ? 'kids' : 'general');

      const response = await authFetch(`${API_BASE}/api/generate/prompt`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || `Server error ${response.status}`);

      clearInterval(progressInterval);
      setProgress(88);
      let tries = 0;
      const poll = async () => {
        tries += 1;
        try {
          const status = await authFetch(`${API_BASE}/api/generate/${data.id}/status`)
            .then((result) => result.json());
          setProgress(status.progress ?? 88);
          if (status.status === 'completed' && status.result_image_url) {
            setProgress(100);
            setResultUri(`${API_BASE}${status.result_image_url}&t=${Date.now()}`);
            setGenerating(false);
          } else if (status.status === 'failed') {
            throw new Error(status.error_message || 'Generation failed');
          } else if (tries > 120) {
            throw new Error('Generation timed out. Please try again.');
          } else {
            pollRef.current = setTimeout(poll, 1500);
          }
        } catch (error: any) {
          setGenerating(false);
          Alert.alert('Generation error', error.message || 'Something went wrong.');
        }
      };
      poll();
    } catch (error: any) {
      clearInterval(progressInterval);
      setGenerating(false);
      Alert.alert('Failed', error.message || 'Could not connect to the server.');
    }
  }

  function useSuggestion(suggestion: string) {
    Haptics.selectionAsync();
    setPrompt(suggestion);
    inputRef.current?.focus();
  }

  async function saveResult() {
    if (!resultUri) return;
    try {
      await saveCreation({
        uri: resultUri,
        title: mode === 'video' ? 'Kids AI Video' : 'AI Image',
        type: mode === 'video' ? 'video' : 'photo',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved to My Studio', 'Open My Studio to preview it or save it to your gallery.');
    } catch (error: any) {
      Alert.alert('Could not save', error.message || 'Please try again.');
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView edges={['top']} style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.safe}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.scroll,
              { paddingBottom: Platform.OS === 'ios' ? 190 : 170 },
            ]}
          >
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.eyebrow}>
                    {mode === 'video' ? 'ANVA KIDS CREATE' : 'ANVA IMAGE CREATE'}
                  </Text>
                  <Text style={styles.title}>Create with text</Text>
                </View>
                <View style={styles.kidsPill}>
                  <Ionicons
                    name={mode === 'video' ? 'happy' : 'images'}
                    size={15}
                    color="#090909"
                  />
                  <Text style={styles.kidsPillText}>
                    {mode === 'video' ? 'KIDS' : 'ALL IMAGES'}
                  </Text>
                </View>
              </View>
              <Text style={styles.subtitle}>
                {mode === 'video'
                  ? 'Create child-safe short vertical videos from a simple idea.'
                  : 'Generate any kind of image from a detailed text description.'}
              </Text>
            </View>

            <View style={styles.modeSelector}>
              {([
                { id: 'image', label: 'Text to Image', icon: 'image-outline' },
                { id: 'video', label: 'Text to Video', icon: 'videocam-outline' },
              ] as const).map((item) => {
                const selected = mode === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.modeButton, selected && styles.modeButtonSelected]}
                    onPress={() => changeMode(item.id)}
                  >
                    {selected && (
                      <LinearGradient
                        colors={[Colors.brand.goldDark, Colors.brand.gold]}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                    <Ionicons
                      name={item.icon}
                      size={19}
                      color={selected ? '#090909' : 'rgba(255,255,255,0.55)'}
                    />
                    <Text style={[styles.modeText, selected && styles.modeTextSelected]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modelCard}>
              <View style={styles.modelIcon}>
                <Ionicons
                  name={mode === 'video' ? 'videocam' : 'color-wand'}
                  size={20}
                  color="#090909"
                />
              </View>
              <View style={styles.modelCopy}>
                <Text style={styles.modelName}>
                  {mode === 'video' ? 'Kids Video Studio' : 'AI Image Studio'}
                </Text>
                <Text style={styles.modelSub}>
                  {providerReady === null
                    ? 'Checking Anva AI…'
                    : providerReady
                      ? `Anva AI ${mode === 'video' ? 'Text-to-Video' : 'Image'} · ready`
                      : 'Anva AI service unavailable'}
                </Text>
              </View>
              <View style={[styles.activeDot, providerReady === false && styles.inactiveDot]} />
            </View>

            <View style={styles.promptHeading}>
              <View>
                <Text style={styles.sectionLabel}>YOUR IDEA</Text>
                <Text style={styles.sectionHint}>
                  {mode === 'video'
                    ? 'Describe the child, action, greeting, setting and camera.'
                    : 'Describe any subject, scene, mood, composition and art style.'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={enhancePrompt}
                disabled={enhancing || prompt.trim().length < 3}
                style={styles.enhanceButton}
              >
                {enhancing
                  ? <ActivityIndicator size="small" color={Colors.brand.gold} />
                  : <Ionicons name="sparkles-outline" size={14} color={Colors.brand.gold} />}
                <Text style={styles.enhanceText}>{enhancing ? 'Improving' : 'Enhance'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputCard}>
              <TextInput
                ref={inputRef}
                value={prompt}
                onChangeText={setPrompt}
                placeholder={
                  mode === 'video'
                    ? 'Example: A cheerful AI kid celebrates Raksha Bandhan and wishes everyone…'
                    : 'Describe any image you want to create…'
                }
                placeholderTextColor="rgba(255,255,255,0.25)"
                style={styles.input}
                multiline
                maxLength={700}
                textAlignVertical="top"
              />
              <Text style={styles.count}>{prompt.length}/700</Text>
            </View>

            <View style={styles.inspirationHeading}>
              <Text style={styles.sectionLabel}>INSPIRATION</Text>
              <Text style={styles.inspirationMode}>
                {mode === 'video' ? 'VIDEO PROMPTS' : 'IMAGE PROMPTS'}
              </Text>
            </View>
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestions}
            >
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={suggestion}
                  style={styles.suggestionCard}
                  onPress={() => useSuggestion(suggestion)}
                  activeOpacity={0.76}
                >
                  <View style={styles.suggestionNumber}>
                    <Text style={styles.suggestionNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.suggestionText} numberOfLines={4}>{suggestion}</Text>
                  <Ionicons name="arrow-up-outline" size={16} color={Colors.brand.gold} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {resultUri && (
              <View style={styles.resultSection}>
                <Text style={styles.sectionLabel}>
                  {mode === 'video' ? 'YOUR KIDS VIDEO' : 'YOUR IMAGE'}
                </Text>
                <View style={styles.resultCard}>
                  {mode === 'video'
                    ? <ResultVideo uri={resultUri} />
                    : <Image source={{ uri: resultUri }} style={styles.resultMedia} resizeMode="cover" />}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.72)']}
                    style={styles.resultGradient}
                  />
                  <View style={styles.resultActions}>
                    <TouchableOpacity style={styles.actionButton} onPress={saveResult}>
                      <Ionicons name="download-outline" size={18} color="#fff" />
                      <Text style={styles.actionText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonGold]}
                      onPress={() => {
                        setResultUri(null);
                        generate();
                      }}
                    >
                      <Ionicons name="refresh-outline" size={18} color="#090909" />
                      <Text style={[styles.actionText, { color: '#090909' }]}>Again</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.ctaWrap}>
            {generating ? (
              <View style={styles.progressWrap}>
                <View style={styles.progressRow}>
                  <ActivityIndicator color={Colors.brand.gold} />
                  <Text style={styles.progressText}>
                    Creating {mode}… {Math.round(progress)}%
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <LinearGradient
                    colors={[Colors.brand.goldDark, Colors.brand.gold]}
                    style={[styles.progressFill, { width: `${progress}%` }]}
                  />
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={generate}
                style={[styles.ctaButton, prompt.trim().length < 3 && styles.ctaDisabled]}
              >
                <LinearGradient
                  colors={
                    prompt.trim().length >= 3
                      ? [Colors.brand.goldDark, Colors.brand.gold, Colors.brand.goldLight]
                      : ['rgba(201,168,76,0.28)', 'rgba(201,168,76,0.18)']
                  }
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons
                  name={mode === 'video' ? 'videocam' : 'sparkles'}
                  size={20}
                  color="#090909"
                />
                <Text style={styles.ctaText}>
                  {mode === 'video' ? 'Generate Kids Video' : 'Generate Image'}
                </Text>
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
    width: '100%', maxWidth: 720, alignSelf: 'center',
    paddingHorizontal: SIDE_PAD, paddingTop: 8,
  },
  header: { paddingBottom: 20 },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
  },
  eyebrow: {
    color: Colors.brand.gold, fontSize: 10, fontWeight: '800',
    letterSpacing: 2.6, marginBottom: 5,
  },
  title: { color: '#fff', fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -1 },
  subtitle: { color: 'rgba(255,255,255,0.50)', fontSize: 14, lineHeight: 21, marginTop: 7 },
  kidsPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 11, paddingVertical: 8, borderRadius: Radius.full,
    backgroundColor: Colors.brand.gold,
  },
  kidsPillText: { color: '#090909', fontSize: 10, fontWeight: '900' },
  modeSelector: {
    flexDirection: 'row', gap: 8, padding: 4, marginBottom: 14,
    borderRadius: Radius.full, backgroundColor: Colors.bg.card,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  modeButton: {
    flex: 1, minHeight: 48, borderRadius: Radius.full, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  modeButtonSelected: {},
  modeText: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '700' },
  modeTextSelected: { color: '#090909' },
  modelCard: {
    flexDirection: 'row', alignItems: 'center', minHeight: 66,
    padding: 11, marginBottom: 24, borderRadius: Radius.lg,
    backgroundColor: Colors.bg.card, borderWidth: 1, borderColor: Colors.border.gold,
  },
  modelIcon: {
    width: 42, height: 42, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.brand.gold,
  },
  modelCopy: { flex: 1, paddingHorizontal: 11 },
  modelName: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 3 },
  modelSub: { color: Colors.text.tertiary, fontSize: 11 },
  activeDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.status.success },
  inactiveDot: { backgroundColor: Colors.status.error },
  promptHeading: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between', gap: 12, marginBottom: 10,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.42)', fontSize: 11,
    fontWeight: '800', letterSpacing: 2, marginBottom: 5,
  },
  sectionHint: { color: 'rgba(255,255,255,0.38)', fontSize: 11, lineHeight: 16 },
  enhanceButton: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    minHeight: 34, paddingHorizontal: 11, borderRadius: Radius.full,
    backgroundColor: Colors.brand.goldMuted,
  },
  enhanceText: { color: Colors.brand.gold, fontSize: 11, fontWeight: '700' },
  inputCard: {
    minHeight: 160, padding: 15, marginBottom: 24, borderRadius: Radius.lg,
    backgroundColor: Colors.bg.card, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
  },
  input: {
    width: '100%', minHeight: 120, color: '#fff',
    fontSize: 15, lineHeight: 23, padding: 0, textAlignVertical: 'top',
  },
  count: { alignSelf: 'flex-end', color: 'rgba(255,255,255,0.25)', fontSize: 9 },
  inspirationHeading: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8,
  },
  inspirationMode: { color: Colors.brand.gold, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  suggestions: { gap: 10, paddingRight: SIDE_PAD, paddingBottom: 4 },
  suggestionCard: {
    width: 272, minHeight: 126, padding: 14, borderRadius: Radius.md,
    alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.bg.card,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)',
  },
  suggestionNumber: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(201,168,76,0.12)',
  },
  suggestionNumberText: { color: Colors.brand.gold, fontSize: 11, fontWeight: '800' },
  suggestionText: {
    flex: 1, color: 'rgba(255,255,255,0.70)', fontSize: 12, lineHeight: 18,
  },
  resultSection: { marginTop: 28 },
  resultCard: {
    height: 420, borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: Colors.bg.card,
  },
  resultMedia: { width: '100%', height: '100%' },
  resultGradient: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: '34%',
  },
  resultActions: {
    position: 'absolute', left: 14, right: 14, bottom: 14, flexDirection: 'row', gap: 8,
  },
  actionButton: {
    flex: 1, minHeight: 42, borderRadius: Radius.full,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  actionButtonGold: { backgroundColor: Colors.brand.gold },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  ctaWrap: {
    position: 'absolute', left: 0, right: 0,
    bottom: Platform.OS === 'ios' ? 84 : 64,
    paddingHorizontal: SIDE_PAD, paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: 'rgba(12,12,12,0.96)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  ctaButton: {
    width: '100%', maxWidth: 720, alignSelf: 'center',
    height: 56, borderRadius: Radius.full, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
  },
  ctaDisabled: { opacity: 0.48 },
  ctaText: { color: '#090909', fontSize: 15, fontWeight: '800' },
  progressWrap: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: 9 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  progressText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  progressTrack: {
    height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.10)',
  },
  progressFill: { height: '100%', borderRadius: 2 },
});
