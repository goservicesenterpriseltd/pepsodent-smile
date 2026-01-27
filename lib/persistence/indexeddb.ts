import { DBSchema, IDBPDatabase, openDB } from 'idb';

import type { SmileAttempt } from '@/types/leaderboard';

interface PepsodentDB extends DBSchema {
  attempts: {
    key: string;
    value: SmileAttempt;
    indexes: { 'by-email': string; 'by-timestamp': number; 'by-score': number };
  };
}

let dbPromise: Promise<IDBPDatabase<PepsodentDB>> | null = null;

function getDB(): Promise<IDBPDatabase<PepsodentDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PepsodentDB>('pepsodent-smile', 1, {
      upgrade(db) {
        const attemptsStore = db.createObjectStore('attempts', {
          keyPath: 'id',
        });
        attemptsStore.createIndex('by-email', 'email');
        attemptsStore.createIndex('by-timestamp', 'timestamp');
        attemptsStore.createIndex('by-score', 'score');
      },
    });
  }
  return dbPromise;
}

export async function saveAttempt(attempt: SmileAttempt): Promise<void> {
  const db = await getDB();
  await db.put('attempts', attempt);
}

export async function getAllAttempts(): Promise<SmileAttempt[]> {
  const db = await getDB();
  return db.getAll('attempts');
}

export async function getAttemptsByEmail(email: string): Promise<SmileAttempt[]> {
  const db = await getDB();
  const index = db.transaction('attempts').store.index('by-email');
  return index.getAll(email);
}

export async function clearAllAttempts(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('attempts', 'readwrite');
  await tx.store.clear();
  await tx.done;
}

export async function getAttemptById(id: string): Promise<SmileAttempt | undefined> {
  const db = await getDB();
  return db.get('attempts', id);
}

