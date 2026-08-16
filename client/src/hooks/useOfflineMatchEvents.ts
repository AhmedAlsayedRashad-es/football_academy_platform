import { useState, useEffect, useCallback } from 'react';
import {
  queueMatchEvent,
  getPendingMatchEvents,
  markMatchEventSynced,
  clearSyncedMatchEvents,
  type PendingMatchEvent,
} from '@/lib/offlineMatchEvents';
import { trpc } from '@/lib/trpc';
import { toast } from '@/hooks/use-toast';

export function useOfflineMatchEvents(liveMatchId: number | null) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const recordEventMutation = trpc.liveMatch.recordEvent.useMutation();

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: '🌐 Back online',
        description: 'Syncing queued match events...',
      });
      syncPendingEvents();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: '📴 You are offline',
        description: 'Match events will be saved locally and synced when reconnected.',
        variant: 'destructive',
      });
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [liveMatchId]);

  // Load pending count on mount and when liveMatchId changes
  useEffect(() => {
    if (!liveMatchId) return;
    getPendingMatchEvents(liveMatchId).then(events => setPendingCount(events.length));
  }, [liveMatchId]);

  const syncPendingEvents = useCallback(async () => {
    if (!liveMatchId || isSyncing) return;
    const pending = await getPendingMatchEvents(liveMatchId);
    if (!pending.length) return;

    setIsSyncing(true);
    let syncedCount = 0;
    let failedCount = 0;

    for (const event of pending) {
      try {
        await recordEventMutation.mutateAsync({
          liveMatchId: event.liveMatchId,
          eventType: event.eventType as any,
          minute: event.minute,
          playerId: event.playerId,
          playerName: event.playerName,
          assistPlayerId: event.assistPlayerId,
          assistPlayerName: event.assistPlayerName,
          substitutedPlayerId: event.substitutedPlayerId,
          substitutedPlayerName: event.substitutedPlayerName,
          isOurTeam: event.isOurTeam,
          description: event.description,
        });
        await markMatchEventSynced(event.id!);
        syncedCount++;
      } catch {
        failedCount++;
      }
    }

    await clearSyncedMatchEvents();
    const remaining = await getPendingMatchEvents(liveMatchId);
    setPendingCount(remaining.length);
    setIsSyncing(false);

    if (syncedCount > 0) {
      toast({
        title: `✅ Synced ${syncedCount} match event${syncedCount > 1 ? 's' : ''}`,
        description: failedCount > 0 ? `${failedCount} events failed to sync.` : 'All events saved successfully.',
      });
    }
  }, [liveMatchId, isSyncing]);

  /**
   * Smart record: if online → call API directly; if offline → queue in IndexedDB
   */
  const recordEvent = useCallback(async (
    eventData: Omit<PendingMatchEvent, 'id' | 'liveMatchId' | 'queuedAt' | 'synced'>
  ) => {
    if (!liveMatchId) throw new Error('No live match ID');

    if (isOnline) {
      // Direct API call
      return recordEventMutation.mutateAsync({
        liveMatchId,
        eventType: eventData.eventType as any,
        minute: eventData.minute,
        playerId: eventData.playerId,
        playerName: eventData.playerName,
        assistPlayerId: eventData.assistPlayerId,
        assistPlayerName: eventData.assistPlayerName,
        substitutedPlayerId: eventData.substitutedPlayerId,
        substitutedPlayerName: eventData.substitutedPlayerName,
        isOurTeam: eventData.isOurTeam,
        description: eventData.description,
      });
    } else {
      // Queue offline
      await queueMatchEvent({ ...eventData, liveMatchId });
      const pending = await getPendingMatchEvents(liveMatchId);
      setPendingCount(pending.length);
      toast({
        title: '📋 Event queued offline',
        description: `${pending.length} event${pending.length > 1 ? 's' : ''} will sync when you reconnect.`,
      });
      return { queued: true };
    }
  }, [liveMatchId, isOnline]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    recordEvent,
    syncPendingEvents,
    isRecording: recordEventMutation.isPending,
  };
}
