import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

/**
 * Ensures the user always has a session:
 * 1. If a session already exists (anonymous or real), keep it.
 * 2. Otherwise, try Supabase anonymous sign-in.
 * 3. If that fails (e.g., anonymous auth not enabled), fall back gracefully.
 *
 * Returns the user_id or null on complete failure.
 */
export async function initAnonymousAuth(): Promise<string | null> {
  try {
    // Check if we already have a valid session
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.user?.id) {
      return sessionData.session.user.id;
    }

    // Try anonymous sign-in
    const { data, error } = await supabase.auth.signInAnonymously();
    if (!error && data.user?.id) {
      return data.user.id;
    }

    // Fallback: anonymous auth may not be enabled — use local-only UUID stored in AsyncStorage
    const ANON_ID_KEY = '@metroride_anon_id';
    let localId = await AsyncStorage.getItem(ANON_ID_KEY);
    if (!localId) {
      // Generate a RFC4122 v4 UUID
      localId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
      await AsyncStorage.setItem(ANON_ID_KEY, localId);
    }
    return localId;
  } catch {
    return null;
  }
}

// Database helpers
export async function getUserTaps(userId: string) {
  const since = new Date(Date.now() - 168 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('user_taps')
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', since)
    .order('timestamp', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertTap(userId: string, stationId: string = 'unknown') {
  const { error } = await supabase.from('user_taps').insert({
    user_id: userId,
    station_id: stationId,
    type: 'entry',
  });
  if (error) throw error;
}

export async function getSavedRoutes(userId: string) {
  const { data, error } = await supabase
    .from('saved_routes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function deleteSavedRoute(id: string) {
  const { error } = await supabase.from('saved_routes').delete().eq('id', id);
  if (error) throw error;
}

export async function addSavedRoute(userId: string, start: string, end: string) {
  const { error } = await supabase.from('saved_routes').insert({
    user_id: userId,
    start_station: start,
    end_station: end,
  });
  if (error) throw error;
}

export async function getCommunityReports(stationId?: string) {
  let query = supabase
    .from('community_reports')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(20);
  if (stationId) query = query.eq('station_id', stationId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function submitCommunityReport(
  stationId: string,
  issueType: string,
  carNumber?: number,
  userId?: string,
) {
  const { error } = await supabase.from('community_reports').insert({
    station_id: stationId,
    issue_type: issueType,
    car_number: carNumber ?? null,
    user_id: userId ?? null,
  });
  if (error) throw error;
}
