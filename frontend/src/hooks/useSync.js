import { useState, useEffect, useCallback } from 'react';
import { getPending, removePending } from '../db';
import { postBatch } from '../api';

export function useSync(token) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    const items = await getPending();
    setPendingCount(items.length);
  }, []);

  const flushPending = useCallback(async () => {
    if (!token || syncing) return;
    const items = await getPending();
    if (!items.length) return;
    setSyncing(true);
    try {
      const records = items.map((i) => i.value);
      await postBatch(records, token);
      for (const { key } of items) {
        await removePending(key);
      }
      await refreshPendingCount();
    } catch {
      // intentionally silent — will retry on next reconnect
    } finally {
      setSyncing(false);
    }
  }, [token, syncing, refreshPendingCount]);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      flushPending();
    };
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [flushPending]);

  return { isOnline, pendingCount, refreshPendingCount, flushPending, syncing };
}
