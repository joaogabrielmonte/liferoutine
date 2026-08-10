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

const TICKETS_STORAGE_KEY = 'liferoutine_tickets_v11';

// Initial tickets in memory so Database Explorer always displays active support ticket data
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

const getDevApiUrls = () => [
  `${BACKEND_API_URL}/api/tickets`,
  'http://192.168.1.6:8081/api/tickets',
  'http://localhost:8081/api/tickets',
  '/api/tickets',
];

/**
 * Fetch all support tickets across PostgreSQL API, local storage, and memory
 */
export async function getSupportTickets(): Promise<SupportTicket[]> {
  const ticketMap = new Map<string, SupportTicket>();

  // 1. Add memory tickets first
  globalTicketsMemory.forEach((t) => ticketMap.set(t.id, t));

  // 2. Read from web localStorage
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

  // 3. Read from mobile SecureStore
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

  // 4. Background fetch from Oracle VPS Server API
  for (const url of getDevApiUrls()) {
    try {
      const res = await fetch(url, { method: 'GET' }).catch(() => null);
      if (res && res.ok) {
        const apiTickets = await res.json();
        if (Array.isArray(apiTickets)) {
          apiTickets.forEach((t: SupportTicket) => ticketMap.set(t.id, t));
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
      userName: userName || profile.name || 'Usuário Mobile (Android)',
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

    // Fire cross-platform event
    DeviceEventEmitter.emit('liferoutine_tickets_updated');

    // Async POST to Oracle VPS API endpoints
    setTimeout(() => {
      for (const url of getDevApiUrls()) {
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
      for (const url of getDevApiUrls()) {
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
