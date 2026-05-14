import React, { useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useOMNY } from '@/hooks/useOMNY';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Ionicons } from '@expo/vector-icons';

const FREE_RIDE_VALUE = 2.9; // NYC subway fare
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function BarChart({ data }: { data: { day: Date; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 100 }}>
      {data.map((item, idx) => {
        const height = Math.max((item.count / max) * 80, item.count > 0 ? 8 : 0);
        const dayName = DAYS[item.day.getDay() === 0 ? 6 : item.day.getDay() - 1];
        const isToday = item.day.toDateString() === new Date().toDateString();
        return (
          <View key={idx} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <Text
              style={{
                fontFamily: Fonts.bold,
                fontSize: 11,
                color: item.count > 0 ? Colors.gold : Colors.muted,
                fontVariant: ['tabular-nums'],
              }}
            >
              {item.count > 0 ? item.count : ''}
            </Text>
            <View
              style={{
                width: '80%',
                height: height || 4,
                borderRadius: 4,
                backgroundColor: isToday ? Colors.gold : item.count > 0 ? Colors.goldDark : Colors.border,
              }}
            />
            <Text
              style={{
                fontFamily: Fonts.regular,
                fontSize: 10,
                color: isToday ? Colors.gold : Colors.muted,
              }}
            >
              {dayName}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function SavingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoading: authLoading } = useCurrentUser();
  const { tapCount, taps, loading, isUnlimited, dailyTaps } = useOMNY(user?.id ?? null);

  // Calculate how many free rides have been earned (every 12 taps = unlimited window)
  const freeRidesEarned = useMemo(() => {
    return Math.floor(tapCount / 12) * (tapCount % 12 > 0 ? 1 : 0) + Math.floor(tapCount / 12);
  }, [tapCount]);

  const totalSaved = (freeRidesEarned * FREE_RIDE_VALUE).toFixed(2);
  const annualProjection = (freeRidesEarned * 52 * FREE_RIDE_VALUE).toFixed(0);

  // Unlimited mode activations from taps history (every 12 taps)
  const unlimitedActivations = useMemo(() => {
    if (taps.length < 12) return [];
    const acts: { date: string; label: string }[] = [];
    const sorted = [...taps].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    for (let i = 11; i < sorted.length; i += 12) {
      const ts = new Date(sorted[i].timestamp);
      acts.push({
        date: ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        label: 'Unlocked Gold Status',
      });
    }
    return acts.slice(-5);
  }, [taps]);

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.gold} />
      </View>
    );
  }

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
        <Text style={{ fontFamily: Fonts.bold, fontSize: 22, color: Colors.white }}>
          Savings Dashboard
        </Text>

        {loading ? (
          <ActivityIndicator color={Colors.gold} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Hero Total Saved */}
            <View
              style={{
                backgroundColor: Colors.card,
                borderRadius: 20,
                borderCurve: 'continuous',
                padding: 28,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: Colors.border,
                gap: 6,
              }}
            >
              <Text
                style={{
                  fontFamily: Fonts.bold,
                  fontSize: 52,
                  color: Colors.gold,
                  fontVariant: ['tabular-nums'],
                  letterSpacing: -1,
                }}
                selectable
              >
                ${totalSaved}
              </Text>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 15, color: Colors.muted }}>
                Total Saved
              </Text>
              {isUnlimited && (
                <View
                  style={{
                    backgroundColor: Colors.gold + '22',
                    borderRadius: 20,
                    paddingHorizontal: 14,
                    paddingVertical: 5,
                    marginTop: 8,
                    borderWidth: 1,
                    borderColor: Colors.gold + '44',
                  }}
                >
                  <Text style={{ fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.gold }}>
                    🎉 Unlimited Mode Active
                  </Text>
                </View>
              )}
            </View>

            {/* Weekly Bar Chart */}
            <View
              style={{
                backgroundColor: Colors.card,
                borderRadius: 20,
                borderCurve: 'continuous',
                padding: 18,
                borderWidth: 1,
                borderColor: Colors.border,
                gap: 14,
              }}
            >
              <Text style={{ fontFamily: Fonts.semiBold, fontSize: 15, color: Colors.white }}>
                Weekly Tap History
              </Text>
              <BarChart data={dailyTaps} />
            </View>

            {/* Unlimited Mode History */}
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
              <Text style={{ fontFamily: Fonts.semiBold, fontSize: 15, color: Colors.white }}>
                Unlimited Mode History
              </Text>
              {unlimitedActivations.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 20, gap: 8 }}>
                  <Ionicons name="trophy-outline" size={32} color={Colors.muted} />
                  <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.muted }}>
                    Reach 12 taps to unlock unlimited mode
                  </Text>
                </View>
              ) : (
                unlimitedActivations.map((act, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 10,
                      borderTopWidth: i > 0 ? 1 : 0,
                      borderTopColor: Colors.border,
                    }}
                  >
                    <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.muted }}>
                      {act.date}
                    </Text>
                    <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.gold }}>
                      {act.label}
                    </Text>
                  </View>
                ))
              )}
            </View>

            {/* Annual Projection */}
            <View
              style={{
                backgroundColor: '#1A1F00',
                borderRadius: 16,
                borderCurve: 'continuous',
                padding: 18,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: Colors.goldDark + '66',
                gap: 14,
              }}
            >
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
                <Ionicons name="trending-up" size={22} color={Colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.muted }}>
                  Estimated Annual Savings
                </Text>
                <Text
                  style={{
                    fontFamily: Fonts.bold,
                    fontSize: 22,
                    color: Colors.gold,
                    fontVariant: ['tabular-nums'],
                  }}
                  selectable
                >
                  ${annualProjection}
                </Text>
              </View>
            </View>

            {/* Stats grid */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: Colors.card,
                  borderRadius: 16,
                  borderCurve: 'continuous',
                  padding: 16,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  gap: 4,
                }}
              >
                <Text
                  style={{ fontFamily: Fonts.bold, fontSize: 28, color: Colors.white, fontVariant: ['tabular-nums'] }}
                  selectable
                >
                  {tapCount}
                </Text>
                <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.muted }}>
                  Total Taps (7d)
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  backgroundColor: Colors.card,
                  borderRadius: 16,
                  borderCurve: 'continuous',
                  padding: 16,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  gap: 4,
                }}
              >
                <Text
                  style={{ fontFamily: Fonts.bold, fontSize: 28, color: Colors.white, fontVariant: ['tabular-nums'] }}
                  selectable
                >
                  {freeRidesEarned}
                </Text>
                <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.muted }}>
                  Free Rides Earned
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
