/**
 * Offline Attendance Sync Utility
 * Queues attendance records in IndexedDB when offline,
 * then syncs them automatically when the connection is restored.
 */

const DB_NAME = 'footy-offline';
const STORE_NAME = 'pending-attendance';
const DB_VERSION = 1;

export interface PendingAttendanceRecord {
  id?: number; // auto-assigned by IndexedDB
  queuedAt: number; // timestamp
  sessionId?: number;
  sessionType: 'training' | 'match' | 'trial' | 'assessment';
  sessionDate: string;
  records: Array<{
    playerId: number;
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string;
  }>;
  retryCount: number;
}

// Open (or create) the IndexedDB database
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('queuedAt', 'queuedAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Queue an attendance batch for offline sync */
export async function queueAttendance(data: Omit<PendingAttendanceRecord, 'id' | 'queuedAt' | 'retryCount'>): Promise<number> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const record: PendingAttendanceRecord = { ...data, queuedAt: Date.now(), retryCount: 0 };
    const req = store.add(record);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

/** Get all pending attendance records */
export async function getPendingAttendance(): Promise<PendingAttendanceRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as PendingAttendanceRecord[]);
    req.onerror = () => reject(req.error);
  });
}

/** Remove a synced record from the queue */
export async function removePendingAttendance(id: number): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/** Count pending records */
export async function getPendingCount(): Promise<number> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Check if browser is online */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Sync all pending attendance records.
 * Pass the tRPC bulkRecord mutation function as the sync handler.
 */
export async function syncPendingAttendance(
  bulkRecordFn: (data: Omit<PendingAttendanceRecord, 'id' | 'queuedAt' | 'retryCount'>) => Promise<unknown>,
  onProgress?: (synced: number, total: number) => void
): Promise<{ synced: number; failed: number }> {
  if (!isOnline()) return { synced: 0, failed: 0 };

  const pending = await getPendingAttendance();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const record of pending) {
    try {
      await bulkRecordFn({
        sessionId: record.sessionId,
        sessionType: record.sessionType,
        sessionDate: record.sessionDate,
        records: record.records,
      });
      await removePendingAttendance(record.id!);
      synced++;
      onProgress?.(synced, pending.length);
    } catch (err) {
      failed++;
      console.warn('[OfflineSync] Failed to sync attendance record:', err);
    }
  }

  return { synced, failed };
}
