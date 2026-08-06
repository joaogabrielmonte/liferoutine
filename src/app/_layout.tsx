import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, LogBox } from 'react-native';
import { useThemeStore } from '@/stores/useThemeStore';
import { useHabitsStore } from '@/stores/useHabitsStore';

// Ignore harmless Expo Go remote push notification deprecation warning (we use 100% local notifications)
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'functionality provided by expo-notifications was removed from Expo Go',
]);

export default function RootLayout() {
  const systemScheme = useColorScheme();
  const { settings } = useThemeStore();
  const { loadStore } = useHabitsStore();

  const scheme =
    settings.theme === 'system'
      ? (systemScheme ?? 'light')
      : settings.theme;

  useEffect(() => {
    // Hide the splash screen immediately — Expo Router calls preventAutoHideAsync
    // internally so we MUST call hideAsync, otherwise the splash stays forever.
    SplashScreen.hideAsync().catch(() => {});

    // Load SQLite data in background (non-blocking)
    loadStore();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Slot />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
