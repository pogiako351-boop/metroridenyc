import 'react-native-url-polyfill/auto';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { FontMap } from '@/constants/Typography';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initAnonymousAuth } from '@/lib/supabase';
import { ErrorBoundary } from '@/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

// Guard: hide splash after 5 s max, even if fonts or auth never resolve.
// This prevents a permanent white screen on web when env vars are missing.
const SPLASH_TIMEOUT_MS = 5000;

export default function RootLayout() {
  const [loaded, error] = useFonts(FontMap);
  const [authReady, setAuthReady] = useState(false);

  // Silently establish an anonymous session on first launch.
  // This runs once; supabase persists the session via AsyncStorage on subsequent launches.
  // A 4-second timeout prevents the screen from hanging if Supabase is unreachable.
  useEffect(() => {
    const timeout = setTimeout(() => setAuthReady(true), 4000);
    initAnonymousAuth().finally(() => {
      clearTimeout(timeout);
      setAuthReady(true);
    });
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if ((loaded || error) && authReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
    // Safety net: always hide splash after SPLASH_TIMEOUT_MS
    const id = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), SPLASH_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [loaded, error, authReady]);

  if ((!loaded && !error) || !authReady) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
            <Stack.Screen name="train-detail" options={{ presentation: 'card' }} />
            <Stack.Screen name="auth/callback" />
          </Stack>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
