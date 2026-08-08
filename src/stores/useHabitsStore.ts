import { create } from 'zustand';
import type { Habit, HabitLog, HabitWithLogs } from '@/types/habit';
import {
  initDatabase,
  fetchHabitsDB,
  fetchLogsDB,
  insertHabitDB,
  updateHabitDB,
  deleteHabitDB,
  insertLogDB,
  deleteLogByDateDB,
} from '@/services/database';

type HabitsState = {
  habits: Habit[];
  logs: HabitLog[];
  isInitialized: boolean;
};

type HabitsActions = {
  loadStore: () => Promise<void>;
  addHabit: (habit: Habit) => Promise<void>;
  updateHabit: (id: string, patch: Partial<Habit>) => Promise<void>;
  archiveHabit: (id: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabitToday: (habitId: string) => Promise<void>;
  incrementHabitToday: (habitId: string, delta?: number) => Promise<void>;
  decrementHabitToday: (habitId: string, delta?: number) => Promise<void>;
};

export type HabitsStore = HabitsState & HabitsActions;

export const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDayOfWeek = () => new Date().getDay(); // 0=Sun

const DEMO_HABITS: Habit[] = [
  {
    id: '1',
    title: 'Beber agua',
    description: 'Meta de 8 copos por dia',
    icon: 'water-outline',
    color: '#06B6D4',
    category: 'health',
    frequency: 'daily',
    targetDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 8,
    unit: 'copos',
    reminderEnabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    streak: 0,
    bestStreak: 0,
  },
  {
    id: '2',
    title: 'Exercitar',
    description: 'Meta de 30 min de treino',
    icon: 'dumbbell',
    color: '#F59E0B',
    category: 'fitness',
    frequency: 'daily',
    targetDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 30,
    unit: 'min',
    reminderEnabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    streak: 0,
    bestStreak: 0,
  },
  {
    id: '3',
    title: 'Meditar',
    description: '10 min de meditacao',
    icon: 'brain',
    color: '#8B5CF6',
    category: 'mindfulness',
    frequency: 'daily',
    targetDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 1,
    unit: 'vez',
    reminderEnabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    streak: 0,
    bestStreak: 0,
  },
  {
    id: '4',
    title: 'Ler',
    description: 'Meta de 20 paginas',
    icon: 'book-open-outline',
    color: '#22C55E',
    category: 'learning',
    frequency: 'daily',
    targetDays: [0, 1, 2, 3, 4, 5, 6],
    targetCount: 20,
    unit: 'paginas',
    reminderEnabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    streak: 0,
    bestStreak: 0,
  },
];

export const useHabitsStore = create<HabitsStore>((set, get) => ({
  habits: DEMO_HABITS,
  logs: [],
  isInitialized: true,

  loadStore: async () => {
    try {
      await initDatabase();
      let dbHabits = await fetchHabitsDB();
      let dbLogs = await fetchLogsDB();

      if (dbHabits.length === 0) {
        for (const habit of DEMO_HABITS) {
          await insertHabitDB(habit);
        }
        dbHabits = await fetchHabitsDB();
      }

      if (dbHabits.length > 0) {
        set({ habits: dbHabits, logs: dbLogs });
      }
    } catch (error) {
      console.warn('Failed to load database in background:', error);
    }
  },

  addHabit: async (habit) => {
    set((state) => ({ habits: [habit, ...state.habits] }));
    await insertHabitDB(habit);
  },

  updateHabit: async (id, patch) => {
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, ...patch, updatedAt: new Date().toISOString() } : h
      ),
    }));
    await updateHabitDB(id, patch);
  },

  archiveHabit: async (id) => {
    const now = new Date().toISOString();
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, archivedAt: now } : h
      ),
    }));
    await updateHabitDB(id, { archivedAt: now });
  },

  deleteHabit: async (id) => {
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
      logs: state.logs.filter((l) => l.habitId !== id),
    }));
    await deleteHabitDB(id);
  },

  toggleHabitToday: async (habitId) => {
    const { habits, logs } = get();
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const today = getTodayStr();
    const existing = logs.find(
      (l) => l.habitId === habitId && l.date === today
    );

    if (existing && existing.completedCount >= habit.targetCount) {
      // Toggle off
      set((state) => ({
        logs: state.logs.filter(
          (l) => !(l.habitId === habitId && l.date === today)
        ),
      }));
      await deleteLogByDateDB(habitId, today);
    } else {
      // Toggle on to targetCount
      const newLog: HabitLog = {
        id: `${habitId}-${today}`,
        habitId,
        date: today,
        completedCount: habit.targetCount,
        completedAt: new Date().toISOString(),
      };
      set((state) => ({
        logs: [...state.logs.filter((l) => l.id !== newLog.id), newLog],
      }));
      await insertLogDB(newLog);
    }
  },

  incrementHabitToday: async (habitId, delta = 1) => {
    const { habits, logs } = get();
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const today = getTodayStr();
    const existing = logs.find(
      (l) => l.habitId === habitId && l.date === today
    );

    const currentCount = existing?.completedCount ?? 0;
    const newCount = currentCount + delta;

    const newLog: HabitLog = {
      id: `${habitId}-${today}`,
      habitId,
      date: today,
      completedCount: newCount,
      completedAt: new Date().toISOString(),
    };

    set((state) => ({
      logs: [...state.logs.filter((l) => l.id !== newLog.id), newLog],
    }));
    await insertLogDB(newLog);
  },

  decrementHabitToday: async (habitId, delta = 1) => {
    const { habits, logs } = get();
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const today = getTodayStr();
    const existing = logs.find(
      (l) => l.habitId === habitId && l.date === today
    );

    if (!existing || existing.completedCount <= 0) return;

    const newCount = Math.max(0, existing.completedCount - delta);

    if (newCount === 0) {
      set((state) => ({
        logs: state.logs.filter(
          (l) => !(l.habitId === habitId && l.date === today)
        ),
      }));
      await deleteLogByDateDB(habitId, today);
    } else {
      const newLog: HabitLog = {
        id: `${habitId}-${today}`,
        habitId,
        date: today,
        completedCount: newCount,
        completedAt: new Date().toISOString(),
      };
      set((state) => ({
        logs: [...state.logs.filter((l) => l.id !== newLog.id), newLog],
      }));
      await insertLogDB(newLog);
    }
  },
}));

/**
 * Dynamically computes current streak and best streak from log history
 */
export function calculateHabitStreakStats(logs: HabitLog[], targetCount: number): { currentStreak: number; bestStreak: number } {
  if (!logs || logs.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const completedDates = Array.from(
    new Set(
      logs
        .filter((l) => l.completedCount >= targetCount)
        .map((l) => l.date)
    )
  ).sort();

  if (completedDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  let maxStreak = 0;
  let tempStreak = 0;
  let prevDateObj: Date | null = null;

  for (const dateStr of completedDates) {
    const parts = dateStr.split('-').map(Number);
    const currentDateObj = new Date(parts[0], parts[1] - 1, parts[2]);

    if (!prevDateObj) {
      tempStreak = 1;
    } else {
      const diffMs = currentDateObj.getTime() - prevDateObj.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak += 1;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    maxStreak = Math.max(maxStreak, tempStreak);
    prevDateObj = currentDateObj;
  }

  const todayStr = getTodayStr();
  const todayParts = todayStr.split('-').map(Number);
  const todayObj = new Date(todayParts[0], todayParts[1] - 1, todayParts[2]);

  let currentStreak = 0;
  let checkDate = new Date(todayObj);

  const dateFormatted = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const completedSet = new Set(completedDates);

  if (completedSet.has(dateFormatted(checkDate))) {
    currentStreak += 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (completedSet.has(dateFormatted(checkDate))) {
    currentStreak += 1;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return {
    currentStreak,
    bestStreak: Math.max(maxStreak, currentStreak),
  };
}

// Custom React hooks for guaranteed reactive updates bypassing React Compiler memoization
export function useTodayHabits(): HabitWithLogs[] {
  const habits = useHabitsStore((state) => state.habits);
  const logs = useHabitsStore((state) => state.logs);

  const today = getTodayStr();
  const todayDow = getDayOfWeek();

  const todayHabits = habits.filter(
    (h) => !h.archivedAt && h.targetDays.includes(todayDow)
  );

  return todayHabits.map((habit) => {
    const habitLogs = logs.filter((l) => l.habitId === habit.id);
    const todayLog = habitLogs.find((l) => l.date === today);
    const isCompletedToday = (todayLog?.completedCount ?? 0) >= habit.targetCount;

    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dayStr}`;
    });

    const completedDays = last7.filter((dayStr) =>
      habitLogs.some(
        (l) => l.date === dayStr && l.completedCount >= habit.targetCount
      )
    ).length;

    const streakStats = calculateHabitStreakStats(habitLogs, habit.targetCount);

    return {
      ...habit,
      streak: streakStats.currentStreak,
      bestStreak: streakStats.bestStreak,
      logs: habitLogs,
      todayLog,
      isCompletedToday,
      completionRate: completedDays / 7,
    };
  });
}

export function useHabitsForDate(targetDate: string): HabitWithLogs[] {
  const habits = useHabitsStore((state) => state.habits);
  const logs = useHabitsStore((state) => state.logs);

  const dateParts = targetDate.split('-').map(Number);
  const targetDateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
  const targetDow = targetDateObj.getDay();

  const filteredHabits = habits.filter(
    (h) => !h.archivedAt && h.targetDays.includes(targetDow)
  );

  return filteredHabits.map((habit) => {
    const habitLogs = logs.filter((l) => l.habitId === habit.id);
    const dateLog = habitLogs.find((l) => l.date === targetDate);
    const isCompletedToday = (dateLog?.completedCount ?? 0) >= habit.targetCount;

    const streakStats = calculateHabitStreakStats(habitLogs, habit.targetCount);

    return {
      ...habit,
      streak: streakStats.currentStreak,
      bestStreak: streakStats.bestStreak,
      logs: habitLogs,
      todayLog: dateLog,
      isCompletedToday,
      completionRate: isCompletedToday ? 1 : 0,
    };
  });
}


export function useTodayCompletion(): number {
  const habits = useTodayHabits();
  if (habits.length === 0) return 0;
  const completed = habits.filter((h) => h.isCompletedToday).length;
  return completed / habits.length;
}
