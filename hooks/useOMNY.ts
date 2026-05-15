import { useState, useCallback, useEffect, useRef } from 'react';
import { getUserTaps, insertTap } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'metroride-nyc-v1';
const ROLLING_WINDOW_MS = 168 * 60 * 60 * 1000; // 168 hours = 7 days exactly

interface LocalTap {
  id: string;
  timestamp: string;
  station_id: string;
}

// Get taps from localStorage for offline / no-auth persistence
async function getLocalTaps(): Promise<LocalTap[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalTap[];
    // Filter to rolling 168-hour window
    const cutoff = Date.now() - ROLLING_WINDOW_MS;
    return parsed.filter((t) => new Date(t.timestamp).getTime() >= cutoff);
  } catch {
    return [];
  }
}

async function saveLocalTaps(taps: LocalTap[]): Promise<void> {
  try {
    // Only persist taps within the rolling window
    const cutoff = Date.now() - ROLLING_WINDOW_MS;
    const valid = taps.filter((t) => new Date(t.timestamp).getTime() >= cutoff);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
  } catch {
    // Silent fail — localStorage may be full
  }
}

function generateLocalId(): string {
  return 'tap_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

export function useOMNY(userId: string | null) {
  const [tapCount, setTapCount] = useState(0);
  const [taps, setTaps] = useState<LocalTap[]>([]);
  const [loading, setLoading] = useState(false);
  const [tapping, setTapping] = useState(false);
  const initialLoadDone = useRef(false);

  // Filter taps to the rolling 168-hour (7-day) window from NOW
  const filterToWindow = (allTaps: LocalTap[]): LocalTap[] => {
    const cutoff = Date.now() - ROLLING_WINDOW_MS;
    return allTaps.filter((t) => new Date(t.timestamp).getTime() >= cutoff);
  };

  const fetchTaps = useCallback(async () => {
    setLoading(true);
    try {
      let data: LocalTap[] = [];

      if (userId) {
        // Try Supabase first for authenticated users
        try {
          data = await getUserTaps(userId);
        } catch {
          // Fall back to local storage if Supabase fails
          data = await getLocalTaps();
        }
      } else {
        // No auth — use localStorage only
        data = await getLocalTaps();
      }

      const windowTaps = filterToWindow(data);
      setTaps(windowTaps);
      setTapCount(windowTaps.length);

      // Sync to localStorage for persistence across refreshes
      await saveLocalTaps(windowTaps);
    } catch {
      // Fall back to local storage
      const localTaps = await getLocalTaps();
      const windowTaps = filterToWindow(localTaps);
      setTaps(windowTaps);
      setTapCount(windowTaps.length);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const tap = useCallback(async (stationId?: string) => {
    setTapping(true);
    try {
      const newTap: LocalTap = {
        id: generateLocalId(),
        timestamp: new Date().toISOString(),
        station_id: stationId ?? 'unknown',
      };

      // Persist to Supabase if user is authenticated
      if (userId) {
        try {
          await insertTap(userId, stationId ?? 'unknown');
        } catch {
          // Silent fail — local tap still counts
        }
      }

      // Always update local storage for immediate feedback & offline persistence
      const currentTaps = await getLocalTaps();
      const updatedTaps = [newTap, ...currentTaps];
      await saveLocalTaps(updatedTaps);

      // Re-fetch to get consistent state
      await fetchTaps();
    } catch {
      // Ensure local state still updates even on error
      await fetchTaps();
    } finally {
      setTapping(false);
    }
  }, [userId, fetchTaps]);

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchTaps();
    }
  }, [fetchTaps]);

  // Rolling 168-hour window calculations
  const windowTaps = filterToWindow(taps);
  const isUnlimited = windowTaps.length >= 12;
  const ridesLeft = Math.max(0, 12 - windowTaps.length);
  const progress = Math.min(windowTaps.length / 12, 1);

  // Daily breakdown (last 7 days)
  const dailyTaps = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - i));
    day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    const count = windowTaps.filter((t) => {
      const ts = new Date(t.timestamp).getTime();
      return ts >= day.getTime() && ts < nextDay.getTime();
    }).length;
    return { day, count };
  });

  return { tapCount: windowTaps.length, taps: windowTaps, loading, tapping, tap, isUnlimited, ridesLeft, progress, dailyTaps, fetchTaps };
}
