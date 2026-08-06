export type Habit = {
  id: string;
  title: string;
  description?: string;
  icon: string;           // MaterialCommunityIcons name
  color: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  targetDays: number[];   // 0=Sun, 1=Mon, ..., 6=Sat
  targetCount: number;    // times/amount per day
  unit?: string;          // e.g. "copos", "min", "paginas", "vezes"
  reminderTime?: string;  // HH:MM
  reminderEnabled: boolean;
  createdAt: string;      // ISO date
  updatedAt: string;
  archivedAt?: string;
  streak: number;
  bestStreak: number;
};

export type HabitCategory =
  | 'health'
  | 'fitness'
  | 'mindfulness'
  | 'productivity'
  | 'learning'
  | 'social'
  | 'finance'
  | 'creativity'
  | 'other';

export type HabitFrequency = 'daily' | 'weekly' | 'custom';

export type HabitLog = {
  id: string;
  habitId: string;
  date: string;           // YYYY-MM-DD
  completedCount: number;
  completedAt: string;    // ISO datetime
  note?: string;
};

export type HabitWithLogs = Habit & {
  logs: HabitLog[];
  todayLog?: HabitLog;
  isCompletedToday: boolean;
  completionRate: number; // 0-1 (last 7 days)
};

// Icons use MaterialCommunityIcons names
export const HABIT_CATEGORIES: Record<
  HabitCategory,
  { label: string; icon: string; color: string }
> = {
  health:       { label: 'Saude',        icon: 'heart-outline',         color: '#EF4444' },
  fitness:      { label: 'Fitness',       icon: 'dumbbell',              color: '#F59E0B' },
  mindfulness:  { label: 'Mindfulness',   icon: 'brain',                 color: '#8B5CF6' },
  productivity: { label: 'Produtividade', icon: 'target',                color: '#2563EB' },
  learning:     { label: 'Aprendizado',   icon: 'book-open-outline',     color: '#06B6D4' },
  social:       { label: 'Social',        icon: 'account-group-outline', color: '#10B981' },
  finance:      { label: 'Financas',      icon: 'trending-up',           color: '#22C55E' },
  creativity:   { label: 'Criatividade',  icon: 'palette-outline',       color: '#EC4899' },
  other:        { label: 'Outro',         icon: 'star-outline',          color: '#94A3B8' },
};
