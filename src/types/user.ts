export type UserProfile = {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  createdAt: string;
};

export type UserSettings = {
  theme: 'light' | 'dark' | 'system';
  language: 'pt-BR' | 'en';
  notificationsEnabled: boolean;
  weekStartsOn: 0 | 1; // 0=Sunday, 1=Monday
  showCompletedHabits: boolean;
};
