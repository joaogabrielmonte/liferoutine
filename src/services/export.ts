import { Share, Alert, Platform } from 'react-native';
import { useHabitsStore } from '@/stores/useHabitsStore';
import { getUserProfile } from '@/services/storage';

/**
 * Generate and share or download a text summary report of habits and streaks
 */
export async function shareHabitReport(): Promise<boolean> {
  try {
    const profile = await getUserProfile();
    const habits = useHabitsStore.getState().habits;

    const totalHabits = habits.length;
    const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);

    let reportText = `📊 RELATÓRIO EXECUTIVO DE ROTINA | LIFEROUTINE\n`;
    reportText += `👤 Usuário: ${profile.name || 'Gabriel Monte'}\n`;
    reportText += `📅 Data do Extrato: ${new Date().toLocaleDateString('pt-BR')}\n`;
    reportText += `--------------------------------------------------\n`;
    reportText += `⚡ Total de Hábitos Monitorados: ${totalHabits}\n`;
    reportText += `🔥 Maior Sequência de Consistência: ${maxStreak} dias seguidos\n`;
    reportText += `--------------------------------------------------\n`;
    reportText += `DETALHAMENTO DE DESEMPENHO:\n`;

    habits.forEach((h, index) => {
      reportText += `${index + 1}. ${h.title}: Meta ${h.targetCount} ${h.unit || 'unidades'} (Sequência: ${h.streak || 0} dias)\n`;
    });

    reportText += `--------------------------------------------------\n`;
    reportText += `Extrato emitido via Kinglityc LifeRoutine Enterprise Engine ⚡`;

    if (Platform.OS === 'web') {
      const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Relatorio_LifeRoutine_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert('📄 Relatório de Hábitos exportado e baixado com sucesso!');
      return true;
    } else {
      const result = await Share.share({
        message: reportText,
        title: 'Relatório LifeRoutine',
      });
      return result.action === Share.sharedAction;
    }
  } catch (error) {
    console.warn('Share report error:', error);
    if (Platform.OS !== 'web') {
      Alert.alert('Erro ao Exportar', 'Não foi possível compartilhar o relatório.');
    }
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
      system: 'Kinglityc LifeRoutine ERP Engine',
      exportedAt: new Date().toISOString(),
      profile,
      habits,
      logs,
    };

    const jsonString = JSON.stringify(backupData, null, 2);

    if (Platform.OS === 'web') {
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Backup_LifeRoutine_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert('💾 Backup JSON do LifeRoutine baixado com sucesso!');
      return true;
    } else {
      const result = await Share.share({
        message: jsonString,
        title: 'Backup_LifeRoutine.json',
      });
      return result.action === Share.sharedAction;
    }
  } catch (error) {
    console.warn('Export JSON error:', error);
    if (Platform.OS !== 'web') {
      Alert.alert('Erro ao Exportar', 'Não foi possível gerar o backup.');
    }
    return false;
  }
}
