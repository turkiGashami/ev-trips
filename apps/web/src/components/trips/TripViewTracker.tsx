'use client';

import { useEffect } from 'react';
import { tripsApi } from '@/lib/api/trips.api';

/**
 * Fire-and-forget view ping. Mounted once per trip page render so each
 * fresh navigation counts as a view. Deduplicated within the same
 * browser session so a user reloading the page repeatedly doesn't
 * inflate the counter.
 */
export default function TripViewTracker({ tripId }: { tripId: string }) {
  useEffect(() => {
    if (!tripId || typeof window === 'undefined') return;
    try {
      const key = `trip-viewed:${tripId}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // sessionStorage might be unavailable (private mode) — fall through
    }
    tripsApi.incrementView(tripId).catch(() => {
      // Ignore — view counting is best-effort
    });
  }, [tripId]);
  return null;
}
