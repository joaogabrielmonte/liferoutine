import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { BACKEND_API_URL } from '@/services/supabase';

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
 * Register a new user account (Saves locally & synchronizes with Oracle VPS PostgreSQL)
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
    if (!cleanEmail || !password || password.length < 4) {
      return { success: false, message: 'Preencha um e-mail válido e senha com pelo menos 4 caracteres.' };
    }

    // 1. Try registering on remote Oracle VPS PostgreSQL API
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'Usuário',
          email: cleanEmail,
          password,
          wakeTime,
          sleepTime,
        }),
      });

      if (response.ok) {
        console.log('[Auth] Cadastrado com sucesso no PostgreSQL VPS!');
      }
    } catch (netError) {
      console.warn('[Auth] VPS Offline durante cadastro. Salva no SQLite local.', netError);
    }

    // 2. Save locally for offline-first hybrid support
    const users = await getUsersDB();
    const existing = users.find((u) => u.email === cleanEmail);
    if (!existing) {
      const newUser: UserAccount = {
        name: name.trim() || 'Usuário',
        email: cleanEmail,
        passwordHash: password,
        wakeTime,
        sleepTime,
        createdAt: new Date().toISOString(),
      };
      users.push(newUser);
      await saveUsersDB(users);
    }

    // 3. Save active session & timestamp
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(SESSION_KEY, cleanEmail);
      await SecureStore.setItemAsync(SESSION_TIMESTAMP_KEY, Date.now().toString());
    }

    return { success: true, message: 'Cadastro realizado com sucesso!' };
  } catch (error) {
    console.warn('Register error:', error);
    return { success: false, message: 'Erro ao cadastrar usuário.' };
  }
}

/**
 * Login user (Validates against remote Oracle VPS PostgreSQL API & local cache)
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; message: string; user?: UserAccount }> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try remote VPS login
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

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

          // Save active session & timestamp
          if (Platform.OS !== 'web') {
            await SecureStore.setItemAsync(SESSION_KEY, cleanEmail);
            await SecureStore.setItemAsync(SESSION_TIMESTAMP_KEY, Date.now().toString());
          }

          return { success: true, message: 'Login efetuado com sucesso!', user: userAccount };
        }
      }
    } catch (netError) {
      console.warn('[Auth] VPS Offline no login. Tentando base local...', netError);
    }

    // 2. Fallback to local DB
    const users = await getUsersDB();
    const user = users.find((u) => u.email === cleanEmail);
    if (!user) {
      return { success: false, message: 'E-mail não cadastrado. Crie uma conta na aba "Criar Nova Conta".' };
    }

    if (user.passwordHash !== password) {
      return { success: false, message: 'Senha incorreta. Tente novamente ou redefina sua senha.' };
    }

    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(SESSION_KEY, cleanEmail);
      await SecureStore.setItemAsync(SESSION_TIMESTAMP_KEY, Date.now().toString());
    }

    return { success: true, message: 'Login efetuado com sucesso!', user };
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
    return users.find((u) => u.email === email) || {
      name: 'Usuário',
      email,
      passwordHash: '',
      wakeTime: '07:00',
      sleepTime: '23:00',
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
    }
  } catch (error) {
    console.warn('Logout error:', error);
  }
}
