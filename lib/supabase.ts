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
