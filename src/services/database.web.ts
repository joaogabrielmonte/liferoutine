import type { Habit, HabitLog } from '@/types/habit';

export async function initDatabase(): Promise<void> {
  return Promise.resolve();
}

export async function fetchHabitsDB(): Promise<Habit[]> {
  return Promise.resolve([]);
}

export async function insertHabitDB(habit: Habit): Promise<void> {
  return Promise.resolve();
}

export async function updateHabitDB(
  id: string,
  patch: Partial<Habit>
): Promise<void> {
  return Promise.resolve();
}

export async function deleteHabitDB(id: string): Promise<void> {
  return Promise.resolve();
}

export async function fetchLogsDB(): Promise<HabitLog[]> {
  return Promise.resolve([]);
}

export async function insertLogDB(log: HabitLog): Promise<void> {
  return Promise.resolve();
}

export async function deleteLogByDateDB(
  habitId: string,
  date: string
): Promise<void> {
  return Promise.resolve();
}

export async function getSettingDB(key: string): Promise<string | null> {
  return Promise.resolve(null);
}

export async function setSettingDB(key: string, value: string): Promise<void> {
  return Promise.resolve();
}
