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
 * Active Oracle VPS Production API URL
 */
const getActiveApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_BACKEND_API_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_API_URL;
  }
  return 'http://147.15.72.151:4000';
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
  // 1. Try active production VPS IP
  try {
    const res = await fetch(`${BACKEND_API_URL}/health`);
    if (res.ok) {
      const data = await res.json();
      return {
        online: true,
        dbConnected: data.database === 'connected',
        message: `Servidor Oracle VPS Online (${BACKEND_API_URL})! PostgreSQL: ${data.database}`,
      };
    }
  } catch (error) {}

  // 2. Try domain fallback
  try {
    const fallbackRes = await fetch('https://api-liferoutine.kingslityc.com.br/health');
    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      return {
        online: true,
        dbConnected: data.database === 'connected',
        message: `Servidor Oracle VPS Domínio Online! PostgreSQL: ${data.database}`,
      };
    }
  } catch (e) {}

  // 3. Try Supabase fallback
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
