import { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

// Handles web OAuth redirects by parsing the URL fragment that Supabase injects
export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    // On web, Supabase puts the tokens in the URL hash — getSession will pick them up
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    });
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <ActivityIndicator color={Colors.gold} size="large" />
      <Text style={{ fontFamily: Fonts.regular, fontSize: 15, color: Colors.muted }}>
        Signing you in...
      </Text>
    </View>
  );
}
