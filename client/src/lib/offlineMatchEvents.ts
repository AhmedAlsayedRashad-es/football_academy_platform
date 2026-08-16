/**
 * Offline Match Event Queue
 * Queues match events in IndexedDB when offline and syncs them when connection is restored.
 */

const DB_NAME = 'academy-offline-db';
const DB_VERSION = 2;
const MATCH_EVENTS_STORE = 'pendingMatchEvents';

export interface PendingMatchEvent {
  id?: number;
  liveMatchId: number;
  eventType: string;
  minute: number;
  playerId?: number;
  playerName?: string;
  assistPlayerId?: number;
  assistPlayerName?: string;
  substitutedPlayerId?: number;
  substitutedPlayerName?: string;
  isOurTeam: boolean;
  description?: string;
  queuedAt: string;
  synced: boolean;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(MATCH_EVENTS_STORE)) {
        const store = db.createObjectStore(MATCH_EVENTS_STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('liveMatchId', 'liveMatchId', { unique: false });
      }
      // Also create attendance store if not exists (shared DB)
      if (!db.objectStoreNames.contains('pendingAttendance')) {
        const attStore = db.createObjectStore('pendingAttendance', { keyPath: 'id', autoIncrement: true });
        attStore.createIndex('synced', 'synced', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function queueMatchEvent(event: Omit<PendingMatchEvent, 'id' | 'queuedAt' | 'synced'>): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MATCH_EVENTS_STORE, 'readwrite');
    const store = tx.objectStore(MATCH_EVENTS_STORE);
    const record: PendingMatchEvent = {
      ...event,
      queuedAt: new Date().toISOString(),
      synced: false,
    };
    const req = store.add(record);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingMatchEvents(liveMatchId?: number): Promise<PendingMatchEvent[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MATCH_EVENTS_STORE, 'readonly');
    const store = tx.objectStore(MATCH_EVENTS_STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      let results = (req.result as PendingMatchEvent[]).filter(e => !e.synced);
      if (liveMatchId !== undefined) {
        results = results.filter(e => e.liveMatchId === liveMatchId);
      }
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function markMatchEventSynced(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MATCH_EVENTS_STORE, 'readwrite');
    const store = tx.objectStore(MATCH_EVENTS_STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const record = getReq.result;
      if (record) {
        record.synced = true;
        store.put(record);
      }
      resolve();
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function clearSyncedMatchEvents(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MATCH_EVENTS_STORE, 'readwrite');
    const store = tx.objectStore(MATCH_EVENTS_STORE);
    const index = store.index('synced');
    const req = index.openCursor(IDBKeyRange.only(true));
    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
  });
}
