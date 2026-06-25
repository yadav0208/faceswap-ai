import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, BorderRadius, Typography, Spacing } from '../constants/theme';
import { PoseTemplate } from '../services/api';
import { API_BASE } from '../services/api';

interface Props {
  pose: PoseTemplate;
  selected: boolean;
  onSelect: (pose: PoseTemplate) => void;
  size?: 'sm' | 'md';
}

export const PoseCard: React.FC<Props> = ({ pose, selected, onSelect, size = 'md' }) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  const cardW = size === 'sm' ? 110 : 140;
  const cardH = size === 'sm' ? 155 : 195;

  const imgUrl = `${API_BASE}/api/poses/${pose.id}/thumbnail`;

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.selectionAsync();
        onSelect(pose);
      }}
      style={[styles.card, { width: cardW, height: cardH }, selected && styles.cardSelected]}
      activeOpacity={0.85}
    >
      {/* Image */}
      <View style={styles.imgContainer}>
        {!imageError ? (
          <Image
            source={{ uri: imgUrl }}
            style={styles.img}
            resizeMode="cover"
            onError={() => setImageError(true)}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderEmoji}>🧍</Text>
          </View>
        )}
        {loading && !imageError && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={Colors.brand.from} size="small" />
          </View>
        )}
      </View>

      {/* Gradient overlay at bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={styles.gradient}
        pointerEvents="none"
      />

      {/* Name */}
      <View style={styles.labelContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {pose.name}
        </Text>
        {pose.is_premium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>PRO</Text>
          </View>
        )}
      </View>

      {/* Selected ring */}
      {selected && (
        <LinearGradient
          colors={[Colors.brand.from, Colors.brand.to]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.selectedRing}
          pointerEvents="none"
        />
      )}

      {/* Checkmark */}
      {selected && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.bg.card,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
  },
  cardSelected: {
    borderColor: 'transparent',
  },
  imgContainer: {
    flex: 1,
  },
  img: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg.elevated,
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg.elevated,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  labelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  premiumBadge: {
    backgroundColor: Colors.accent.gold,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
  },
  selectedRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.lg,
    borderWidth: 2.5,
    opacity: 1,
    backgroundColor: 'transparent',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.brand.from,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
