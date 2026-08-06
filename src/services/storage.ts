import * as SecureStore from 'expo-secure-store';

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
  name: 'Gabriel',
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
    await SecureStore.setItemAsync(PROFILE_KEY, jsonStr);
  } catch (error) {
    console.warn('Failed to save user profile to SecureStore:', error);
  }
}

/**
 * Load user profile from SecureStore
 */
export async function getUserProfile(): Promise<UserProfile> {
  try {
    const jsonStr = await SecureStore.getItemAsync(PROFILE_KEY);
    if (jsonStr) {
      return { ...DEFAULT_PROFILE, ...JSON.parse(jsonStr) };
    }
  } catch (error) {
    console.warn('Failed to load user profile from SecureStore:', error);
  }
  return DEFAULT_PROFILE;
}
