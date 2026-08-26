'use client';

import { useEffect, useRef } from 'react';
import api from '@/lib/api';

const SYNC_INTERVAL = 30; // sync every 30 seconds

/**
 * useDailyTimer — tracks time spent on a page and syncs to backend.
 * Call this hook in any learning page (reels, modules, tutor, etc.)
 */
export function useDailyTimer(active = true) {
  const elapsedRef = useRef(0);
  const lastSyncRef = useRef(0);

  useEffect(() => {
    if (!active) return;

    const interval = setInterval(() => {
      elapsedRef.current += 1;

      // Sync every SYNC_INTERVAL seconds
      if (elapsedRef.current - lastSyncRef.current >= SYNC_INTERVAL) {
        const secondsToLog = elapsedRef.current - lastSyncRef.current;
        lastSyncRef.current = elapsedRef.current;

        api.patch('/users/time', { seconds: secondsToLog }).catch(() => {
          // Silently fail — don't interrupt the UX
        });
      }
    }, 1000);

    // Sync remaining on unmount
    return () => {
      clearInterval(interval);
      const remaining = elapsedRef.current - lastSyncRef.current;
      if (remaining > 0) {
        api.patch('/users/time', { seconds: remaining }).catch(() => {});
      }
    };
  }, [active]);
}
