import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { BACKEND_API_URL } from '@/services/supabase';
import { saveUserProfile, getUserProfile } from '@/services/storage';

const USER_DB_KEY = 'liferoutine_user_db';
const SESSION_KEY = 'liferoutine_session';
const SESSION_TIMESTAMP_KEY = 'liferoutine_session_timestamp';
const SAVED_CREDENTIALS_KEY = 'liferoutine_saved_credentials';

export type UserAccount = {
  name: string;
  email: string;
  passwordHash: string;
  wakeTime: string;
  sleepTime: string;
  createdAt: string;
};

export type SavedCredentials = {
  email: string;
  password: string;
  rememberMe: boolean;
};

/**
 * Get stored registered user accounts from local SecureStore
 */
async function getUsersDB(): Promise<UserAccount[]> {
  try {
    if (Platform.OS === 'web') return [];
    const json = await SecureStore.getItemAsync(USER_DB_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.warn('Failed to read users DB:', error);
    return [];
  }
}

/**
 * Save user accounts DB locally
 */
async function saveUsersDB(users: UserAccount[]): Promise<void> {
  try {
    if (Platform.OS === 'web') return;
    await SecureStore.setItemAsync(USER_DB_KEY, JSON.stringify(users));
  } catch (error) {
    console.warn('Failed to save users DB:', error);
  }
}

/**
 * Helper to update local account cache and user profile
 */
async function syncLocalAccountAndProfile(user: UserAccount): Promise<void> {
  try {
    const users = await getUsersDB();
    const index = users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
    if (index !== -1) {
      users[index] = { ...users[index], ...user };
    } else {
      users.push(user);
    }
    await saveUsersDB(users);

    const currentProfile = await getUserProfile();
    await saveUserProfile({
      ...currentProfile,
      name: user.name || 'Usuário',
      wakeTime: user.wakeTime || '07:00',
      sleepTime: user.sleepTime || '23:00',
    });
  } catch (err) {
    console.warn('[Auth] Failed to sync local account & profile:', err);
  }
}

/**
 * Save or clear remembered login credentials
 */
export async function saveRememberedCredentials(
  email: string,
  password: string,
  rememberMe: boolean
): Promise<void> {
  try {
    if (Platform.OS === 'web') return;
    if (rememberMe) {
      const creds: SavedCredentials = { email, password, rememberMe: true };
      await SecureStore.setItemAsync(SAVED_CREDENTIALS_KEY, JSON.stringify(creds));
    } else {
      await SecureStore.deleteItemAsync(SAVED_CREDENTIALS_KEY);
    }
  } catch (error) {
    console.warn('Failed to save remembered credentials:', error);
  }
}

/**
 * Get remembered login credentials
 */
export async function getRememberedCredentials(): Promise<SavedCredentials | null> {
  try {
    if (Platform.OS === 'web') return null;
    const json = await SecureStore.getItemAsync(SAVED_CREDENTIALS_KEY);
    return json ? JSON.parse(json) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Register a new user account (Oracle VPS PostgreSQL only — SQLite fallback DISABLED)
 */
export async function registerUser(
  name: string,
  email: string,
  password: string,
  wakeTime: string = '07:00',
  sleepTime: string = '23:00'
): Promise<{ success: boolean; message: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || 'Usuário';

    if (!cleanEmail || !password || password.length < 4) {
      return { success: false, message: 'Preencha um e-mail válido e senha com pelo menos 4 caracteres.' };
    }

    // Register ONLY on remote Oracle VPS PostgreSQL — no SQLite fallback
    let response: Response;
    try {
      response = await fetch(`${BACKEND_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password,
          wakeTime,
          sleepTime,
        }),
      });
    } catch (netError) {
      console.warn('[Auth] Sem conexão com o servidor VPS:', netError);
      return { success: false, message: '❌ Sem conexão com o servidor. Verifique sua internet e tente novamente.' };
    }

    if (!response.ok) {
      const errorBody = await response.text();
      console.warn('[Auth] Erro no cadastro VPS:', errorBody);
      return { success: false, message: 'Erro ao cadastrar no servidor. Tente novamente.' };
    }

    const data = await response.json();
    if (!data.success) {
      return { success: false, message: data.error || 'Erro ao cadastrar usuário.' };
    }

    // Save session locally after successful VPS registration
    const newUserAccount: UserAccount = {
      name: cleanName,
      email: cleanEmail,
      passwordHash: password,
      wakeTime,
      sleepTime,
      createdAt: new Date().toISOString(),
    };
    await syncLocalAccountAndProfile(newUserAccount);

    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(SESSION_KEY, cleanEmail);
      await SecureStore.setItemAsync(SESSION_TIMESTAMP_KEY, Date.now().toString());
    }

    return { success: true, message: '✅ Cadastro realizado com sucesso no servidor!' };
  } catch (error) {
    console.warn('Register error:', error);
    return { success: false, message: 'Erro inesperado ao cadastrar usuário.' };
  }
}

/**
 * Login user (Oracle VPS PostgreSQL only — SQLite fallback DISABLED)
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; message: string; user?: UserAccount }> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    // Login ONLY against remote VPS — no SQLite fallback
    let response: Response;
    try {
      response = await fetch(`${BACKEND_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
    } catch (netError) {
      console.warn('[Auth] Sem conexão com o servidor VPS:', netError);
      return { success: false, message: '❌ Sem conexão com o servidor. Verifique sua internet e tente novamente.' };
    }

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.user) {
        const userAccount: UserAccount = {
          name: data.user.name || 'Usuário',
          email: data.user.email,
          passwordHash: password,
          wakeTime: data.user.wakeTime || '07:00',
          sleepTime: data.user.sleepTime || '23:00',
          createdAt: new Date().toISOString(),
        };

        await syncLocalAccountAndProfile(userAccount);

        if (Platform.OS !== 'web') {
          await SecureStore.setItemAsync(SESSION_KEY, cleanEmail);
          await SecureStore.setItemAsync(SESSION_TIMESTAMP_KEY, Date.now().toString());
        }

        return { success: true, message: '✅ Login efetuado com sucesso!', user: userAccount };
      }

      // Server responded but login failed (wrong credentials)
      const errorData = await response.json().catch(() => ({}));
      return { success: false, message: errorData.error || 'E-mail ou senha incorretos.' };
    }

    return { success: false, message: 'Erro ao conectar com o servidor. Tente novamente.' };
  } catch (error) {
    console.warn('Login error:', error);
    return { success: false, message: 'Erro ao efetuar login.' };
  }
}

/**
 * Reset User Password
 */
export async function resetUserPassword(
  email: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const users = await getUsersDB();
    const index = users.findIndex((u) => u.email === cleanEmail);

    if (index !== -1) {
      users[index].passwordHash = newPassword;
      await saveUsersDB(users);
    }

    return { success: true, message: 'Senha redefinida com sucesso! Faça login com a nova senha.' };
  } catch (error) {
    console.warn('Reset password error:', error);
    return { success: false, message: 'Erro ao redefinir senha.' };
  }
}

/**
 * Get active session user with 30-minute expiration check
 */
export async function getActiveSessionUser(): Promise<UserAccount | null> {
  try {
    if (Platform.OS === 'web') return null;
    const email = await SecureStore.getItemAsync(SESSION_KEY);
    const timestampStr = await SecureStore.getItemAsync(SESSION_TIMESTAMP_KEY);

    if (!email || !timestampStr) return null;

    const lastActive = parseInt(timestampStr, 10);
    const now = Date.now();
    const THIRTY_MINUTES_MS = 30 * 60 * 1000;

    // Check if session has expired (> 30 minutes of inactivity)
    if (now - lastActive > THIRTY_MINUTES_MS) {
      console.log('[Auth] Sessão expirou (mais de 30 min inativo).');
      await logoutUser();
      return null;
    }

    // Refresh activity timestamp
    await SecureStore.setItemAsync(SESSION_TIMESTAMP_KEY, now.toString());

    const users = await getUsersDB();
    const foundUser = users.find((u) => u.email === email);
    if (foundUser) {
      return foundUser;
    }

    const currentProfile = await getUserProfile();
    return {
      name: currentProfile.name || 'Usuário',
      email,
      passwordHash: '',
      wakeTime: currentProfile.wakeTime || '07:00',
      sleepTime: currentProfile.sleepTime || '23:00',
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    return null;
  }
}

/**
 * Logout
 */
export async function logoutUser(): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(SESSION_KEY);
      await SecureStore.deleteItemAsync(SESSION_TIMESTAMP_KEY);
      await SecureStore.deleteItemAsync('liferoutine_user_profile');
    }
  } catch (error) {
    console.warn('Logout error:', error);
  }
}
