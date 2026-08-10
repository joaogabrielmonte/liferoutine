import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { scheduleHabitReminder } from '@/services/notifications';

export type MuscleGroup =
  | 'Peito & Tríceps'
  | 'Costas & Bíceps'
  | 'Pernas & Panturrilhas'
  | 'Ombros & Trapézio'
  | 'Cardio & Abdômen'
  | 'Descanso Ativo (Off)';

export type WorkoutDayLog = {
  date: string; // YYYY-MM-DD
  muscleGroup: MuscleGroup;
  completed: boolean;
  creatineTaken: boolean;
};

type WorkoutState = {
  todayMuscleGroup: MuscleGroup;
  isWorkoutCompletedToday: boolean;
  isCreatineTakenToday: boolean;
  workoutTime: string; // e.g. "17:00"
  creatineTime: string; // e.g. "09:00"
  workoutReminderEnabled: boolean;
  creatineReminderEnabled: boolean;
  weeklyLogs: Record<string, WorkoutDayLog>; // date -> log
};

type WorkoutActions = {
  loadStore: () => Promise<void>;
  setTodayMuscleGroup: (group: MuscleGroup) => Promise<void>;
  toggleWorkoutCompleted: () => Promise<void>;
  toggleCreatineTaken: () => Promise<void>;
  setWorkoutTime: (time: string) => Promise<void>;
  setCreatineTime: (time: string) => Promise<void>;
  toggleWorkoutReminder: () => Promise<void>;
  toggleCreatineReminder: () => Promise<void>;
};

export type WorkoutStore = WorkoutState & WorkoutActions;

const STORAGE_KEY = 'liferoutine_workout_store_v1';

export const getTodayDateStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Peito & Tríceps',
  'Costas & Bíceps',
  'Pernas & Panturrilhas',
  'Ombros & Trapézio',
  'Cardio & Abdômen',
  'Descanso Ativo (Off)',
];

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  todayMuscleGroup: 'Peito & Tríceps',
  isWorkoutCompletedToday: false,
  isCreatineTakenToday: false,
  workoutTime: '17:00',
  creatineTime: '09:00',
  workoutReminderEnabled: true,
  creatineReminderEnabled: true,
  weeklyLogs: {},

  loadStore: async () => {
    try {
      let json: string | null = null;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        json = localStorage.getItem(STORAGE_KEY);
      } else if (Platform.OS !== 'web') {
        json = await SecureStore.getItemAsync(STORAGE_KEY);
      }

      if (json) {
        const parsed = JSON.parse(json);
        const today = getTodayDateStr();
        const todayLog = parsed.weeklyLogs?.[today];

        set({
          ...parsed,
          todayMuscleGroup: todayLog?.muscleGroup || parsed.todayMuscleGroup || 'Peito & Tríceps',
          isWorkoutCompletedToday: !!todayLog?.completed,
          isCreatineTakenToday: !!todayLog?.creatineTaken,
        });
      }
    } catch (e) {
      console.warn('Failed to load workout store:', e);
    }
  },

  setTodayMuscleGroup: async (group: MuscleGroup) => {
    const today = getTodayDateStr();
    const state = get();
    const updatedLog: WorkoutDayLog = {
      date: today,
      muscleGroup: group,
      completed: state.isWorkoutCompletedToday,
      creatineTaken: state.isCreatineTakenToday,
    };
    const updatedLogs = { ...state.weeklyLogs, [today]: updatedLog };

    set({ todayMuscleGroup: group, weeklyLogs: updatedLogs });
    await saveStore({ ...state, todayMuscleGroup: group, weeklyLogs: updatedLogs });
  },

  toggleWorkoutCompleted: async () => {
    const today = getTodayDateStr();
    const state = get();
    const nextCompleted = !state.isWorkoutCompletedToday;
    const updatedLog: WorkoutDayLog = {
      date: today,
      muscleGroup: state.todayMuscleGroup,
      completed: nextCompleted,
      creatineTaken: state.isCreatineTakenToday,
    };
    const updatedLogs = { ...state.weeklyLogs, [today]: updatedLog };

    set({ isWorkoutCompletedToday: nextCompleted, weeklyLogs: updatedLogs });
    await saveStore({ ...state, isWorkoutCompletedToday: nextCompleted, weeklyLogs: updatedLogs });
  },

  toggleCreatineTaken: async () => {
    const today = getTodayDateStr();
    const state = get();
    const nextCreatine = !state.isCreatineTakenToday;
    const updatedLog: WorkoutDayLog = {
      date: today,
      muscleGroup: state.todayMuscleGroup,
      completed: state.isWorkoutCompletedToday,
      creatineTaken: nextCreatine,
    };
    const updatedLogs = { ...state.weeklyLogs, [today]: updatedLog };

    set({ isCreatineTakenToday: nextCreatine, weeklyLogs: updatedLogs });
    await saveStore({ ...state, isCreatineTakenToday: nextCreatine, weeklyLogs: updatedLogs });
  },

  setWorkoutTime: async (time: string) => {
    const state = get();
    set({ workoutTime: time });
    await saveStore({ ...state, workoutTime: time });
    if (state.workoutReminderEnabled) {
      const [h, m] = time.split(':').map(Number);
      scheduleHabitReminder('gym-workout', 'Hora do Treino! 🏋️‍♂️', `Foco no treino de hoje: ${state.todayMuscleGroup}`, h || 17, m || 0);
    }
  },

  setCreatineTime: async (time: string) => {
    const state = get();
    set({ creatineTime: time });
    await saveStore({ ...state, creatineTime: time });
    if (state.creatineReminderEnabled) {
      const [h, m] = time.split(':').map(Number);
      scheduleHabitReminder('gym-creatine', 'Hora da Creatina! 🧪', 'Mantenha sua dose diária de creatina em dia.', h || 9, m || 0);
    }
  },

  toggleWorkoutReminder: async () => {
    const state = get();
    const nextEnabled = !state.workoutReminderEnabled;
    set({ workoutReminderEnabled: nextEnabled });
    await saveStore({ ...state, workoutReminderEnabled: nextEnabled });
    if (nextEnabled) {
      const [h, m] = state.workoutTime.split(':').map(Number);
      scheduleHabitReminder('gym-workout', 'Hora do Treino! 🏋️‍♂️', `Foco no treino de hoje: ${state.todayMuscleGroup}`, h || 17, m || 0);
    }
  },

  toggleCreatineReminder: async () => {
    const state = get();
    const nextEnabled = !state.creatineReminderEnabled;
    set({ creatineReminderEnabled: nextEnabled });
    await saveStore({ ...state, creatineReminderEnabled: nextEnabled });
    if (nextEnabled) {
      const [h, m] = state.creatineTime.split(':').map(Number);
      scheduleHabitReminder('gym-creatine', 'Hora da Creatina! 🧪', 'Mantenha sua dose diária de creatina em dia.', h || 9, m || 0);
    }
  },
}));

async function saveStore(state: Partial<WorkoutState>) {
  try {
    const payload = JSON.stringify({
      todayMuscleGroup: state.todayMuscleGroup,
      workoutTime: state.workoutTime,
      creatineTime: state.creatineTime,
      workoutReminderEnabled: state.workoutReminderEnabled,
      creatineReminderEnabled: state.creatineReminderEnabled,
      weeklyLogs: state.weeklyLogs,
    });

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, payload);
    } else if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(STORAGE_KEY, payload);
    }
  } catch (e) {
    console.warn('Failed to save workout store:', e);
  }
}
