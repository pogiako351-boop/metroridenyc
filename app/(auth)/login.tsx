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
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signInWithEmail, isLoading, error } = useAuth();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    await signInWithEmail(email.trim(), password);
  };

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
        {/* Logo */}
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
              shadowColor: Colors.gold,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <Text style={{ fontSize: 32 }}>🚇</Text>
          </View>
          <Text style={{ fontFamily: Fonts.bold, fontSize: 28, color: Colors.white }}>
            MetroRide NYC
          </Text>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.muted, marginTop: 6 }}>
            Sign in to your account
          </Text>
        </View>

        {/* Form */}
        <View style={{ gap: 14 }}>
          <TextInput
            placeholder="Email address"
            placeholderTextColor={Colors.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
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
          <View style={{ position: 'relative' }}>
            <TextInput
              placeholder="Password"
              placeholderTextColor={Colors.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
              style={{
                backgroundColor: Colors.card,
                borderRadius: 12,
                borderCurve: 'continuous',
                padding: 16,
                paddingRight: 50,
                color: Colors.white,
                fontFamily: Fonts.regular,
                fontSize: 15,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            />
            <Pressable
              onPress={() => setShowPassword((s) => !s)}
              style={{ position: 'absolute', right: 16, top: 16 }}
              hitSlop={8}
            >
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={Colors.muted} />
            </Pressable>
          </View>

          {error && (
            <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.red }}>
              {error.message}
            </Text>
          )}

          <Pressable
            onPress={handleLogin}
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
              <Text style={{ fontFamily: Fonts.bold, fontSize: 16, color: '#000' }}>Sign In</Text>
            )}
          </Pressable>

          <Link href="/(auth)/forgot-password" asChild>
            <Pressable style={{ alignItems: 'center', paddingVertical: 4 }}>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.muted }}>
                Forgot password?
              </Text>
            </Pressable>
          </Link>
        </View>

        {/* Footer */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 40, gap: 4 }}>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.muted }}>
            Don&apos;t have an account?
          </Text>
          <Link href="/(auth)/signup" asChild>
            <Pressable>
              <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.gold }}>
                Sign Up
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
