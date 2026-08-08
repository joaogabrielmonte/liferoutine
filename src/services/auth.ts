import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { BACKEND_API_URL } from '@/services/supabase';
import { saveUserProfile, getUserProfile, DEFAULT_PROFILE } from '@/services/storage';

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
 * Helper to store item across Native (SecureStore) and Web (localStorage)
 */
async function setSessionItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (e) {
    console.warn(`Failed to set session item [${key}]:`, e);
  }
}

/**
 * Helper to read item across Native (SecureStore) and Web (localStorage)
 */
async function getSessionItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  } catch (e) {
    return null;
  }
}

/**
 * Helper to delete item across Native (SecureStore) and Web (localStorage)
 */
async function removeSessionItem(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (e) {
    console.warn(`Failed to delete session item [${key}]:`, e);
  }
}

/**
 * Get stored registered user accounts from local storage
 */
async function getUsersDB(): Promise<UserAccount[]> {
  try {
    const json = await getSessionItem(USER_DB_KEY);
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
    await setSessionItem(USER_DB_KEY, JSON.stringify(users));
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
    await saveUserProfile({
      ...DEFAULT_PROFILE,
      name: user.name,
      wakeTime: user.wakeTime,
      sleepTime: user.sleepTime,
    });
  } catch (error) {
    console.warn('Failed to sync local account and profile:', error);
  }
}

/**
 * Save remembered login credentials
 */
export async function saveRememberedCredentials(
  email: string,
  password: string,
  rememberMe: boolean
): Promise<void> {
  try {
    if (rememberMe) {
      const data: SavedCredentials = { email, password, rememberMe };
      await setSessionItem(SAVED_CREDENTIALS_KEY, JSON.stringify(data));
    } else {
      await removeSessionItem(SAVED_CREDENTIALS_KEY);
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
    const json = await getSessionItem(SAVED_CREDENTIALS_KEY);
    if (!json) return null;
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
}

/**
 * Register new user (Oracle VPS PostgreSQL primary, local fallback)
 */
export async function registerUser(
  name: string,
  email: string,
  password: string,
  wakeTime: string = '07:00',
  sleepTime: string = '23:00'
): Promise<{ success: boolean; message: string }> {
  try {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

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
      return { success: false, message: 'Sem conexão com o servidor VPS. Tente novamente.' };
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

    const newUserAccount: UserAccount = {
      name: cleanName,
      email: cleanEmail,
      passwordHash: password,
      wakeTime,
      sleepTime,
      createdAt: new Date().toISOString(),
    };
    await syncLocalAccountAndProfile(newUserAccount);

    await setSessionItem(SESSION_KEY, cleanEmail);
    await setSessionItem(SESSION_TIMESTAMP_KEY, Date.now().toString());

    return { success: true, message: '✅ Cadastro realizado com sucesso no servidor!' };
  } catch (error) {
    console.warn('Register error:', error);
    return { success: false, message: 'Erro inesperado ao cadastrar usuário.' };
  }
}

/**
 * Login user (Oracle VPS PostgreSQL)
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; message: string; user?: UserAccount }> {
  try {
    const cleanEmail = email.trim().toLowerCase();

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

        // Store session persisted across Web (localStorage) and Native (SecureStore)
        await setSessionItem(SESSION_KEY, cleanEmail);
        await setSessionItem(SESSION_TIMESTAMP_KEY, Date.now().toString());

        return { success: true, message: '✅ Login efetuado com sucesso!', user: userAccount };
      }
    }

    const errorData = await response.json().catch(() => ({}));
    return { success: false, message: errorData.error || 'E-mail ou senha incorretos.' };
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
 * Get active session user with 30-minute expiration check (Persisted across Web & Native)
 */
export async function getActiveSessionUser(): Promise<UserAccount | null> {
  try {
    const email = await getSessionItem(SESSION_KEY);
    const timestampStr = await getSessionItem(SESSION_TIMESTAMP_KEY);

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
    await setSessionItem(SESSION_TIMESTAMP_KEY, now.toString());

    const users = await getUsersDB();
    const foundUser = users.find((u) => u.email === email);
    if (foundUser) {
      return foundUser;
    }

    const currentProfile = await getUserProfile();
    return {
      name: currentProfile.name || 'Gabriel Monte',
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
 * Explicit Logout (Clears session on Web & Native)
 */
export async function logoutUser(): Promise<void> {
  try {
    await removeSessionItem(SESSION_KEY);
    await removeSessionItem(SESSION_TIMESTAMP_KEY);
    await removeSessionItem('liferoutine_user_profile');
  } catch (error) {
    console.warn('Logout error:', error);
  }
}
