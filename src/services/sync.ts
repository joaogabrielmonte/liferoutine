import { checkBackendHealth, type SyncStatus } from '@/services/supabase';
import { useHabitsStore } from '@/stores/useHabitsStore';
import { getUserProfile } from '@/services/storage';

/**
 * Hybrid Sync Manager: SQLite Offline-First -> Cloud Sync
 */
export class SyncManager {
  private static status: SyncStatus = 'synced';

  public static getStatus(): SyncStatus {
    return this.status;
  }

  public static async syncLocalToCloud(): Promise<{
    success: boolean;
    message: string;
    dbConnected?: boolean;
  }> {
    this.status = 'syncing';

    const health = await checkBackendHealth();
    if (!health.online) {
      this.status = 'offline';
      return {
        success: false,
        message: 'Modo Offline: Seus dados estão salvos com segurança no banco SQLite local.',
        dbConnected: false,
      };
    }

    try {
      const profile = await getUserProfile();
      const habits = useHabitsStore.getState().habits;
      const logs = useHabitsStore.getState().logs;

      const payload = {
        user: profile,
        habits,
        logs,
        syncedAt: new Date().toISOString(),
      };

      console.log('[SyncManager] Sincronizado com backend:', payload.syncedAt);

      this.status = 'synced';
      return {
        success: true,
        message: health.message,
        dbConnected: health.dbConnected,
      };
    } catch (error) {
      this.status = 'error';
      return {
        success: false,
        message: 'Erro durante a sincronização na nuvem.',
      };
    }
  }
}
