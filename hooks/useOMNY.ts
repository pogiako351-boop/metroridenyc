import { useState, useCallback, useEffect } from 'react';
import { getUserTaps, insertTap } from '@/lib/supabase';

export function useOMNY(userId: string | null) {
  const [tapCount, setTapCount] = useState(0);
  const [taps, setTaps] = useState<{ id: string; timestamp: string; station_id: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [tapping, setTapping] = useState(false);

  const fetchTaps = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getUserTaps(userId);
      setTaps(data);
      setTapCount(data.length);
    } catch (e) {
      // silent fail — show stale data
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const tap = useCallback(async (stationId?: string) => {
    if (!userId) return;
    setTapping(true);
    try {
      await insertTap(userId, stationId ?? 'unknown');
      await fetchTaps();
    } finally {
      setTapping(false);
    }
  }, [userId, fetchTaps]);

  useEffect(() => {
    fetchTaps();
  }, [fetchTaps]);

  const isUnlimited = tapCount >= 12;
  const ridesLeft = Math.max(0, 12 - tapCount);
  const progress = Math.min(tapCount / 12, 1);

  // Daily breakdown (last 7 days)
  const dailyTaps = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - i));
    day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    const count = taps.filter((t) => {
      const ts = new Date(t.timestamp).getTime();
      return ts >= day.getTime() && ts < nextDay.getTime();
    }).length;
    return { day, count };
  });

  return { tapCount, taps, loading, tapping, tap, isUnlimited, ridesLeft, progress, dailyTaps, fetchTaps };
}
