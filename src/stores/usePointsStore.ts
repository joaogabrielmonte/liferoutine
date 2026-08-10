import { create } from 'zustand';
import { BACKEND_API_URL } from '@/services/supabase';

export type UserLeaderboardEntry = {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  xp: number;
  levelName: string;
  workoutsCompleted: number;
  streakDays?: number;
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
  isLoadingLeaderboard: boolean;
};

type PointsActions = {
  fetchRealLeaderboard: () => Promise<void>;
  addXp: (amount: number, type: 'workout' | 'creatine' | 'habit') => void;
  getUserRank: () => number;
};

export const usePointsStore = create<PointsState & PointsActions>((set, get) => ({
  userXp: 800,
  userWorkoutsCompleted: 7,
  userCreatineDoses: 10,
  userHabitsCompleted: 15,
  isLoadingLeaderboard: false,
  leaderboard: [
    { id: 'b3896169-3132-40d3-90c9-b613c4bbd117', rank: 1, name: 'Emmanuel', avatar: '🏋️‍♂️', xp: 1050, levelName: 'Atleta Prata 🥈', workoutsCompleted: 9 },
    { id: '130e711b-97e5-4d7c-8a2b-c90b746a5149', rank: 2, name: 'Gabriel Monte', avatar: '👨‍💻', xp: 800, levelName: 'Atleta Prata 🥈', workoutsCompleted: 7, isCurrentUser: true },
  ],

  fetchRealLeaderboard: async () => {
    set({ isLoadingLeaderboard: true });
    try {
      const urls = [`${BACKEND_API_URL}/api/ranking`, '/api/ranking'];
      for (const url of urls) {
        const res = await fetch(url).catch(() => null);
        if (res && res.ok) {
          const realUsers = await res.json();
          if (Array.isArray(realUsers) && realUsers.length > 0) {
            set({ leaderboard: realUsers, isLoadingLeaderboard: false });
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to fetch real leaderboard:', e);
    }
    set({ isLoadingLeaderboard: false });
  },

  addXp: (amount, type) => {
    const state = get();
    const newXp = state.userXp + amount;
    const newWorkouts = type === 'workout' ? state.userWorkoutsCompleted + 1 : state.userWorkoutsCompleted;
    const newCreatine = type === 'creatine' ? state.userCreatineDoses + 1 : state.userCreatineDoses;
    const newHabits = type === 'habit' ? state.userHabitsCompleted + 1 : state.userHabitsCompleted;

    const levelInfo = getLevelInfo(newXp);

    const updatedLeaderboard = state.leaderboard.map((item) => {
      if (item.isCurrentUser || item.name.toLowerCase().includes('gabriel')) {
        return {
          ...item,
          xp: newXp,
          levelName: levelInfo.levelName,
          workoutsCompleted: newWorkouts,
        };
      }
      return item;
    });

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
    const current = get().leaderboard.find((u) => u.isCurrentUser || u.name.toLowerCase().includes('gabriel'));
    return current ? current.rank : 2;
  },
}));
