import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import type { Habit, HabitLog } from '@/types/habit';

const DB_NAME = 'liferoutine.db';
let dbInstance: SQLite.SQLiteDatabase | null = null;

async function getDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  if (Platform.OS === 'web') return null;
  if (!dbInstance) {
    try {
      dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    } catch (err) {
      console.warn('SQLite openDatabaseAsync failed:', err);
      return null;
    }
  }
  return dbInstance;
}

export async function initDatabase(): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  try {
    await db.execAsync(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        category TEXT NOT NULL,
        frequency TEXT NOT NULL,
        target_days TEXT NOT NULL,
        target_count INTEGER NOT NULL DEFAULT 1,
        unit TEXT,
        reminder_time TEXT,
        reminder_enabled INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT,
        streak INTEGER NOT NULL DEFAULT 0,
        best_streak INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS habit_logs (
        id TEXT PRIMARY KEY NOT NULL,
        habit_id TEXT NOT NULL,
        date TEXT NOT NULL,
        completed_count INTEGER NOT NULL,
        completed_at TEXT NOT NULL,
        note TEXT,
        FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);

    // Migration: ensure 'unit' column exists in habits table if created previously
    try {
      await db.execAsync('ALTER TABLE habits ADD COLUMN unit TEXT;');
    } catch {
      // Ignore if column already exists
    }

    // Seed default DEMO_HABITS into SQLite if table is empty
    const countRow = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM habits'
    );

    const now = new Date().toISOString();

    if ((countRow?.count ?? 0) === 0) {
      await db.execAsync(`
        INSERT INTO habits (id, title, description, icon, color, category, frequency, target_days, target_count, unit, reminder_enabled, created_at, updated_at, streak, best_streak)
        VALUES 
          ('1', 'Beber agua', 'Meta de 8 copos por dia', 'water-outline', '#06B6D4', 'health', 'daily', '[0,1,2,3,4,5,6]', 8, 'copos', 0, '${now}', '${now}', 5, 12),
          ('2', 'Exercitar', 'Meta de 30 min de treino', 'dumbbell', '#F59E0B', 'fitness', 'daily', '[0,1,2,3,4,5,6]', 30, 'min', 0, '${now}', '${now}', 3, 8),
          ('3', 'Meditar', '10 min de meditacao', 'brain', '#8B5CF6', 'mindfulness', 'daily', '[0,1,2,3,4,5,6]', 1, 'vez', 0, '${now}', '${now}', 7, 7),
          ('4', 'Ler', 'Meta de 20 paginas', 'book-open-outline', '#22C55E', 'learning', 'daily', '[0,1,2,3,4,5,6]', 20, 'paginas', 0, '${now}', '${now}', 2, 15);
      `);
    } else {
      // Update targets and units for demo habits
      await db.execAsync(`
        UPDATE habits SET target_count = 8, unit = 'copos' WHERE id = '1' AND (unit IS NULL OR target_count < 8);
        UPDATE habits SET target_count = 30, unit = 'min' WHERE id = '2' AND (unit IS NULL OR target_count < 30);
        UPDATE habits SET target_count = 20, unit = 'paginas' WHERE id = '4' AND (unit IS NULL OR target_count < 20);
      `);
    }

    // Sync old logs to local date format YYYY-MM-DD
    const localToday = now.split('T')[0];
    await db.execAsync(
      `UPDATE habit_logs SET date = '${localToday}' WHERE date > '${localToday}';`
    );
  } catch (err) {
    console.warn('initDatabase execAsync failed:', err);
  }
}

// ─────────────────────────────────────────────
// HABITS CRUD
// ─────────────────────────────────────────────

export async function fetchHabitsDB(): Promise<Habit[]> {
  const db = await getDatabase();
  if (!db) return [];

  try {
    const rows = await db.getAllAsync<any>('SELECT * FROM habits ORDER BY created_at DESC');

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description ?? undefined,
      icon: r.icon,
      color: r.color,
      category: r.category as any,
      frequency: r.frequency as any,
      targetDays: JSON.parse(r.target_days),
      targetCount: r.target_count,
      unit: r.unit ?? undefined,
      reminderTime: r.reminder_time ?? undefined,
      reminderEnabled: Boolean(r.reminder_enabled),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      archivedAt: r.archived_at ?? undefined,
      streak: r.streak,
      bestStreak: r.best_streak,
    }));
  } catch (err) {
    console.warn('fetchHabitsDB failed:', err);
    return [];
  }
}

export async function insertHabitDB(habit: Habit): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  try {
    await db.runAsync(
      `INSERT INTO habits (
        id, title, description, icon, color, category, frequency,
        target_days, target_count, unit, reminder_time, reminder_enabled,
        created_at, updated_at, archived_at, streak, best_streak
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        habit.id,
        habit.title,
        habit.description ?? null,
        habit.icon,
        habit.color,
        habit.category,
        habit.frequency,
        JSON.stringify(habit.targetDays),
        habit.targetCount,
        habit.unit ?? null,
        habit.reminderTime ?? null,
        habit.reminderEnabled ? 1 : 0,
        habit.createdAt,
        habit.updatedAt,
        habit.archivedAt ?? null,
        habit.streak,
        habit.bestStreak,
      ]
    );
  } catch (err) {
    console.warn('insertHabitDB failed:', err);
  }
}

export async function updateHabitDB(
  id: string,
  patch: Partial<Habit>
): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  try {
    const fields: string[] = [];
    const values: any[] = [];

    if (patch.title !== undefined) {
      fields.push('title = ?');
      values.push(patch.title);
    }
    if (patch.description !== undefined) {
      fields.push('description = ?');
      values.push(patch.description);
    }
    if (patch.icon !== undefined) {
      fields.push('icon = ?');
      values.push(patch.icon);
    }
    if (patch.color !== undefined) {
      fields.push('color = ?');
      values.push(patch.color);
    }
    if (patch.category !== undefined) {
      fields.push('category = ?');
      values.push(patch.category);
    }
    if (patch.frequency !== undefined) {
      fields.push('frequency = ?');
      values.push(patch.frequency);
    }
    if (patch.targetDays !== undefined) {
      fields.push('target_days = ?');
      values.push(JSON.stringify(patch.targetDays));
    }
    if (patch.targetCount !== undefined) {
      fields.push('target_count = ?');
      values.push(patch.targetCount);
    }
    if (patch.unit !== undefined) {
      fields.push('unit = ?');
      values.push(patch.unit);
    }
    if (patch.reminderTime !== undefined) {
      fields.push('reminder_time = ?');
      values.push(patch.reminderTime);
    }
    if (patch.reminderEnabled !== undefined) {
      fields.push('reminder_enabled = ?');
      values.push(patch.reminderEnabled ? 1 : 0);
    }
    if (patch.archivedAt !== undefined) {
      fields.push('archived_at = ?');
      values.push(patch.archivedAt);
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    await db.runAsync(
      `UPDATE habits SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  } catch (err) {
    console.warn('updateHabitDB failed:', err);
  }
}

export async function deleteHabitDB(id: string): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  try {
    await db.runAsync('DELETE FROM habits WHERE id = ?', [id]);
  } catch (err) {
    console.warn('deleteHabitDB failed:', err);
  }
}

// ─────────────────────────────────────────────
// LOGS CRUD
// ─────────────────────────────────────────────

export async function fetchLogsDB(): Promise<HabitLog[]> {
  const db = await getDatabase();
  if (!db) return [];

  try {
    const rows = await db.getAllAsync<any>('SELECT * FROM habit_logs ORDER BY date DESC');

    return rows.map((r) => ({
      id: r.id,
      habitId: r.habit_id,
      date: r.date,
      completedCount: r.completed_count,
      completedAt: r.completed_at,
      note: r.note ?? undefined,
    }));
  } catch (err) {
    console.warn('fetchLogsDB failed:', err);
    return [];
  }
}

export async function insertLogDB(log: HabitLog): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  try {
    // Ensure parent habit exists in SQLite DB to satisfy foreign key constraint
    const habitExists = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM habits WHERE id = ?',
      [log.habitId]
    );

    if (!habitExists) {
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT OR IGNORE INTO habits (id, title, icon, color, category, frequency, target_days, target_count, reminder_enabled, created_at, updated_at, streak, best_streak)
         VALUES (?, 'Habito', 'star-outline', '#3B82F6', 'health', 'daily', '[0,1,2,3,4,5,6]', 1, 0, ?, ?, 0, 0)`,
        [log.habitId, now, now]
      );
    }

    await db.runAsync(
      `INSERT INTO habit_logs (id, habit_id, date, completed_count, completed_at, note)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         completed_count = excluded.completed_count,
         completed_at = excluded.completed_at,
         note = excluded.note`,
      [log.id, log.habitId, log.date, log.completedCount, log.completedAt, log.note ?? null]
    );
  } catch (err) {
    console.warn('insertLogDB failed:', err);
  }
}

export async function deleteLogByDateDB(
  habitId: string,
  date: string
): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  try {
    await db.runAsync(
      'DELETE FROM habit_logs WHERE habit_id = ? AND date = ?',
      [habitId, date]
    );
  } catch (err) {
    console.warn('deleteLogByDateDB failed:', err);
  }
}

// ─────────────────────────────────────────────
// SETTINGS KV
// ─────────────────────────────────────────────

export async function getSettingDB(key: string): Promise<string | null> {
  const db = await getDatabase();
  if (!db) return null;

  try {
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      [key]
    );
    return row?.value ?? null;
  } catch (err) {
    console.warn('getSettingDB failed:', err);
    return null;
  }
}

export async function setSettingDB(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  try {
    await db.runAsync(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value]
    );
  } catch (err) {
    console.warn('setSettingDB failed:', err);
  }
}
