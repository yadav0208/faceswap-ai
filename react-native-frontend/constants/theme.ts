export const Colors = {
  bg: {
    primary: '#0A0A0A',
    secondary: '#111111',
    card: '#161616',
    elevated: '#1C1C1C',
    overlay: 'rgba(0,0,0,0.6)',
  },
  brand: {
    gold: '#C9A84C',
    goldLight: '#E2C272',
    goldDark: '#A8863A',
    goldMuted: 'rgba(201,168,76,0.18)',
    // keep these aliases so old references still compile
    purple: '#C9A84C',
    purpleLight: '#E2C272',
    purpleDark: '#A8863A',
    from: '#A8863A',
    to: '#E2C272',
  },
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255,255,255,0.60)',
    tertiary: 'rgba(255,255,255,0.35)',
    accent: '#C9A84C',
    label: '#C9A84C',
  },
  border: {
    subtle: 'rgba(255,255,255,0.06)',
    default: 'rgba(255,255,255,0.10)',
    bright: 'rgba(255,255,255,0.18)',
    gold: 'rgba(201,168,76,0.30)',
  },
  accent: {
    gold: '#C9A84C',
  },
  status: {
    success: '#22C55E',
    error: '#EF4444',
    warning: '#F59E0B',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 40,
};

export const Radius = {
  sm: 8,
  md: 14,
  lg: 18,
  xl: 24,
  full: 9999,
};

// Legacy aliases used by GradientButton
export const BorderRadius = Radius;
export const Typography = {
  h4: { fontWeight: '700' as const, letterSpacing: -0.2 },
  bodySmall: { fontSize: 13, lineHeight: 18 },
  caption: { fontSize: 12, lineHeight: 16 },
};
