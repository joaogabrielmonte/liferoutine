import type { HabitWithLogs, HabitLog } from '@/types/habit';

export type UserLevelInfo = {
  level: number;
  title: string;
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number; // 0..100
  color: string;
};

const LEVEL_TITLES = [
  { minLevel: 1, title: 'Iniciante Consistente', color: '#94A3B8' },
  { minLevel: 3, title: 'Foco em Construção', color: '#3B82F6' },
  { minLevel: 5, title: 'Atleta da Rotina', color: '#10B981' },
  { minLevel: 10, title: 'Mestre da Disciplina', color: '#8B5CF6' },
  { minLevel: 15, title: 'Lenda Imparável', color: '#F59E0B' },
];

/**
 * Calculate total XP points earned based on logs and streak performance
 */
export function calculateUserXP(habits: HabitWithLogs[], logs: HabitLog[]): number {
  let totalXP = 0;

  // 50 XP per completed log
  logs.forEach((log) => {
    if (log.completedCount > 0) {
      totalXP += log.completedCount * 50;
    }
  });

  // Streak bonus (100 XP per streak day)
  habits.forEach((h) => {
    if (h.streak > 0) {
      totalXP += h.streak * 100;
    }
  });

  return totalXP;
}

/**
 * Get Level progress, title, and progress percentage
 */
export function getUserLevelInfo(xp: number): UserLevelInfo {
  // Each level requires (level * 250) XP
  let level = 1;
  let accumulatedXP = 0;
  let xpForNext = 250;

  while (xp >= accumulatedXP + xpForNext) {
    accumulatedXP += xpForNext;
    level++;
    xpForNext = level * 250;
  }

  const currentXPInLevel = xp - accumulatedXP;
  const progressPercent = Math.min(100, Math.round((currentXPInLevel / xpForNext) * 100));

  let titleInfo = LEVEL_TITLES[0];
  for (const t of LEVEL_TITLES) {
    if (level >= t.minLevel) {
      titleInfo = t;
    }
  }

  return {
    level,
    title: titleInfo.title,
    currentXP: currentXPInLevel,
    xpForCurrentLevel: currentXPInLevel,
    xpForNextLevel: xpForNext,
    progressPercent,
    color: titleInfo.color,
  };
}
