import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) return;
    setError(null);
    setIsLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (signUpError) {
        setError(signUpError.message);
      } else {
        setPendingVerification(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 28,
        }}
      >
        <Text style={{ fontSize: 48, marginBottom: 20 }}>📧</Text>
        <Text style={{ fontFamily: Fonts.bold, fontSize: 22, color: Colors.white, textAlign: 'center', marginBottom: 12 }}>
          Check your email
        </Text>
        <Text style={{ fontFamily: Fonts.regular, fontSize: 15, color: Colors.muted, textAlign: 'center', lineHeight: 22 }}>
          We sent a verification link to{'\n'}
          <Text style={{ color: Colors.gold }}>{email}</Text>
        </Text>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
          style={({ pressed }) => ({
            marginTop: 32,
            backgroundColor: pressed ? Colors.border : Colors.card,
            borderRadius: 12,
            borderCurve: 'continuous',
            paddingVertical: 14,
            paddingHorizontal: 28,
          })}
        >
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 15, color: Colors.white }}>
            Back to App
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 28,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 24,
          justifyContent: 'center',
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Close button */}
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
          style={{ position: 'absolute', top: insets.top + 16, right: 20 }}
          hitSlop={12}
        >
          <Ionicons name="close" size={26} color={Colors.muted} />
        </Pressable>

        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              borderCurve: 'continuous',
              backgroundColor: Colors.gold,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 32 }}>🚇</Text>
          </View>
          <Text style={{ fontFamily: Fonts.bold, fontSize: 28, color: Colors.white }}>
            Create Account
          </Text>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.muted, marginTop: 6 }}>
            Sync your ride data across devices
          </Text>
        </View>

        <View style={{ gap: 14 }}>
          <TextInput
            placeholder="Email address"
            placeholderTextColor={Colors.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={{
              backgroundColor: Colors.card,
              borderRadius: 12,
              borderCurve: 'continuous',
              padding: 16,
              color: Colors.white,
              fontFamily: Fonts.regular,
              fontSize: 15,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          />
          <TextInput
            placeholder="Password (min. 8 characters)"
            placeholderTextColor={Colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{
              backgroundColor: Colors.card,
              borderRadius: 12,
              borderCurve: 'continuous',
              padding: 16,
              color: Colors.white,
              fontFamily: Fonts.regular,
              fontSize: 15,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          />

          {error && (
            <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.red }} selectable>
              {error}
            </Text>
          )}

          <Pressable
            onPress={handleSignUp}
            disabled={isLoading || !email.trim() || !password.trim()}
            style={({ pressed }) => ({
              backgroundColor: Colors.gold,
              borderRadius: 14,
              borderCurve: 'continuous',
              padding: 16,
              alignItems: 'center',
              opacity: pressed || !email.trim() || !password.trim() ? 0.7 : 1,
              marginTop: 6,
            })}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={{ fontFamily: Fonts.bold, fontSize: 16, color: '#000' }}>
                Create Account
              </Text>
            )}
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 40, gap: 4 }}>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.muted }}>
            Already have an account?
          </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.gold }}>
                Sign In
              </Text>
            </Pressable>
          </Link>
        </View>

        {/* Skip prompt */}
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
          style={{ alignItems: 'center', marginTop: 16 }}
        >
          <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.muted }}>
            Continue without an account →
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
