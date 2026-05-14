import { useState, useEffect, useRef } from 'react';

export type CountdownState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'arriving' }
  | { status: 'departed' }
  | { status: 'live'; totalSeconds: number; minutes: number; seconds: number }
  | { status: 'unknown' };

/**
 * Returns a live countdown state that ticks down every second.
 * @param arrivalTimestampMs - Unix ms when the train arrives. null = unknown.
 * @param isLoading - true while feed data is first loading
 * @param hasError - true if feed failed entirely
 */
export function useCountdown(
  arrivalTimestampMs: number | null,
  isLoading: boolean,
  hasError: boolean,
): CountdownState {
  const [now, setNow] = useState(() => Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (isLoading) return { status: 'loading' };
  if (hasError && arrivalTimestampMs === null) return { status: 'error' };
  if (arrivalTimestampMs === null) return { status: 'unknown' };

  const totalSeconds = Math.round((arrivalTimestampMs - now) / 1000);

  if (totalSeconds < -30) return { status: 'departed' };
  if (totalSeconds <= 59) return { status: 'arriving' };

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return { status: 'live', totalSeconds, minutes, seconds };
}

/**
 * Formats countdown state into a display string.
 */
export function formatCountdown(state: CountdownState): string {
  switch (state.status) {
    case 'loading': return '–';
    case 'error': return '–';
    case 'unknown': return '–';
    case 'arriving': return 'Arriving';
    case 'departed': return 'Departed';
    case 'live':
      if (state.minutes === 0) return `${state.seconds}s`;
      if (state.seconds === 0) return `${state.minutes} min`;
      return `${state.minutes} min ${state.seconds}s`;
  }
}
