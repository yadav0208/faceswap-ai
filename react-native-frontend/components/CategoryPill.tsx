import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, BorderRadius, Typography, Spacing } from '../constants/theme';

const CATEGORY_EMOJIS: Record<string, string> = {
  all: '✨',
  fashion: '👗',
  casual: '👕',
  formal: '👔',
  sports: '🏃',
  beach: '🏖️',
  party: '🎉',
};

interface Props {
  label: string;
  active: boolean;
  onPress: () => void;
}

export const CategoryPill: React.FC<Props> = ({ label, active, onPress }) => {
  const emoji = CATEGORY_EMOJIS[label.toLowerCase()] || '🎨';
  const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={[styles.pill, active && styles.pillActive]}
      activeOpacity={0.8}
    >
      {active && (
        <LinearGradient
          colors={[Colors.brand.from, Colors.brand.to]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.label, active && styles.labelActive]}>{displayLabel}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
  },
  pillActive: {
    borderColor: 'transparent',
  },
  emoji: {
    fontSize: 14,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  labelActive: {
    color: Colors.text.primary,
  },
});
