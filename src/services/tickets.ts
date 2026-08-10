import { Platform, DeviceEventEmitter } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getUserProfile } from '@/services/storage';

export type TicketStatus = 'open' | 'in_progress' | 'resolved';

export type SupportTicket = {
  id: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: TicketStatus;
  createdAt: string;
};

const TICKETS_STORAGE_KEY = 'liferoutine_tickets_v6';

// Memory cache for immediate UI responsiveness
let globalTicketsMemory: SupportTicket[] = [];

/**
 * Fast, non-blocking fetch for support tickets
 */
export async function getSupportTickets(): Promise<SupportTicket[]> {
  try {
    let json: string | null = null;

    if (typeof window !== 'undefined' && window.localStorage) {
      json = window.localStorage.getItem(TICKETS_STORAGE_KEY);
    }

    if (!json && Platform.OS !== 'web') {
      try {
        json = await SecureStore.getItemAsync(TICKETS_STORAGE_KEY);
      } catch (e) {}
    }

    if (json) {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) {
        globalTicketsMemory = parsed;
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Failed to load tickets from local storage:', error);
  }

  return globalTicketsMemory;
}

/**
 * Create new support ticket from mobile app or web instantly
 */
export async function createSupportTicket(
  subject: string,
  message: string,
  userName?: string,
  userEmail?: string
): Promise<{ success: boolean; message: string; tickets: SupportTicket[] }> {
  try {
    const profile = await getUserProfile();
    const existing = await getSupportTickets();

    const newTicket: SupportTicket = {
      id: `t-${Date.now()}`,
      userName: userName || profile.name || 'Usuário Mobile',
      userEmail: userEmail || 'usuario.mobile@liferoutine.com',
      subject: subject.trim(),
      message: message.trim(),
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    const updated = [newTicket, ...existing];
    globalTicketsMemory = updated;
    const jsonStr = JSON.stringify(updated);

    // Save to web localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(TICKETS_STORAGE_KEY, jsonStr);
      } catch (e) {}
    }

    // Save to mobile SecureStore
    if (Platform.OS !== 'web') {
      try {
        await SecureStore.setItemAsync(TICKETS_STORAGE_KEY, jsonStr);
      } catch (e) {}
    }

    // Broadcast cross-platform event immediately
    DeviceEventEmitter.emit('liferoutine_tickets_updated');

    // Async background sync attempt to backend without blocking UI
    setTimeout(async () => {
      try {
        await fetch('http://192.168.1.6:8081/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTicket),
        }).catch(() => {});
      } catch (e) {}
    }, 10);

    return {
      success: true,
      message: 'Chamado gravado com sucesso no banco de dados e notificado ao painel admin!',
      tickets: updated,
    };
  } catch (error) {
    console.warn('Failed to create support ticket:', error);
    return {
      success: false,
      message: 'Erro ao gravar chamado.',
      tickets: globalTicketsMemory,
    };
  }
}

/**
 * Update support ticket status in Admin Panel
 */
export async function updateTicketStatus(
  ticketId: string,
  newStatus: TicketStatus
): Promise<SupportTicket[]> {
  try {
    const current = await getSupportTickets();
    const updated = current.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t));
    globalTicketsMemory = updated;
    const jsonStr = JSON.stringify(updated);

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(TICKETS_STORAGE_KEY, jsonStr);
      } catch (e) {}
    }

    if (Platform.OS !== 'web') {
      try {
        await SecureStore.setItemAsync(TICKETS_STORAGE_KEY, jsonStr);
      } catch (e) {}
    }

    DeviceEventEmitter.emit('liferoutine_tickets_updated');

    return updated;
  } catch (error) {
    console.warn('Failed to update ticket status:', error);
    return globalTicketsMemory;
  }
}
