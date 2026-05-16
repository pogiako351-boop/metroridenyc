import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseAvailable } from '@/lib/supabase';

interface CurrentUser {
  user: User | null;
  session: Session | null;
  isAnonymous: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

/**
 * Provides the current Supabase auth user.
 * Works with both anonymous users (from initAnonymousAuth) and fully authenticated users.
 * isAnonymous = true when the user was silently created via signInAnonymously.
 * Gracefully handles missing Supabase configuration (offline mode).
 */
export function useCurrentUser(): CurrentUser {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If Supabase is unavailable, immediately resolve with no user
    if (!isSupabaseAvailable) {
      setIsLoading(false);
      return;
    }

    // Grab the current session on mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });

    // Subscribe to auth state changes (anonymous → real account upgrades, sign-outs, etc.)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);
      setIsLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (!isSupabaseAvailable) return;
    await supabase.auth.signOut();
  };

  // Anonymous users created by signInAnonymously have is_anonymous = true in user_metadata
  const isAnonymous = user?.is_anonymous === true || !user?.email;

  return { user, session, isAnonymous, isLoading, signOut };
}
