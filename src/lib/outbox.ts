import type { Transaction } from "@/types/finance";

// Transactions added while offline wait here (per user, on this device) until they can be sent.
export interface OutboxEntry {
  tempId: string;
  payload: Omit<Transaction, "id">;
}

export const OFFLINE_PREFIX = "offline-";
export const isOfflineId = (id: string) => id.startsWith(OFFLINE_PREFIX);

const key = (userId: string) => `sanchay.outbox.${userId}`;

export function readOutbox(userId: string): OutboxEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key(userId)) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeOutbox(userId: string, entries: OutboxEntry[]) {
  try {
    if (entries.length) localStorage.setItem(key(userId), JSON.stringify(entries));
    else localStorage.removeItem(key(userId));
    return true;
  } catch {
    return false;
  }
}

export const newTempId = () => `${OFFLINE_PREFIX}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
