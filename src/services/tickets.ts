import { Platform } from 'react-native';
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

const TICKETS_STORAGE_KEY = 'liferoutine_support_tickets_v2';

// Memory cache fallback to ensure sync within session
let memoryTickets: SupportTicket[] = [];

/**
 * Get all support tickets
 */
export async function getSupportTickets(): Promise<SupportTicket[]> {
  try {
    let json: string | null = null;

    if (typeof window !== 'undefined' && window.localStorage) {
      json = window.localStorage.getItem(TICKETS_STORAGE_KEY);
    }
    
    if (!json && Platform.OS !== 'web') {
      json = await SecureStore.getItemAsync(TICKETS_STORAGE_KEY);
    }

    if (json) {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) {
        memoryTickets = parsed;
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch support tickets:', error);
  }
  return memoryTickets;
}

/**
 * Create new support ticket from mobile app or web
 */
export async function createSupportTicket(
  subject: string,
  message: string
): Promise<{ success: boolean; message: string; tickets: SupportTicket[] }> {
  try {
    const profile = await getUserProfile();
    const current = await getSupportTickets();

    const newTicket: SupportTicket = {
      id: `t-${Date.now()}`,
      userName: profile.name || 'Usuário Mobile',
      userEmail: 'usuario.mobile@liferoutine.com',
      subject: subject.trim(),
      message: message.trim(),
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    const updated = [newTicket, ...current];
    memoryTickets = updated;
    const jsonStr = JSON.stringify(updated);

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(TICKETS_STORAGE_KEY, jsonStr);
    }

    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(TICKETS_STORAGE_KEY, jsonStr);
    }

    return {
      success: true,
      message: 'Chamado de suporte enviado com sucesso ao painel administrativo!',
      tickets: updated,
    };
  } catch (error) {
    console.warn('Failed to create ticket:', error);
    return { success: false, message: 'Erro ao abrir chamado de suporte.', tickets: memoryTickets };
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
    memoryTickets = updated;
    const jsonStr = JSON.stringify(updated);

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(TICKETS_STORAGE_KEY, jsonStr);
    }

    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(TICKETS_STORAGE_KEY, jsonStr);
    }

    return updated;
  } catch (error) {
    console.warn('Failed to update ticket status:', error);
    return memoryTickets;
  }
}
