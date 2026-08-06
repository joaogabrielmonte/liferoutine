import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Supabase & Docker API Config & Adapter for Expo & React Native
 */
export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key-here';

/**
 * Dynamically resolve computer's local Wi-Fi IP address for physical mobile devices running Expo Go
 */
const getLocalHostIp = (): string => {
  try {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:4000`;
    }
  } catch (e) {}
  return 'http://localhost:4000';
};

export const BACKEND_API_URL =
  process.env.EXPO_PUBLIC_BACKEND_API_URL || getLocalHostIp();

export const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') return Promise.resolve(null);
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') return Promise.resolve();
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') return Promise.resolve();
    return SecureStore.deleteItemAsync(key);
  },
};

export type SyncStatus = 'offline' | 'syncing' | 'synced' | 'error';

/**
 * Test health connection of Docker backend API and PostgreSQL DB
 */
export async function checkBackendHealth(): Promise<{ online: boolean; dbConnected: boolean; message: string }> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/health`);
    if (res.ok) {
      const data = await res.json();
      return {
        online: true,
        dbConnected: data.database === 'connected',
        message: `Servidor Docker Online (${BACKEND_API_URL})! PostgreSQL: ${data.database}`,
      };
    }
  } catch (error) {
    // Fallback to localhost if hostUri fails
    try {
      const fallbackRes = await fetch('http://localhost:4000/health');
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        return {
          online: true,
          dbConnected: data.database === 'connected',
          message: `Servidor Docker Online! PostgreSQL: ${data.database}`,
        };
      }
    } catch (e) {}
  }

  try {
    const resSupabase = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    });
    if (resSupabase.ok || resSupabase.status === 401) {
      return { online: true, dbConnected: true, message: 'Supabase Cloud Conectado!' };
    }
  } catch (error) {}

  return { online: false, dbConnected: false, message: 'Servidor Offline. Usando SQLite Local.' };
}
