// LifeRoutine — Design System
// Inspired by Material Design 3, Notion, Todoist, TickTick

import { Platform } from 'react-native';

// ─────────────────────────────────────────────
// COLORS
// ─────────────────────────────────────────────

export const Palette = {
  // Primary (Blue)
  primary50: '#EFF6FF',
  primary100: '#DBEAFE',
  primary200: '#BFDBFE',
  primary300: '#93C5FD',
  primary400: '#60A5FA',
  primary500: '#3B82F6',
  primary600: '#2563EB',
  primary700: '#1D4ED8',
  primary800: '#1E40AF',
  primary900: '#1E3A8A',

  // Success (Green)
  success50: '#F0FDF4',
  success100: '#DCFCE7',
  success500: '#22C55E',
  success600: '#16A34A',
  success700: '#15803D',

  // Danger (Red)
  danger50: '#FFF1F2',
  danger100: '#FFE4E6',
  danger500: '#EF4444',
  danger600: '#DC2626',
  danger700: '#B91C1C',

  // Warning (Amber)
  warning50: '#FFFBEB',
  warning100: '#FEF3C7',
  warning500: '#F59E0B',
  warning600: '#D97706',
  warning700: '#B45309',

  // Info (Cyan)
  info50: '#ECFEFF',
  info100: '#CFFAFE',
  info500: '#06B6D4',
  info600: '#0891B2',

  // Neutral
  neutral50: '#F8FAFC',
  neutral100: '#F1F5F9',
  neutral200: '#E2E8F0',
  neutral300: '#CBD5E1',
  neutral400: '#94A3B8',
  neutral500: '#64748B',
  neutral600: '#475569',
  neutral700: '#334155',
  neutral800: '#1E293B',
  neutral900: '#0F172A',
  neutral950: '#020617',

  // LifeRoutine Web Design System Tokens
  webObsidian: '#0D1117',
  webGraphite: '#161B22',
  webBorder: '#30363D',
  webAmber: '#F59E0B',
  webEmerald: '#10B981',
  webTextPrimary: '#F0F6FC',
  webTextSecondary: '#8B949E',

  // Pure
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const Colors = {
  light: {
    // Brand
    primary: Palette.primary600,
    primaryLight: Palette.primary100,
    primaryDark: Palette.primary700,

    // Semantic
    success: Palette.success500,
    successLight: Palette.success50,
    danger: Palette.danger500,
    dangerLight: Palette.danger50,
    warning: Palette.warning500,
    warningLight: Palette.warning50,
    info: Palette.info500,
    infoLight: Palette.info50,

    // Background
    background: '#FFFFFF',
    backgroundSecondary: Palette.neutral50,
    backgroundElement: Palette.neutral100,
    backgroundSelected: Palette.neutral200,
    surface: Palette.neutral50,
    surfaceElevated: '#FFFFFF',

    // Text
    text: '#111827',
    textSecondary: Palette.neutral500,
    textTertiary: Palette.neutral400,
    textInverse: '#FFFFFF',
    textOnPrimary: '#FFFFFF',

    // Border
    border: Palette.neutral200,
    borderStrong: Palette.neutral300,

    // Icon
    icon: Palette.neutral600,
    iconSecondary: Palette.neutral400,

    // Tab Bar
    tabBar: '#FFFFFF',
    tabBarBorder: Palette.neutral200,
    tabActive: Palette.primary600,
    tabInactive: Palette.neutral400,

    // Misc
    overlay: 'rgba(0, 0, 0, 0.5)',
    shimmer: Palette.neutral200,
  },
  dark: {
    // Brand
    primary: Palette.primary500,
    primaryLight: 'rgba(59, 130, 246, 0.15)',
    primaryDark: Palette.primary400,

    // Semantic
    success: Palette.success500,
    successLight: 'rgba(34, 197, 94, 0.15)',
    danger: Palette.danger500,
    dangerLight: 'rgba(239, 68, 68, 0.15)',
    warning: Palette.warning500,
    warningLight: 'rgba(245, 158, 11, 0.15)',
    info: Palette.info500,
    infoLight: 'rgba(6, 182, 212, 0.15)',

    // Background
    background: '#0F172A',
    backgroundSecondary: '#1A2235',
    backgroundElement: '#1E293B',
    backgroundSelected: '#253047',
    surface: '#1E293B',
    surfaceElevated: '#253047',

    // Text
    text: '#F9FAFB',
    textSecondary: Palette.neutral400,
    textTertiary: Palette.neutral500,
    textInverse: '#111827',
    textOnPrimary: '#FFFFFF',

    // Border
    border: 'rgba(255, 255, 255, 0.08)',
    borderStrong: 'rgba(255, 255, 255, 0.15)',

    // Icon
    icon: Palette.neutral400,
    iconSecondary: Palette.neutral600,

    // Tab Bar
    tabBar: '#1E293B',
    tabBarBorder: 'rgba(255, 255, 255, 0.08)',
    tabActive: Palette.primary500,
    tabInactive: Palette.neutral500,

    // Misc
    overlay: 'rgba(0, 0, 0, 0.7)',
    shimmer: Palette.neutral800,
  },
} as const;

export type ColorScheme = 'light' | 'dark';
export type ThemeColors = typeof Colors.light;

// ─────────────────────────────────────────────
// SPACING — Multiples of 4
// ─────────────────────────────────────────────

export const Spacing = {
  px: 1,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
  '7xl': 96,
  // Legacy aliases
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export type SpacingKey = keyof typeof Spacing;

// ─────────────────────────────────────────────
// TYPOGRAPHY — Inter
// ─────────────────────────────────────────────

export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const FontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 15,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
  '6xl': 40,
} as const;

export const LineHeight = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.625,
} as const;

// Typography Hierarchy
export const Typography = {
  display: {
    fontSize: FontSize['6xl'],
    fontFamily: FontFamily.bold,
    lineHeight: FontSize['6xl'] * LineHeight.tight,
    letterSpacing: -1,
  },
  h1: {
    fontSize: FontSize['5xl'],
    fontFamily: FontFamily.bold,
    lineHeight: FontSize['5xl'] * LineHeight.tight,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: FontSize['4xl'],
    fontFamily: FontFamily.bold,
    lineHeight: FontSize['4xl'] * LineHeight.snug,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: FontSize['3xl'],
    fontFamily: FontFamily.semiBold,
    lineHeight: FontSize['3xl'] * LineHeight.snug,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontFamily: FontFamily.semiBold,
    lineHeight: FontSize['2xl'] * LineHeight.snug,
  },
  subtitle: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.medium,
    lineHeight: FontSize.xl * LineHeight.normal,
  },
  body: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    lineHeight: FontSize.base * LineHeight.normal,
  },
  bodyMedium: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    lineHeight: FontSize.base * LineHeight.normal,
  },
  caption: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    lineHeight: FontSize.sm * LineHeight.normal,
  },
  label: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    lineHeight: FontSize.xs * LineHeight.normal,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
} as const;

// ─────────────────────────────────────────────
// BORDER RADIUS
// ─────────────────────────────────────────────

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

// ─────────────────────────────────────────────
// SHADOWS
// ─────────────────────────────────────────────

export const Shadow = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: { elevation: 2 },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
    default: {},
  }),
  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.16,
      shadowRadius: 24,
    },
    android: { elevation: 12 },
    default: {},
  }),
} as const;

// ─────────────────────────────────────────────
// ANIMATION DURATIONS
// ─────────────────────────────────────────────

export const Duration = {
  fast: 150,
  base: 250,
  slow: 400,
  xslow: 600,
} as const;

// ─────────────────────────────────────────────
// LEGACY (backward compat)
// ─────────────────────────────────────────────

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

// Extend Spacing with legacy word keys
Object.assign(Spacing, {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
});
