import { Share, Alert, Platform } from 'react-native';
import { useHabitsStore } from '@/stores/useHabitsStore';
import { getUserProfile } from '@/services/storage';

/**
 * Generate and share a text summary report of habits and streaks
 */
export async function shareHabitReport(): Promise<boolean> {
  try {
    const profile = await getUserProfile();
    const habits = useHabitsStore.getState().habits;
    const logs = useHabitsStore.getState().logs;

    const totalHabits = habits.length;
    const totalCompletedToday = habits.filter((h) => h.streak > 0).length;
    const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

    let reportText = `📊 RELATÓRIO LIFEROUTINE\n`;
    reportText += `👤 Usuário: ${profile.name}\n`;
    reportText += `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
    reportText += `------------------------------------\n`;
    reportText += `⚡ Hábitos Ativos: ${totalHabits}\n`;
    reportText += `🔥 Maior Sequência: ${maxStreak} dias seguidos\n`;
    reportText += `------------------------------------\n`;
    reportText += `DESEMPENHO DOS HÁBITOS:\n`;

    habits.forEach((h, index) => {
      reportText += `${index + 1}. ${h.title}: Meta ${h.targetCount} ${h.unit || 'vezes'} (Sequência: ${h.streak} dias)\n`;
    });

    reportText += `------------------------------------\n`;
    reportText += `Relatório gerado via LifeRoutine App ⚡`;

    const result = await Share.share({
      message: reportText,
      title: 'Relatório LifeRoutine',
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.warn('Share report error:', error);
    Alert.alert('Erro ao Exportar', 'Não foi possível compartilhar o relatório.');
    return false;
  }
}

/**
 * Export backup JSON data
 */
export async function exportDataJSON(): Promise<boolean> {
  try {
    const profile = await getUserProfile();
    const habits = useHabitsStore.getState().habits;
    const logs = useHabitsStore.getState().logs;

    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      profile,
      habits,
      logs,
    };

    const jsonString = JSON.stringify(backupData, null, 2);

    const result = await Share.share({
      message: jsonString,
      title: 'Backup_LifeRoutine.json',
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.warn('Export JSON error:', error);
    Alert.alert('Erro ao Exportar', 'Não foi possível gerar o backup.');
    return false;
  }
}
