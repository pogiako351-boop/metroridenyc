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

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts(FontMap);
  const [authReady, setAuthReady] = useState(false);

  // Silently establish an anonymous session on first launch.
  // This runs once; supabase persists the session via AsyncStorage on subsequent launches.
  useEffect(() => {
    initAnonymousAuth().finally(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    if ((loaded || error) && authReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, authReady]);

  if ((!loaded && !error) || !authReady) {
    return null;
  }

  return (
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
  );
}
