import { create } from 'zustand';
import type { UserSettings } from '@/types/user';

type ThemeStore = {
  settings: UserSettings;
  setTheme: (theme: UserSettings['theme']) => void;
  toggleNotifications: () => void;
  updateSettings: (patch: Partial<UserSettings>) => void;
};

const defaultSettings: UserSettings = {
  theme: 'system',
  language: 'pt-BR',
  notificationsEnabled: true,
  weekStartsOn: 1,
  showCompletedHabits: true,
};

export const useThemeStore = create<ThemeStore>((set) => ({
  settings: defaultSettings,

  setTheme: (theme) =>
    set((state) => ({ settings: { ...state.settings, theme } })),

  toggleNotifications: () =>
    set((state) => ({
      settings: {
        ...state.settings,
        notificationsEnabled: !state.settings.notificationsEnabled,
      },
    })),

  updateSettings: (patch) =>
    set((state) => ({ settings: { ...state.settings, ...patch } })),
}));
