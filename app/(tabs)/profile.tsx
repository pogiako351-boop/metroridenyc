import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { getSavedRoutes, addSavedRoute, deleteSavedRoute } from '@/lib/supabase';
import { adapty, shouldEnableMock } from 'react-native-adapty';
import { router } from 'expo-router';
import LegalModal from '@/components/LegalModal';

const ADAPTY_KEY = process.env.EXPO_PUBLIC_ADAPTY_API_KEY ?? 'mock';

interface SavedRoute {
  id: string;
  start_station: string;
  end_station: string;
}

const SUBWAY_COLORS: Record<string, string> = {
  A: '#2850AD', '1': '#EE352E', N: '#FCCC0A', R: '#FCCC0A',
  G: '#6CBE45', L: '#A7A9AC', '4': '#00933C', '7': '#B933AD',
};

function RouteLineBadge({ station }: { station: string }) {
  const firstChar = station.charAt(0).toUpperCase();
  const bg = SUBWAY_COLORS[firstChar] ?? Colors.muted;
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: Fonts.bold, fontSize: 11, color: '#fff' }}>
        {firstChar}
      </Text>
    </View>
  );
}

/** Banner shown to anonymous users inviting them to sign up — never a gate */
function SignUpBanner() {
  return (
    <Pressable
      onPress={() => router.push('/(auth)/signup')}
      style={({ pressed }) => ({
        backgroundColor: pressed ? '#1F1A00' : Colors.card,
        borderRadius: 20,
        borderCurve: 'continuous',
        padding: 18,
        borderWidth: 1,
        borderColor: Colors.gold + '55',
        gap: 10,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            borderCurve: 'continuous',
            backgroundColor: Colors.gold + '22',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="sync-outline" size={22} color={Colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: Fonts.bold, fontSize: 15, color: Colors.white }}>
            Sync across devices
          </Text>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.muted }}>
            Create an account to keep your tap history & saved routes
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, isAnonymous, signOut } = useCurrentUser();
  const [smartAlarm, setSmartAlarm] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [addRouteModal, setAddRouteModal] = useState(false);
  const [startStation, setStartStation] = useState('');
  const [endStation, setEndStation] = useState('');
  const [savingRoute, setSavingRoute] = useState(false);
  const [proLoading, setProLoading] = useState(false);
  const [legalModal, setLegalModal] = useState(false);

  useEffect(() => {
    if (!shouldEnableMock()) {
      adapty.activate(ADAPTY_KEY, { __ignoreActivationOnFastRefresh: __DEV__ }).catch(() => {});
    }
    loadProStatus();
  }, []);

  useEffect(() => {
    // Load saved routes for all users (anonymous or real) who have a user_id
    if (user && !isAnonymous) {
      loadRoutes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAnonymous]);

  const loadProStatus = async () => {
    try {
      const profile = await adapty.getProfile();
      setIsPro(profile?.accessLevels?.['premium']?.isActive ?? false);
    } catch {
      // mock mode
    }
  };

  const loadRoutes = async () => {
    if (!user) return;
    setLoadingRoutes(true);
    try {
      const data = await getSavedRoutes(user.id);
      setRoutes(data as SavedRoute[]);
    } catch {
      // silent
    } finally {
      setLoadingRoutes(false);
    }
  };

  const handleAddRoute = async () => {
    if (!user || !startStation.trim() || !endStation.trim()) return;
    setSavingRoute(true);
    try {
      await addSavedRoute(user.id, startStation.trim(), endStation.trim());
      await loadRoutes();
      setAddRouteModal(false);
      setStartStation('');
      setEndStation('');
    } catch {
      Alert.alert('Error', 'Failed to save route.');
    } finally {
      setSavingRoute(false);
    }
  };

  const handleDeleteRoute = async (id: string) => {
    Alert.alert('Delete Route', 'Remove this saved route?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSavedRoute(id);
            setRoutes((prev) => prev.filter((r) => r.id !== id));
          } catch {
            Alert.alert('Error', 'Failed to delete route.');
          }
        },
      },
    ]);
  };

  const handleUnlockPro = async () => {
    setProLoading(true);
    try {
      const paywall = await adapty.getPaywall('default');
      const products = await adapty.getPaywallProducts(paywall);
      if (products.length > 0) {
        const result = await adapty.makePurchase(products[0]);
        if (result.type === 'success') {
          setIsPro(true);
          Alert.alert('Welcome to Genius!', 'Enjoy ad-free, AI Sentinel, and Ghost Train features.');
        }
      } else {
        Alert.alert('Pro', 'No products available in this environment.');
      }
    } catch {
      Alert.alert('Purchase Failed', 'Unable to process purchase. Try again.');
    } finally {
      setProLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const displayName = user?.email?.split('@')[0] ?? 'Rider';

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 16,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* User info card */}
        <View
          style={{
            backgroundColor: Colors.card,
            borderRadius: 20,
            borderCurve: 'continuous',
            padding: 18,
            borderWidth: 1,
            borderColor: Colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: isAnonymous ? Colors.border : Colors.gold,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isAnonymous ? (
              <Ionicons name="person-outline" size={26} color={Colors.muted} />
            ) : (
              <Text style={{ fontFamily: Fonts.bold, fontSize: 22, color: '#000' }}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: Fonts.bold, fontSize: 17, color: Colors.white }}>
              {isAnonymous ? 'Anonymous Rider' : displayName}
            </Text>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.muted }} selectable>
              {isAnonymous ? 'Riding without an account' : user?.email ?? ''}
            </Text>
          </View>
          {/* Optional login/signup link for anonymous users */}
          {isAnonymous && (
            <Pressable
              onPress={() => router.push('/(auth)/login')}
              style={({ pressed }) => ({
                backgroundColor: pressed ? Colors.goldDark : Colors.gold,
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 7,
              })}
            >
              <Text style={{ fontFamily: Fonts.bold, fontSize: 12, color: '#000' }}>Sign In</Text>
            </Pressable>
          )}
        </View>

        {/* Sync nudge for anonymous users */}
        {isAnonymous && <SignUpBanner />}

        {/* MetroRide Genius (Pro) */}
        <View
          style={{
            backgroundColor: isPro ? '#1F1A00' : Colors.card,
            borderRadius: 20,
            borderCurve: 'continuous',
            padding: 18,
            borderWidth: 1,
            borderColor: isPro ? Colors.gold : Colors.border,
            gap: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                borderCurve: 'continuous',
                backgroundColor: Colors.gold,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 18 }}>⭐</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 15, color: Colors.white }}>
                MetroRide Genius
              </Text>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.muted }}>
                Ad-free, AI Alerts, Ghost Train details
              </Text>
            </View>
            {isPro ? (
              <View style={{ backgroundColor: Colors.green + '22', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.green }}>Active</Text>
              </View>
            ) : (
              <Pressable
                onPress={handleUnlockPro}
                disabled={proLoading}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? Colors.goldDark : Colors.gold,
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  opacity: proLoading ? 0.7 : 1,
                })}
              >
                {proLoading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 12, color: '#000' }}>
                    Unlock
                  </Text>
                )}
              </Pressable>
            )}
          </View>
        </View>

        {/* Saved Routes — only for signed-in users */}
        {!isAnonymous && (
          <View
            style={{
              backgroundColor: Colors.card,
              borderRadius: 20,
              borderCurve: 'continuous',
              padding: 18,
              borderWidth: 1,
              borderColor: Colors.border,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: Fonts.semiBold, fontSize: 15, color: Colors.white }}>
                Saved Routes
              </Text>
              <Pressable
                onPress={() => setAddRouteModal(true)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: Colors.gold,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                hitSlop={8}
              >
                <Ionicons name="add" size={18} color="#000" />
              </Pressable>
            </View>

            {loadingRoutes ? (
              <ActivityIndicator color={Colors.gold} />
            ) : routes.length === 0 ? (
              <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.muted, textAlign: 'center', paddingVertical: 12 }}>
                No saved routes yet. Tap + to add one.
              </Text>
            ) : (
              routes.map((route, i) => (
                <View
                  key={route.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 10,
                    borderTopWidth: i > 0 ? 1 : 0,
                    borderTopColor: Colors.border,
                    gap: 10,
                  }}
                >
                  <RouteLineBadge station={route.start_station} />
                  <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.white, flex: 1 }}>
                    {route.start_station}
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={Colors.muted} />
                  <RouteLineBadge station={route.end_station} />
                  <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.white, flex: 1 }}>
                    {route.end_station}
                  </Text>
                  <Pressable onPress={() => handleDeleteRoute(route.id)} hitSlop={10}>
                    <Ionicons name="trash-outline" size={16} color={Colors.muted} />
                  </Pressable>
                </View>
              ))
            )}
          </View>
        )}

        {/* Notification Preferences */}
        <View
          style={{
            backgroundColor: Colors.card,
            borderRadius: 20,
            borderCurve: 'continuous',
            padding: 18,
            borderWidth: 1,
            borderColor: Colors.border,
            gap: 6,
          }}
        >
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 15, color: Colors.white, marginBottom: 8 }}>
            Notification Preferences
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.white }}>
                Smart Alarm
              </Text>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.muted }}>
                {smartAlarm ? 'ON' : 'OFF'} — Alert when train is 60s from destination
              </Text>
            </View>
            <Switch
              value={smartAlarm}
              onValueChange={setSmartAlarm}
              trackColor={{ false: Colors.border, true: Colors.gold }}
              thumbColor={smartAlarm ? '#000' : '#fff'}
            />
          </View>
        </View>

        {/* Legal & Privacy */}
        <Pressable
          onPress={() => setLegalModal(true)}
          style={({ pressed }) => ({
            backgroundColor: pressed ? Colors.cardHigh : Colors.card,
            borderRadius: 20,
            borderCurve: 'continuous',
            padding: 18,
            borderWidth: 1,
            borderColor: Colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          })}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              borderCurve: 'continuous',
              backgroundColor: Colors.gold + '1A',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: Colors.gold + '2E',
            }}
          >
            <Ionicons name="shield-checkmark-outline" size={18} color={Colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: Fonts.semiBold, fontSize: 15, color: Colors.white }}>
              Legal & Privacy
            </Text>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.muted }}>
              MTA disclaimer, data policy & zero-footprint protocol
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
        </Pressable>

        {/* Sign Out — shown only for real (non-anonymous) users */}
        {!isAnonymous && (
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#2a1010' : Colors.card,
              borderRadius: 14,
              borderCurve: 'continuous',
              padding: 16,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: Colors.red + '44',
            })}
          >
            <Text style={{ fontFamily: Fonts.semiBold, fontSize: 15, color: Colors.red }}>
              Sign Out
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Legal Modal */}
      <LegalModal visible={legalModal} onClose={() => setLegalModal(false)} />

      {/* Add Route Modal */}
      <Modal
        visible={addRouteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setAddRouteModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' }}
          onPress={() => setAddRouteModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: Colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: insets.bottom + 24,
              gap: 14,
            }}
            onPress={() => {}}
          >
            <View style={{ alignItems: 'center', marginBottom: 4 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border }} />
            </View>
            <Text style={{ fontFamily: Fonts.bold, fontSize: 18, color: Colors.white }}>
              Add Saved Route
            </Text>

            <TextInput
              value={startStation}
              onChangeText={setStartStation}
              placeholder="From (e.g. Home)"
              placeholderTextColor={Colors.muted}
              style={{
                backgroundColor: Colors.bg,
                borderRadius: 10,
                borderCurve: 'continuous',
                padding: 14,
                color: Colors.white,
                fontFamily: Fonts.regular,
                fontSize: 14,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            />
            <TextInput
              value={endStation}
              onChangeText={setEndStation}
              placeholder="To (e.g. Work)"
              placeholderTextColor={Colors.muted}
              style={{
                backgroundColor: Colors.bg,
                borderRadius: 10,
                borderCurve: 'continuous',
                padding: 14,
                color: Colors.white,
                fontFamily: Fonts.regular,
                fontSize: 14,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            />

            <Pressable
              onPress={handleAddRoute}
              disabled={savingRoute || !startStation.trim() || !endStation.trim()}
              style={({ pressed }) => ({
                backgroundColor: Colors.gold,
                borderRadius: 14,
                borderCurve: 'continuous',
                padding: 16,
                alignItems: 'center',
                opacity: pressed || !startStation.trim() || !endStation.trim() ? 0.7 : 1,
              })}
            >
              {savingRoute ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={{ fontFamily: Fonts.bold, fontSize: 15, color: '#000' }}>
                  Save Route
                </Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
