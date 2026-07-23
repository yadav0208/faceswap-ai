import React, { useState, useRef } from 'react';
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

export default function CreateScreen() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      formData.append('prompt', prompt.trim());

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
              { paddingBottom: Platform.OS === 'ios' ? 130 : 110 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Header ── */}
            <View style={styles.header}>
              <Text style={styles.sectionLabel}>CUSTOM GENERATOR</Text>
              <Text style={styles.heroTitle}>Dream it,{'\n'}generate it.</Text>
              <Text style={styles.heroSub}>
                Describe any visual and Anva will{'\n'}render it in studio quality.
              </Text>
            </View>

            {/* ── Prompt Input ── */}
            <View style={styles.inputCard}>
              <TextInput
                ref={inputRef}
                value={prompt}
                onChangeText={setPrompt}
                placeholder="A cinematic close-up portrait of…"
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
            <Text style={styles.tryLabel}>TRY ONE OF THESE</Text>
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
                    <TouchableOpacity style={styles.actionBtn}>
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
  scroll: { paddingHorizontal: SIDE_PAD },

  /* Header */
  header: { paddingTop: 8, paddingBottom: 24 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    color: Colors.brand.gold,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
    lineHeight: 46,
    marginBottom: 10,
  },
  heroSub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.52)',
    lineHeight: 22,
  },

  /* Prompt input */
  inputCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    minHeight: 148,
    marginBottom: 26,
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
    paddingHorizontal: SIDE_PAD,
    paddingBottom: Platform.OS === 'ios' ? 36 : 22,
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
