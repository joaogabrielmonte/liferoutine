import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Supabase & Docker API Config & Adapter for Expo & React Native
 */
export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key-here';

/**
 * Active Oracle VPS Production API URL via HTTPS (SSL certificate from Let's Encrypt)
 * kingslityc.com.br has valid DNS + SSL cert
 * /liferoutine/ path proxied by Nginx to liferoutine_api:4000
 */
const getActiveApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_BACKEND_API_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_API_URL;
  }
  return 'https://kingslityc.com.br/liferoutine';
};

export const BACKEND_API_URL = getActiveApiUrl();

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
        message: `Servidor Oracle VPS Online! PostgreSQL: ${data.database}`,
      };
    }
  } catch (error) {}

  // Fallback: try direct IP
  try {
    const fallbackRes = await fetch('http://147.15.72.151:4000/health');
    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      return {
        online: true,
        dbConnected: data.database === 'connected',
        message: `Servidor VPS IP Online! PostgreSQL: ${data.database}`,
      };
    }
  } catch (e) {}

  return { online: false, dbConnected: false, message: 'Servidor Offline. Usando SQLite Local.' };
}
