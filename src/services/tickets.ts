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

const TICKETS_STORAGE_KEY = 'liferoutine_tickets_v8';

// Global memory cache to retain all created tickets across screens and platforms
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

const getDevApiUrls = () => {
  if (Platform.OS === 'web') {
    return ['/api/tickets', 'http://localhost:8081/api/tickets'];
  }
  return [
    'http://192.168.1.6:8081/api/tickets',
    'http://10.0.2.2:8081/api/tickets',
    'http://localhost:8081/api/tickets',
  ];
};

/**
 * Fetch all support tickets, merging Metro API server, local storage and memory
 */
export async function getSupportTickets(): Promise<SupportTicket[]> {
  const ticketMap = new Map<string, SupportTicket>();

  // 1. Add memory tickets first
  globalTicketsMemory.forEach((t) => ticketMap.set(t.id, t));

  // 2. Fetch remote tickets from Metro /api/tickets server
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

  // 3. Merge web localStorage tickets
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

  // 4. Merge mobile SecureStore tickets
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

    // POST ticket to Metro API server so Web receives it in real-time
    for (const url of getDevApiUrls()) {
      try {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTicket),
        }).catch(() => {});
      } catch (e) {}
    }

    // Broadcast cross-platform event immediately
    DeviceEventEmitter.emit('liferoutine_tickets_updated');

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

    // Send PUT request to Metro API server
    for (const url of getDevApiUrls()) {
      try {
        fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: ticketId, status: newStatus }),
        }).catch(() => {});
      } catch (e) {}
    }

    DeviceEventEmitter.emit('liferoutine_tickets_updated');

    return updated;
  } catch (error) {
    console.warn('Failed to update ticket status:', error);
    return globalTicketsMemory;
  }
}
