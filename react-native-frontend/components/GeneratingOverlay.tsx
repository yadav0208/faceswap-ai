import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/theme';

interface Props {
  visible: boolean;
  progress: number;
  stage: string;
}

export const GeneratingOverlay: React.FC<Props> = ({ visible, progress, stage }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    spin.start();
    pulse.start();
    return () => { spin.stop(); pulse.stop(); };
  }, []);

  const rotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.container, { opacity: fadeAnim }]}>
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        <Animated.View style={[styles.spinnerContainer, { transform: [{ rotate: rotation }] }]}>
          <LinearGradient
            colors={[Colors.brand.purple, Colors.brand.purpleLight, Colors.brand.purple]}
            style={styles.spinnerRing}
          />
        </Animated.View>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.icon}>🤖</Text>
        </Animated.View>
        <Text style={styles.title}>Generating Your Look</Text>
        <Text style={styles.stage}>{stage}</Text>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[Colors.brand.purple, Colors.brand.purpleLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${Math.max(5, progress)}%` }]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { zIndex: 999, alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center', padding: 32 },
  spinnerContainer: {
    width: 110, height: 110, borderRadius: 55,
    overflow: 'hidden', marginBottom: 32,
  },
  spinnerRing: { flex: 1, margin: 3, borderRadius: 55 },
  iconContainer: {
    position: 'absolute', top: 34,
    alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: 44 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 8, textAlign: 'center' },
  stage: { fontSize: 14, color: Colors.brand.purpleLight, marginBottom: 24, textAlign: 'center' },
  progressTrack: {
    width: 220, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden', marginBottom: 8,
  },
  progressFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
});
