import { useColorScheme as useRNColorScheme } from 'react-native';
import { useThemeStore } from '@/stores/useThemeStore';
import { Colors, type ColorScheme } from '@/constants/theme';

export type ThemeColors = typeof Colors.light;

export function useTheme() {
  const rawScheme = useRNColorScheme();
  const systemScheme: ColorScheme =
    rawScheme === 'dark' ? 'dark' : 'light';

  const { settings } = useThemeStore();

  const scheme: ColorScheme =
    settings.theme === 'system'
      ? systemScheme
      : (settings.theme as ColorScheme);

  return {
    scheme,
    colors: Colors[scheme],
    isDark: scheme === 'dark',
  };
}
