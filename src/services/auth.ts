import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const USER_DB_KEY = 'liferoutine_user_db';
const SESSION_KEY = 'liferoutine_session';

export type UserAccount = {
  name: string;
  email: string;
  passwordHash: string;
  wakeTime: string;
  sleepTime: string;
  createdAt: string;
};

/**
 * Get stored registered user accounts
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
 * Save user accounts DB
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
 * Register a new user account
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

    const users = await getUsersDB();
    const existing = users.find((u) => u.email === cleanEmail);
    if (existing) {
      return { success: false, message: 'Este e-mail já está cadastrado. Faça login ou redefina sua senha.' };
    }

    const newUser: UserAccount = {
      name: name.trim() || 'Usuário',
      email: cleanEmail,
      passwordHash: password, // local encrypted store
      wakeTime,
      sleepTime,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    await saveUsersDB(users);

    // Save active session
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(SESSION_KEY, cleanEmail);
    }

    return { success: true, message: 'Cadastro realizado com sucesso!' };
  } catch (error) {
    console.warn('Register error:', error);
    return { success: false, message: 'Erro ao cadastrar usuário.' };
  }
}

/**
 * Login user
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; message: string; user?: UserAccount }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const users = await getUsersDB();

    // Default seed fallback if DB is empty
    if (users.length === 0 && cleanEmail === 'gabriel@liferoutine.com') {
      const demoUser: UserAccount = {
        name: 'Gabriel',
        email: 'gabriel@liferoutine.com',
        passwordHash: password || '123456',
        wakeTime: '07:00',
        sleepTime: '23:00',
        createdAt: new Date().toISOString(),
      };
      await saveUsersDB([demoUser]);
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(SESSION_KEY, cleanEmail);
      }
      return { success: true, message: 'Login efetuado com sucesso!', user: demoUser };
    }

    const user = users.find((u) => u.email === cleanEmail);
    if (!user) {
      return { success: false, message: 'E-mail não encontrado. Crie uma conta no cadastro.' };
    }

    if (user.passwordHash !== password) {
      return { success: false, message: 'Senha incorreta. Tente novamente ou redefina sua senha.' };
    }

    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(SESSION_KEY, cleanEmail);
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

    if (index === -1) {
      return { success: false, message: 'E-mail não encontrado na nossa base local.' };
    }

    users[index].passwordHash = newPassword;
    await saveUsersDB(users);

    return { success: true, message: 'Senha redefinida com sucesso! Faça login com a nova senha.' };
  } catch (error) {
    console.warn('Reset password error:', error);
    return { success: false, message: 'Erro ao redefinir senha.' };
  }
}

/**
 * Get active session user
 */
export async function getActiveSessionUser(): Promise<UserAccount | null> {
  try {
    if (Platform.OS === 'web') return null;
    const email = await SecureStore.getItemAsync(SESSION_KEY);
    if (!email) return null;

    const users = await getUsersDB();
    return users.find((u) => u.email === email) || null;
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
    }
  } catch (error) {
    console.warn('Logout error:', error);
  }
}
