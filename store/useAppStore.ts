import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Preferences } from './types';

interface PreferencesSlice {
  preferences: Preferences;
  installBannerDismissed: boolean;
  setInstallBannerDismissed: (dismissed: boolean) => void;
}

export type AppStore = PreferencesSlice;

// Use localStorage on web (required for PWA zero-footprint) and AsyncStorage on native
const storage = Platform.OS === 'web'
  ? createJSONStorage(() => localStorage)
  : createJSONStorage(() => AsyncStorage);

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      preferences: {},
      installBannerDismissed: false,
      setInstallBannerDismissed: (dismissed) => set({ installBannerDismissed: dismissed }),
    }),
    {
      name: 'metroride-nyc-v1',
      storage,
      partialize: (state) => ({
        preferences: state.preferences,
        installBannerDismissed: state.installBannerDismissed,
      }),
    }
  )
);
