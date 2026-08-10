import { create } from 'zustand';

export type UserLeaderboardEntry = {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  xp: number;
  levelName: string;
  workoutsCompleted: number;
  streakDays: number;
  isCurrentUser?: boolean;
};

export type PointsRule = {
  action: string;
  xp: number;
  description: string;
  icon: string;
};

export const POINTS_RULES: PointsRule[] = [
  { action: 'Concluir Treino do Dia', xp: 100, description: 'Registrar o treino concluído na aba Academia', icon: 'dumbbell' },
  { action: 'Tomar Creatina Diária', xp: 30, description: 'Confirmar a suplementação de 3g a 5g no dia', icon: 'bottle-tonic' },
  { action: 'Concluir Hábito Diário', xp: 50, description: 'Concluir cada hábito cadastrado na sua rotina', icon: 'check-circle' },
  { action: 'Manter Sequência (Streak)', xp: 20, description: 'Bônus por manter hábitos e treinos sem falhar', icon: 'fire' },
];

export function getLevelInfo(xp: number): { levelName: string; levelNum: number; nextLevelXp: number; progress: number } {
  if (xp < 300) {
    return { levelName: 'Iniciante Fit 🌱', levelNum: 1, nextLevelXp: 300, progress: Math.min(100, Math.round((xp / 300) * 100)) };
  } else if (xp < 800) {
    return { levelName: 'Atleta Bronze 🥉', levelNum: 2, nextLevelXp: 800, progress: Math.min(100, Math.round(((xp - 300) / 500) * 100)) };
  } else if (xp < 1500) {
    return { levelName: 'Atleta Prata 🥈', levelNum: 3, nextLevelXp: 1500, progress: Math.min(100, Math.round(((xp - 800) / 700) * 100)) };
  } else if (xp < 3000) {
    return { levelName: 'Atleta Ouro 🥇', levelNum: 4, nextLevelXp: 3000, progress: Math.min(100, Math.round(((xp - 1500) / 1500) * 100)) };
  } else if (xp < 5000) {
    return { levelName: 'Elite Diamante 💎', levelNum: 5, nextLevelXp: 5000, progress: Math.min(100, Math.round(((xp - 3000) / 2000) * 100)) };
  }
  return { levelName: 'Mestre LifeRoutine 🏆', levelNum: 6, nextLevelXp: 10000, progress: 100 };
}

type PointsState = {
  userXp: number;
  userWorkoutsCompleted: number;
  userCreatineDoses: number;
  userHabitsCompleted: number;
  leaderboard: UserLeaderboardEntry[];
};

type PointsActions = {
  addXp: (amount: number, type: 'workout' | 'creatine' | 'habit') => void;
  getUserRank: () => number;
};

export const usePointsStore = create<PointsState & PointsActions>((set, get) => ({
  userXp: 1450, // Initial base XP
  userWorkoutsCompleted: 12,
  userCreatineDoses: 15,
  userHabitsCompleted: 24,
  leaderboard: [
    { id: 'u-1', rank: 1, name: 'Gabriel Monte', avatar: '👨‍💻', xp: 3420, levelName: 'Elite Diamante 💎', workoutsCompleted: 28, streakDays: 14 },
    { id: 'u-2', rank: 2, name: 'Emmanuel Fernando', avatar: '🏋️‍♂️', xp: 2950, levelName: 'Atleta Ouro 🥇', workoutsCompleted: 24, streakDays: 11 },
    { id: 'u-3', rank: 3, name: 'Ana Souza', avatar: '👩‍🦰', xp: 2100, levelName: 'Atleta Ouro 🥇', workoutsCompleted: 19, streakDays: 8 },
    { id: 'u-4', rank: 4, name: 'Rodrigo Silva', avatar: '🏃‍♂️', xp: 1650, levelName: 'Atleta Ouro 🥇', workoutsCompleted: 15, streakDays: 6 },
    { id: 'u-curr', rank: 5, name: 'Você (Sua Conta)', avatar: '⭐', xp: 1450, levelName: 'Atleta Prata 🥈', workoutsCompleted: 12, streakDays: 5, isCurrentUser: true },
  ],

  addXp: (amount, type) => {
    const state = get();
    const newXp = state.userXp + amount;
    const newWorkouts = type === 'workout' ? state.userWorkoutsCompleted + 1 : state.userWorkoutsCompleted;
    const newCreatine = type === 'creatine' ? state.userCreatineDoses + 1 : state.userCreatineDoses;
    const newHabits = type === 'habit' ? state.userHabitsCompleted + 1 : state.userHabitsCompleted;

    const levelInfo = getLevelInfo(newXp);

    const updatedLeaderboard = state.leaderboard.map((item) => {
      if (item.isCurrentUser) {
        return {
          ...item,
          xp: newXp,
          levelName: levelInfo.levelName,
          workoutsCompleted: newWorkouts,
        };
      }
      return item;
    });

    // Re-rank leaderboard
    updatedLeaderboard.sort((a, b) => b.xp - a.xp);
    updatedLeaderboard.forEach((item, index) => {
      item.rank = index + 1;
    });

    set({
      userXp: newXp,
      userWorkoutsCompleted: newWorkouts,
      userCreatineDoses: newCreatine,
      userHabitsCompleted: newHabits,
      leaderboard: updatedLeaderboard,
    });
  },

  getUserRank: () => {
    const current = get().leaderboard.find((u) => u.isCurrentUser);
    return current ? current.rank : 5;
  },
}));
