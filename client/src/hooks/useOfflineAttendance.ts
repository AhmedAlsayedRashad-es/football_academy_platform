/**
 * useOfflineAttendance — React hook for offline-aware attendance marking
 *
 * Usage in AttendanceTracking.tsx:
 *   const { isOnline, pendingCount, submitAttendance, syncNow } = useOfflineAttendance();
 */
import { useState, useEffect, useCallback } from 'react';
import {
  queueAttendance,
  getPendingCount,
  syncPendingAttendance,
  isOnline as checkOnline,
  type PendingAttendanceRecord,
} from '@/lib/offlineAttendance';

interface UseOfflineAttendanceOptions {
  /** The tRPC bulkRecord mutation function */
  bulkRecordFn: (data: Omit<PendingAttendanceRecord, 'id' | 'queuedAt' | 'retryCount'>) => Promise<unknown>;
  onSyncComplete?: (synced: number) => void;
  onSyncError?: (failed: number) => void;
}

export function useOfflineAttendance({
  bulkRecordFn,
  onSyncComplete,
  onSyncError,
}: UseOfflineAttendanceOptions) {
  const [online, setOnline] = useState(checkOnline());
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Keep online state in sync with browser events
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Refresh pending count on mount and when online status changes
  useEffect(() => {
    getPendingCount().then(setPendingCount).catch(() => {});
  }, [online]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (online && pendingCount > 0) {
      syncNow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  /** Submit attendance — queues offline if no connection, submits directly if online */
  const submitAttendance = useCallback(
    async (data: Omit<PendingAttendanceRecord, 'id' | 'queuedAt' | 'retryCount'>): Promise<'submitted' | 'queued'> => {
      if (checkOnline()) {
        await bulkRecordFn(data);
        return 'submitted';
      } else {
        await queueAttendance(data);
        const count = await getPendingCount();
        setPendingCount(count);
        return 'queued';
      }
    },
    [bulkRecordFn]
  );

  /** Manually trigger a sync of all pending records */
  const syncNow = useCallback(async () => {
    if (!checkOnline() || isSyncing) return;
    setIsSyncing(true);
    try {
      const { synced, failed } = await syncPendingAttendance(bulkRecordFn);
      const remaining = await getPendingCount();
      setPendingCount(remaining);
      if (synced > 0) onSyncComplete?.(synced);
      if (failed > 0) onSyncError?.(failed);
    } finally {
      setIsSyncing(false);
    }
  }, [bulkRecordFn, isSyncing, onSyncComplete, onSyncError]);

  return {
    isOnline: online,
    pendingCount,
    isSyncing,
    submitAttendance,
    syncNow,
  };
}
