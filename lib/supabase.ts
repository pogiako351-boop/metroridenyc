import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Whether Supabase is properly configured with valid credentials.
 * When false, the app operates in degraded/offline mode — all DB calls
 * return empty data and auth falls back to local UUID.
 */
export let isSupabaseAvailable = false;

// Create a safe Supabase client — handles missing env vars gracefully
function createSafeClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      '[MetroRide] Supabase env vars missing — running in offline mode. ' +
      'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable backend.'
    );
    // Create a client with placeholder values — all calls will fail gracefully
    // We still need a valid SupabaseClient shape for type safety
    const stub = createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
    isSupabaseAvailable = false;
    return stub;
  }

  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    isSupabaseAvailable = true;
    return client;
  } catch (e) {
    console.error('[MetroRide] Supabase client creation failed:', e);
    isSupabaseAvailable = false;
    // Return a stub client that won't crash the app
    const stub = createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
    return stub;
  }
}

export const supabase = createSafeClient();

// Only register auto-refresh listeners if Supabase is actually available
if (isSupabaseAvailable) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

/**
 * Ensures the user always has a session:
 * 1. If Supabase is unavailable (env vars missing), skip to local UUID.
 * 2. If a session already exists (anonymous or real), keep it.
 * 3. Otherwise, try Supabase anonymous sign-in.
 * 4. If that fails (e.g., anonymous auth not enabled), fall back to local UUID.
 *
 * Returns the user_id or null on complete failure.
 */
export async function initAnonymousAuth(): Promise<string | null> {
  try {
    // If Supabase isn't configured, go straight to local fallback
    if (!isSupabaseAvailable) {
      return getOrCreateLocalId();
    }

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

    // Fallback: anonymous auth may not be enabled — use local-only UUID
    return getOrCreateLocalId();
  } catch {
    // Any failure → local fallback, never crash
    return getOrCreateLocalId();
  }
}

/** Generate or retrieve a persistent local UUID for offline-only mode */
async function getOrCreateLocalId(): Promise<string> {
  const ANON_ID_KEY = '@metroride_anon_id';
  try {
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
    // Even AsyncStorage failed — return an ephemeral ID (won't persist across sessions)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

// Database helpers — all return empty data when Supabase is unavailable
export async function getUserTaps(userId: string) {
  if (!isSupabaseAvailable) return [];
  const since = new Date(Date.now() - 168 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('user_taps')
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', since)
    .order('timestamp', { ascending: false });
  if (error) {
    console.warn('[MetroRide] getUserTaps failed:', error.message);
    return [];
  }
  return data ?? [];
}

export async function insertTap(userId: string, stationId: string = 'unknown') {
  if (!isSupabaseAvailable) return;
  const { error } = await supabase.from('user_taps').insert({
    user_id: userId,
    station_id: stationId,
    type: 'entry',
  });
  if (error) console.warn('[MetroRide] insertTap failed:', error.message);
}

export async function getSavedRoutes(userId: string) {
  if (!isSupabaseAvailable) return [];
  const { data, error } = await supabase
    .from('saved_routes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('[MetroRide] getSavedRoutes failed:', error.message);
    return [];
  }
  return data ?? [];
}

export async function deleteSavedRoute(id: string) {
  if (!isSupabaseAvailable) return;
  const { error } = await supabase.from('saved_routes').delete().eq('id', id);
  if (error) console.warn('[MetroRide] deleteSavedRoute failed:', error.message);
}

export async function addSavedRoute(userId: string, start: string, end: string) {
  if (!isSupabaseAvailable) return;
  const { error } = await supabase.from('saved_routes').insert({
    user_id: userId,
    start_station: start,
    end_station: end,
  });
  if (error) console.warn('[MetroRide] addSavedRoute failed:', error.message);
}

export async function getCommunityReports(stationId?: string) {
  if (!isSupabaseAvailable) return [];
  let query = supabase
    .from('community_reports')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(20);
  if (stationId) query = query.eq('station_id', stationId);
  const { data, error } = await query;
  if (error) {
    console.warn('[MetroRide] getCommunityReports failed:', error.message);
    return [];
  }
  return data ?? [];
}

export async function submitCommunityReport(
  stationId: string,
  issueType: string,
  carNumber?: number,
  userId?: string,
) {
  if (!isSupabaseAvailable) return;
  const { error } = await supabase.from('community_reports').insert({
    station_id: stationId,
    issue_type: issueType,
    car_number: carNumber ?? null,
    user_id: userId ?? null,
  });
  if (error) console.warn('[MetroRide] submitCommunityReport failed:', error.message);
}
