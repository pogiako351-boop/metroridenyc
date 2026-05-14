import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@fastshot/auth';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const { resetPassword, isLoading, error, pendingPasswordReset } = useAuth();
  const insets = useSafeAreaInsets();

  if (pendingPasswordReset) {
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
        <Text style={{ fontSize: 48, marginBottom: 20 }}>🔑</Text>
        <Text style={{ fontFamily: Fonts.bold, fontSize: 22, color: Colors.white, textAlign: 'center', marginBottom: 12 }}>
          Reset link sent!
        </Text>
        <Text style={{ fontFamily: Fonts.regular, fontSize: 15, color: Colors.muted, textAlign: 'center' }}>
          Check your inbox for reset instructions.
        </Text>
        <Link href="/(auth)/login" asChild>
          <Pressable
            style={{
              marginTop: 32,
              backgroundColor: Colors.card,
              borderRadius: 12,
              borderCurve: 'continuous',
              paddingVertical: 14,
              paddingHorizontal: 28,
            }}
          >
            <Text style={{ fontFamily: Fonts.semiBold, fontSize: 15, color: Colors.white }}>
              Back to Sign In
            </Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior="padding"
    >
      <View
        style={{
          flex: 1,
          paddingHorizontal: 28,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 24,
          justifyContent: 'center',
          gap: 14,
        }}
      >
        <Text style={{ fontFamily: Fonts.bold, fontSize: 26, color: Colors.white, marginBottom: 8 }}>
          Reset Password
        </Text>
        <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.muted, marginBottom: 16 }}>
          Enter your email and we&apos;ll send you a reset link.
        </Text>

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

        {error && (
          <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.red }}>
            {error.message}
          </Text>
        )}

        <Pressable
          onPress={() => resetPassword(email.trim())}
          disabled={isLoading || !email.trim()}
          style={({ pressed }) => ({
            backgroundColor: Colors.gold,
            borderRadius: 14,
            borderCurve: 'continuous',
            padding: 16,
            alignItems: 'center',
            opacity: pressed || !email.trim() ? 0.7 : 1,
          })}
        >
          {isLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={{ fontFamily: Fonts.bold, fontSize: 16, color: '#000' }}>
              Send Reset Link
            </Text>
          )}
        </Pressable>

        <Link href="/(auth)/login" asChild>
          <Pressable style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.muted }}>
              ← Back to Sign In
            </Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
