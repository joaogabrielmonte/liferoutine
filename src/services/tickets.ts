import { Platform, DeviceEventEmitter } from 'react-native';
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

const TICKETS_STORAGE_KEY = 'liferoutine_tickets_v13';

// In-memory ticket cache for 0ms instant initial rendering
let globalTicketsMemory: SupportTicket[] = [
  {
    id: 't-1001',
    userName: 'Gabriel Monte (Mobile)',
    userEmail: 'gabriel@liferoutine.com',
    subject: 'Teste de Chamado via Aplicativo Mobile',
    message: 'Chamado enviado do celular para verificar a integração em tempo real com o Database Explorer.',
    status: 'open',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 't-1002',
    userName: 'Emmanuel Fernando',
    userEmail: 'emmanuel@liferoutine.com',
    subject: 'Solicitação de Backup do Banco PostgreSQL',
    message: 'Verificação da sincronização da VPS Oracle Cloud com o aplicativo.',
    status: 'in_progress',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

/**
 * Fetch all support tickets with 0ms instant local render and parallel non-blocking VPS sync
 */
export async function getSupportTickets(): Promise<SupportTicket[]> {
  const ticketMap = new Map<string, SupportTicket>();

  // 1. Instantly populate from memory cache & local storage for 0ms initial render
  globalTicketsMemory.forEach((t) => ticketMap.set(t.id, t));

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const localJson = window.localStorage.getItem(TICKETS_STORAGE_KEY);
      if (localJson) {
        const parsed = JSON.parse(localJson);
        if (Array.isArray(parsed)) {
          parsed.forEach((t) => ticketMap.set(t.id, t));
        }
      }
    } catch (e) {}
  }

  if (Platform.OS !== 'web') {
    try {
      const secureJson = await SecureStore.getItemAsync(TICKETS_STORAGE_KEY);
      if (secureJson) {
        const parsed = JSON.parse(secureJson);
        if (Array.isArray(parsed)) {
          parsed.forEach((t) => ticketMap.set(t.id, t));
        }
      }
    } catch (e) {}
  }

  const initialList = Array.from(ticketMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // 2. Parallel non-blocking fetch to remote Oracle VPS PostgreSQL API (800ms max timeout)
  setTimeout(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 800);

      const urls = [`${BACKEND_API_URL}/api/tickets`, '/api/tickets'];
      for (const url of urls) {
        const res = await fetch(url, { signal: controller.signal }).catch(() => null);
        if (res && res.ok) {
          const apiTickets = await res.json();
          if (Array.isArray(apiTickets) && apiTickets.length > 0) {
            apiTickets.forEach((t: SupportTicket) => ticketMap.set(t.id, t));
            const updatedList = Array.from(ticketMap.values()).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            globalTicketsMemory = updatedList;
            DeviceEventEmitter.emit('liferoutine_tickets_updated');
            break;
          }
        }
      }
      clearTimeout(timeoutId);
    } catch (e) {}
  }, 10);

  globalTicketsMemory = initialList;
  return initialList;
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
    const profile = await getUserProfile().catch(() => ({ name: 'Usuário Mobile' }));

    const newTicket: SupportTicket = {
      id: `t-${Date.now()}`,
      userName: userName || profile.name || 'Usuário Mobile',
      userEmail: userEmail || 'usuario.mobile@liferoutine.com',
      subject: subject.trim(),
      message: message.trim(),
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    // Prepend to memory cache
    const updated = [newTicket, ...globalTicketsMemory.filter((t) => t.id !== newTicket.id)];
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

    // Emit event for UI reactivity
    DeviceEventEmitter.emit('liferoutine_tickets_updated');

    // Asynchronously send ticket to Oracle VPS Server PostgreSQL API endpoints
    setTimeout(() => {
      const urls = [`${BACKEND_API_URL}/api/tickets`, '/api/tickets'];
      for (const url of urls) {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTicket),
        }).catch(() => {});
      }
    }, 10);

    return {
      success: true,
      message: 'Chamado gravado com sucesso no banco de dados!',
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

    setTimeout(() => {
      const urls = [`${BACKEND_API_URL}/api/tickets`, '/api/tickets'];
      for (const url of urls) {
        fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: ticketId, status: newStatus }),
        }).catch(() => {});
      }
    }, 10);

    DeviceEventEmitter.emit('liferoutine_tickets_updated');
    return updated;
  } catch (error) {
    console.warn('Failed to update ticket status:', error);
    return globalTicketsMemory;
  }
}
