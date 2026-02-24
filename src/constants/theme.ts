import { Platform } from 'react-native';

export const Colors = {
  // Primary
  teal: '#0d9488',
  tealDark: '#0f766e',
  tealLight: '#ccfbf1',
  tealMuted: 'rgba(13, 148, 136, 0.08)',
  tealGlow: 'rgba(13, 148, 136, 0.15)',

  // Accent
  coral: '#f97066',
  amber: '#f59e0b',
  emerald: '#10b981',
  violet: '#8b5cf6',
  sky: '#0ea5e9',

  // Semantic
  success: '#10b981',
  successLight: '#ecfdf5',
  warning: '#f59e0b',
  warningLight: '#fffbeb',
  danger: '#ef4444',
  dangerLight: '#fef2f2',

  // Neutrals
  white: '#ffffff',
  bg: '#f8fafc',
  bgCard: '#ffffff',
  bgElevated: '#ffffff',
  bgInput: '#f1f5f9',

  text: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  textInverse: '#ffffff',

  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  divider: '#f1f5f9',

  overlay: 'rgba(15, 23, 42, 0.4)',
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
    ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
    android: { elevation: 1 },
    default: {},
  }) as object,
  md: Platform.select({
    ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
    android: { elevation: 3 },
    default: {},
  }) as object,
  lg: Platform.select({
    ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16 },
    android: { elevation: 6 },
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
