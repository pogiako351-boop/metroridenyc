import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, SubwayLines } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useTrainCars, useTrainArrival } from '@/hooks/useMTA';
import { Ionicons } from '@expo/vector-icons';
import ArrivalBadge from '@/components/ArrivalBadge';

const OCCUPANCY_CONFIG = {
  quiet: { color: Colors.green, label: 'Quiet', icon: '😌', bars: 1 },
  moderate: { color: Colors.yellow, label: 'Moderate', icon: '🙂', bars: 2 },
  busy: { color: Colors.red, label: 'Busy', icon: '😤', bars: 3 },
};

function OccupancyBar({ level }: { level: 'quiet' | 'moderate' | 'busy' }) {
  const config = OCCUPANCY_CONFIG[level];
  return (
    <View style={{ flexDirection: 'row', gap: 3, alignItems: 'center' }}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            width: 6,
            height: 16,
            borderRadius: 3,
            backgroundColor: i <= config.bars ? config.color : Colors.border,
          }}
        />
      ))}
    </View>
  );
}

export default function TrainDetailScreen() {
  const { line = 'A', vehicleId = '' } = useLocalSearchParams<{ line: string; vehicleId?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const destination = line === 'A' ? 'to 207 St – Inwood'
    : line === 'C' ? 'to 168 St'
    : `to ${line} Terminal`;
  const { cars, isGhost, isLiveOccupancy } = useTrainCars(line, destination);
  const lineStyle = SubwayLines[line] ?? { bg: Colors.muted, text: '#fff' };

  // Live arrival countdown for this specific train
  const {
    arrivalTimestampMs,
    loading: arrivalLoading,
    error: arrivalError,
  } = useTrainArrival(line, vehicleId);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: 14,
          backgroundColor: Colors.bg,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={Colors.white} />
          </Pressable>

          {/* Line badge */}
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: lineStyle.bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: Fonts.bold, fontSize: 18, color: lineStyle.text }}>
              {line}
            </Text>
          </View>

          {/* Destination + ghost status */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: Fonts.bold, fontSize: 16, color: Colors.white }}>
              {destination}
            </Text>
            {isGhost && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Text style={{ fontSize: 12 }}>👻</Text>
                <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.red }}>
                  Ghost Train — No update in 180s+
                </Text>
              </View>
            )}
          </View>

          {/* Live arrival countdown in header */}
          <View style={{ alignItems: 'flex-end' }}>
            <ArrivalBadge
              arrivalTimestampMs={arrivalTimestampMs}
              isLoading={arrivalLoading}
              hasError={!!arrivalError && arrivalTimestampMs === null}
              size="large"
            />
            <Text style={{ fontFamily: Fonts.regular, fontSize: 10, color: Colors.muted, marginTop: 2 }}>
              {arrivalError && arrivalTimestampMs === null ? 'estimated' : 'next arrival'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom + 24,
          gap: 10,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Occupancy data status */}
        {!isLiveOccupancy && (
          <View
            style={{
              backgroundColor: Colors.gold + '15',
              borderRadius: 10,
              borderCurve: 'continuous',
              padding: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
              borderWidth: 1,
              borderColor: Colors.gold + '33',
            }}
          >
            <Ionicons name="information-circle-outline" size={16} color={Colors.gold} />
            <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.gold, flex: 1 }}>
              Live occupancy unavailable — showing estimated crowding levels
            </Text>
          </View>
        )}

        {/* Legend */}
        <View
          style={{
            flexDirection: 'row',
            gap: 16,
            backgroundColor: Colors.card,
            borderRadius: 12,
            borderCurve: 'continuous',
            padding: 12,
            marginBottom: 4,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          {(['quiet', 'moderate', 'busy'] as const).map((level) => {
            const cfg = OCCUPANCY_CONFIG[level];
            return (
              <View key={level} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cfg.color }} />
                <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.muted, textTransform: 'capitalize' }}>
                  {level}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Car breakdown */}
        {cars.map((car, idx) => {
          const cfg = OCCUPANCY_CONFIG[car.occupancy];
          const isHighlighted = !!car.exitTip;

          return (
            <View
              key={car.carId}
              style={{
                backgroundColor: isHighlighted ? '#1F1A00' : Colors.card,
                borderRadius: 14,
                borderCurve: 'continuous',
                padding: 14,
                borderWidth: 1,
                borderColor: isHighlighted ? Colors.goldDark : Colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
              }}
            >
              {/* Car number */}
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  borderCurve: 'continuous',
                  backgroundColor: cfg.color + '22',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: cfg.color + '66',
                }}
              >
                <Text style={{ fontFamily: Fonts.bold, fontSize: 11, color: cfg.color }}>
                  Car
                </Text>
                <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: cfg.color }}>
                  {idx + 1}
                </Text>
              </View>

              {/* Info */}
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.white }}>
                    Car {car.carId}
                  </Text>
                  <OccupancyBar level={car.occupancy} />
                  <Text style={{ fontFamily: Fonts.semiBold, fontSize: 12, color: cfg.color }}>
                    {cfg.icon} {cfg.label}
                  </Text>
                </View>
                {car.exitTip && (
                  <View style={{ flexDirection: 'row', gap: 4, alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 12 }}>💡</Text>
                    <Text
                      style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.gold, flex: 1 }}
                    >
                      Exit Strategy: {car.exitTip}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {/* Uber promo */}
        <View
          style={{
            backgroundColor: Colors.card,
            borderRadius: 14,
            borderCurve: 'continuous',
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            borderWidth: 1,
            borderColor: Colors.border,
            marginTop: 8,
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#000',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: Fonts.bold, fontSize: 14, color: '#fff' }}>U</Text>
          </View>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.muted, flex: 1 }}>
            <Text style={{ color: Colors.white, fontFamily: Fonts.semiBold }}>Uber: </Text>
            Get $10 off your first ride.
          </Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
        </View>
      </ScrollView>
    </View>
  );
}
