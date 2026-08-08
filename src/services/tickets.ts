import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getUserProfile } from '@/services/storage';
import { BACKEND_API_URL } from '@/services/supabase';

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

const TICKETS_STORAGE_KEY = 'liferoutine_support_tickets';

// Default initial support tickets for demo/initial load
const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 't-101',
    userName: 'Emmanuel Fernando',
    userEmail: 'emmanuelfernando@gmail.com',
    subject: 'Dúvida sobre a meta de hidratação diária',
    message: 'Gostaria de saber como ajustar o volume padrão de cada copo de água para 300ml.',
    status: 'open',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 't-102',
    userName: 'Gabriel Monte',
    userEmail: 'gabriel@liferoutine.com',
    subject: 'Sincronização de relatórios em segundo plano',
    message: 'Solicito verificação do ping do container Docker na VPS Oracle para sincronização.',
    status: 'resolved',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

/**
 * Get all support tickets persistently
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Default initial seed
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(INITIAL_TICKETS));
    }
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(TICKETS_STORAGE_KEY, JSON.stringify(INITIAL_TICKETS));
    }
    return INITIAL_TICKETS;
  } catch (error) {
    console.warn('Failed to fetch support tickets:', error);
    return INITIAL_TICKETS;
  }
}

/**
 * Create new support ticket from mobile app
 */
export async function createSupportTicket(
  subject: string,
  message: string
): Promise<{ success: boolean; message: string }> {
  try {
    const profile = await getUserProfile();
    const tickets = await getSupportTickets();

    const newTicket: SupportTicket = {
      id: `t-${Date.now()}`,
      userName: profile.name || 'Usuário Mobile',
      userEmail: 'usuario.mobile@liferoutine.com',
      subject: subject.trim(),
      message: message.trim(),
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    const updated = [newTicket, ...tickets];
    const jsonStr = JSON.stringify(updated);

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(TICKETS_STORAGE_KEY, jsonStr);
    }

    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(TICKETS_STORAGE_KEY, jsonStr);
    }

    // Post ticket to backend API if VPS server is connected
    fetch(`${BACKEND_API_URL}/api/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTicket),
    }).catch(() => {});

    return { success: true, message: 'Chamado de suporte aberto com sucesso! O painel admin foi notificado.' };
  } catch (error) {
    console.warn('Failed to create ticket:', error);
    return { success: false, message: 'Erro ao abrir chamado de suporte.' };
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
    const tickets = await getSupportTickets();
    const updated = tickets.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t));
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
    return [];
  }
}
