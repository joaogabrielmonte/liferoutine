import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type UserProfile = {
  name: string;
  avatarUrl?: string;
  wakeTime: string; // e.g. "07:00"
  sleepTime: string; // e.g. "23:00"
  notificationsEnabled: boolean;
  waterGoalMl: number; // e.g. 2000
  exerciseGoalMin: number; // e.g. 30
};

const PROFILE_KEY = 'liferoutine_user_profile';

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Usuário',
  wakeTime: '07:00',
  sleepTime: '23:00',
  notificationsEnabled: true,
  waterGoalMl: 2000,
  exerciseGoalMin: 30,
};

/**
 * Save user profile securely
 */
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    const jsonStr = JSON.stringify(profile);
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(PROFILE_KEY, jsonStr);
    } else if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(PROFILE_KEY, jsonStr);
    }
  } catch (error) {
    console.warn('Failed to save user profile:', error);
  }
}

/**
 * Load user profile from storage
 */
export async function getUserProfile(): Promise<UserProfile> {
  try {
    let jsonStr: string | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      jsonStr = window.localStorage.getItem(PROFILE_KEY);
    } else if (Platform.OS !== 'web') {
      jsonStr = await SecureStore.getItemAsync(PROFILE_KEY);
    }
    if (jsonStr) {
      return { ...DEFAULT_PROFILE, ...JSON.parse(jsonStr) };
    }
  } catch (error) {
    console.warn('Failed to load user profile:', error);
  }
  return DEFAULT_PROFILE;
}
