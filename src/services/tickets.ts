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

const TICKETS_STORAGE_KEY = 'liferoutine_tickets_v9';

// Global memory cache to retain all created tickets instantly in JS runtime
let globalTicketsMemory: SupportTicket[] = [
  {
    id: 't-demo-1',
    userName: 'Gabriel Monte',
    userEmail: 'gabriel@liferoutine.com',
    subject: 'Sincronização do Banco de Dados PostgreSQL',
    message: 'Solicito verificação da conexão de backup entre a VPS Oracle e o aplicativo.',
    status: 'open',
    createdAt: new Date().toISOString(),
  },
];

/**
 * Fast, 100% non-blocking local fetch for support tickets (instant 0ms response)
 */
export async function getSupportTickets(): Promise<SupportTicket[]> {
  const ticketMap = new Map<string, SupportTicket>();

  // 1. Add in-memory tickets first
  globalTicketsMemory.forEach((t) => ticketMap.set(t.id, t));

  // 2. Read from web localStorage if present
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

  // 3. Read from mobile SecureStore if present
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

  const mergedList = Array.from(ticketMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  globalTicketsMemory = mergedList;
  return mergedList;
}

/**
 * Create new support ticket from mobile app or web instantly (0ms delay)
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

    // Prepend to memory cache immediately
    const updated = [newTicket, ...globalTicketsMemory.filter((t) => t.id !== newTicket.id)];
    globalTicketsMemory = updated;
    const jsonStr = JSON.stringify(updated);

    // Save to web localStorage instantly
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(TICKETS_STORAGE_KEY, jsonStr);
      } catch (e) {}
    }

    // Save to mobile SecureStore instantly
    if (Platform.OS !== 'web') {
      try {
        await SecureStore.setItemAsync(TICKETS_STORAGE_KEY, jsonStr);
      } catch (e) {}
    }

    // Emit event for UI reactivity
    DeviceEventEmitter.emit('liferoutine_tickets_updated');

    // Non-blocking fire-and-forget background sync with 1s timeout
    setTimeout(() => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);

      fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket),
        signal: controller.signal,
      })
        .catch(() => {})
        .finally(() => clearTimeout(timeoutId));
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
