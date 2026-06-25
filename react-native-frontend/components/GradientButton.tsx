import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, BorderRadius, Typography } from '../constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const GradientButton: React.FC<Props> = ({
  label,
  onPress,
  loading = false,
  disabled = false,
  size = 'md',
  variant = 'primary',
  style,
  textStyle,
  icon,
}) => {
  const heights = { sm: 40, md: 52, lg: 60 };
  const fontSizes = { sm: 13, md: 15, lg: 17 };

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  if (variant === 'ghost') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        style={[
          styles.base,
          { height: heights[size] },
          styles.ghost,
          disabled && styles.disabled,
          style,
        ]}
        activeOpacity={0.7}
      >
        {icon}
        {loading ? (
          <ActivityIndicator color={Colors.brand.from} size="small" />
        ) : (
          <Text style={[styles.ghostText, { fontSize: fontSizes[size] }, textStyle]}>
            {label}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        style={[
          styles.base,
          { height: heights[size] },
          styles.secondary,
          disabled && styles.disabled,
          style,
        ]}
        activeOpacity={0.8}
      >
        {icon}
        {loading ? (
          <ActivityIndicator color={Colors.text.primary} size="small" />
        ) : (
          <Text style={[styles.text, { fontSize: fontSizes[size] }, textStyle]}>
            {label}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      style={[styles.base, { height: heights[size] }, disabled && styles.disabled, style]}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={[Colors.brand.from, Colors.brand.to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.full }]}
      />
      {icon}
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={[styles.text, { fontSize: fontSizes[size] }, textStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  text: {
    ...Typography.h4,
    color: Colors.text.primary,
  },
  secondary: {
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.bright,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.brand.from,
  },
  ghostText: {
    ...Typography.h4,
    color: Colors.brand.from,
  },
  disabled: {
    opacity: 0.4,
  },
});
