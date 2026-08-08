import { Platform } from 'react-native';
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
 * Get all support tickets
 */
export async function getSupportTickets(): Promise<SupportTicket[]> {
  try {
    if (Platform.OS === 'web') {
      const json = localStorage.getItem(TICKETS_STORAGE_KEY);
      if (json) {
        return JSON.parse(json);
      }
      localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(INITIAL_TICKETS));
      return INITIAL_TICKETS;
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

    if (Platform.OS === 'web') {
      localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(updated));
    }

    // Try posting to backend API if available
    fetch(`${BACKEND_API_URL}/api/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTicket),
    }).catch(() => {});

    return { success: true, message: '✅ Chamado de suporte aberto com sucesso! Nosso painel foi notificado.' };
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

    if (Platform.OS === 'web') {
      localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(updated));
    }

    return updated;
  } catch (error) {
    console.warn('Failed to update ticket status:', error);
    return [];
  }
}
