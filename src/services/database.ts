import { Platform } from 'react-native';
import type { Habit, HabitLog } from '@/types/habit';

// Platform-aware dynamic loading: Metro dead-code elimination strips database.native on Web
const db = Platform.OS === 'web' ? require('./database.web') : require('./database.native');

export const initDatabase: () => Promise<void> = db.initDatabase;
export const fetchHabitsDB: () => Promise<Habit[]> = db.fetchHabitsDB;
export const insertHabitDB: (habit: Habit) => Promise<void> = db.insertHabitDB;
export const updateHabitDB: (id: string, patch: Partial<Habit>) => Promise<void> = db.updateHabitDB;
export const deleteHabitDB: (id: string) => Promise<void> = db.deleteHabitDB;
export const fetchLogsDB: () => Promise<HabitLog[]> = db.fetchLogsDB;
export const insertLogDB: (log: HabitLog) => Promise<void> = db.insertLogDB;
export const deleteLogByDateDB: (habitId: string, date: string) => Promise<void> = db.deleteLogByDateDB;
export const getSettingDB: (key: string) => Promise<string | null> = db.getSettingDB;
export const setSettingDB: (key: string, value: string) => Promise<void> = db.setSettingDB;
