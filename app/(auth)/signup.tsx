import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@fastshot/auth';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signUpWithEmail, isLoading, error, pendingEmailVerification } = useAuth();
  const insets = useSafeAreaInsets();

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) return;
    await signUpWithEmail(email.trim(), password);
  };

  if (pendingEmailVerification) {
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
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.bg }} behavior="padding">
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
            Join MetroRide NYC
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
            <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.red }}>
              {error.message}
            </Text>
          )}

          <Pressable
            onPress={handleSignUp}
            disabled={isLoading}
            style={({ pressed }) => ({
              backgroundColor: Colors.gold,
              borderRadius: 14,
              borderCurve: 'continuous',
              padding: 16,
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
