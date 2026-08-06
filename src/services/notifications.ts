import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure default notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions and register dedicated Android channels
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      // Dedicated Water Hydration Channel
      await Notifications.setNotificationChannelAsync('water-reminders', {
        name: 'Lembretes de Hidratacao',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#06B6D4',
      });

      // Dedicated Exercise & Workout Alarm Channel
      await Notifications.setNotificationChannelAsync('exercise-alarms', {
        name: 'Alarmes de Exercício e Treino',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#F59E0B',
      });
    }

    return true;
  } catch (error) {
    console.warn('Notification permission error:', error);
    return false;
  }
}

/**
 * Schedule a specific WATER hydration reminder (Clean text without emojis)
 */
export async function scheduleWaterIntervalReminder(minutes: number): Promise<boolean> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return false;

    await cancelHabitReminder('water-interval');

    const seconds = Math.max(6, Math.round(minutes * 60));

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Lembrete de Hidratacao | LifeRoutine',
        body: 'Hora de beber 1 copo de agua (250ml) para manter sua meta diaria.',
        sound: true,
        data: { habitId: 'water-interval', category: 'water' },
      },
      trigger: minutes <= 0.1
        ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds }
        : { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: true },
    });

    return true;
  } catch (error) {
    console.warn('Failed to schedule water reminder:', error);
    return false;
  }
}

/**
 * Schedule a specific EXERCISE workout alarm (Clean text without emojis)
 */
export async function scheduleExerciseAlarm(seconds: number): Promise<boolean> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return false;

    const validSeconds = Math.max(5, Math.round(seconds));

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Alarme de Treino | LifeRoutine',
        body: 'Hora de se exercitar. Seu tempo de treino comecou.',
        sound: true,
        vibrate: [0, 500, 500, 500],
        data: { habitId: 'exercise-timer', category: 'exercise' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: validSeconds,
      },
    });

    return true;
  } catch (error) {
    console.warn('Failed to schedule exercise alarm:', error);
    return false;
  }
}

/**
 * Trigger immediate Exercise Target Completion Alarm (Clean text without emojis)
 */
export async function triggerExerciseTargetAlarm(targetMins: number): Promise<boolean> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return false;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Meta de Treino Concluida | LifeRoutine',
        body: `Parabens! Voce atingiu sua meta de ${targetMins} minutos de exercicio hoje.`,
        sound: true,
        vibrate: [0, 500, 500, 500],
        data: { category: 'exercise-completed' },
      },
      trigger: null, // immediate
    });

    return true;
  } catch (error) {
    console.warn('Failed to trigger exercise completion alarm:', error);
    return false;
  }
}

/**
 * Schedule a test notification
 */
export async function scheduleTestNotification(seconds: number = 5): Promise<boolean> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return false;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Lembrete LifeRoutine',
        body: 'Notificacao de teste configurada com sucesso.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
      },
    });

    return true;
  } catch (error) {
    console.warn('Failed to schedule test notification:', error);
    return false;
  }
}

/**
 * Schedule a daily local reminder for a habit
 */
export async function scheduleHabitReminder(
  habitId: string,
  title: string,
  body: string,
  hour: number,
  minute: number
): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    await cancelHabitReminder(habitId);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: title || 'Lembrete de Rotina | LifeRoutine',
        body: body || 'Nao se esqueca de registrar seu habito de hoje.',
        sound: true,
        data: { habitId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    return notificationId;
  } catch (error) {
    console.warn('Failed to schedule habit reminder:', error);
    return null;
  }
}

/**
 * Cancel a scheduled reminder for a habit
 */
export async function cancelHabitReminder(habitId: string): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const item of scheduled) {
      if (item.content.data?.habitId === habitId) {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
      }
    }
  } catch (error) {
    console.warn('Failed to cancel habit reminder:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('Failed to cancel all notifications:', error);
  }
}
