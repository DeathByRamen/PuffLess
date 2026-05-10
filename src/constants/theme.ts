import { Platform } from 'react-native';

export const Colors = {
  // Mint accent
  mint: '#4ade80',
  mintDark: '#22c55e',
  mintLight: '#bbf7d0',
  mintMuted: 'rgba(74, 222, 128, 0.10)',
  mintGlow: 'rgba(74, 222, 128, 0.18)',
  mintSubtle: 'rgba(74, 222, 128, 0.06)',

  // Charcoal backgrounds (darkest to lightest)
  bg: '#0f1117',
  bgCard: '#1a1d27',
  bgElevated: '#222636',
  bgInput: '#262a36',
  bgHover: '#2d3243',

  // Semantic
  success: '#4ade80',
  successDim: 'rgba(74, 222, 128, 0.15)',
  warning: '#fbbf24',
  warningDim: 'rgba(251, 191, 36, 0.15)',
  danger: '#f87171',
  dangerDim: 'rgba(248, 113, 113, 0.15)',

  // Extra accents
  coral: '#fb7185',
  amber: '#fbbf24',
  violet: '#a78bfa',
  sky: '#38bdf8',

  // Text
  white: '#ffffff',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textDim: '#475569',
  textInverse: '#0f1117',

  // Borders
  border: '#2d3243',
  borderLight: '#222636',
  divider: '#1e2233',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const Shadows = {
  sm: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
    android: { elevation: 2 },
    default: {},
  }) as object,
  md: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    android: { elevation: 4 },
    default: {},
  }) as object,
  lg: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16 },
    android: { elevation: 8 },
    default: {},
  }) as object,
  glow: Platform.select({
    ios: { shadowColor: '#4ade80', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 12 },
    android: { elevation: 4 },
    default: {},
  }) as object,
};

export const Type = {
  h1: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5, color: Colors.text },
  h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3, color: Colors.text },
  h3: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.2, color: Colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22, color: Colors.text },
  bodyMedium: { fontSize: 15, fontWeight: '500' as const, lineHeight: 22, color: Colors.text },
  bodySm: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18, color: Colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '500' as const, color: Colors.textMuted },
  label: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  number: { fontSize: 48, fontWeight: '800' as const, letterSpacing: -1, color: Colors.text },
  numberLg: { fontSize: 64, fontWeight: '800' as const, letterSpacing: -2, color: Colors.text },
};
