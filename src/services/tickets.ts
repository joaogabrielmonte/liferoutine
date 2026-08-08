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

const TICKETS_STORAGE_KEY = 'liferoutine_tickets_v5';

// Shared memory store
let globalTicketsMemory: SupportTicket[] = [];

// Dev API endpoints for real-time mobile to web ticket sync
const getDevApiUrls = () => [
  'http://192.168.1.6:8081/api/tickets',
  'http://localhost:8081/api/tickets',
  `${BACKEND_API_URL}/api/tickets`,
];

/**
 * Fetch all support tickets across storage and API endpoints
 */
export async function getSupportTickets(): Promise<SupportTicket[]> {
  // 1. Try fetching from dev API endpoints
  for (const url of getDevApiUrls()) {
    try {
      const res = await fetch(url, { method: 'GET' }).catch(() => null);
      if (res && res.ok) {
        const remoteTickets = await res.json();
        if (Array.isArray(remoteTickets) && remoteTickets.length > 0) {
          globalTicketsMemory = remoteTickets;
          return remoteTickets;
        }
      }
    } catch (e) {}
  }

  // 2. Try localStorage / SecureStore fallback
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
 * Create new support ticket from mobile app or web
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

    // Send ticket POST request to API endpoints so Web receives it in real-time
    for (const url of getDevApiUrls()) {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket),
      }).catch(() => {});
    }

    // Broadcast cross-platform event
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

    // Send status update PUT request to dev API endpoints
    for (const url of getDevApiUrls()) {
      fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticketId, status: newStatus }),
      }).catch(() => {});
    }

    DeviceEventEmitter.emit('liferoutine_tickets_updated');

    return updated;
  } catch (error) {
    console.warn('Failed to update ticket status:', error);
    return globalTicketsMemory;
  }
}
