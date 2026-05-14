import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Colors, SubwayLines } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { TrainArrival } from '@/hooks/useMTA';
import { useRouter } from 'expo-router';

interface Props {
  train: TrainArrival;
}

const OCCUPANCY_DOTS = {
  low: [Colors.green, Colors.green, Colors.green],
  medium: [Colors.yellow, Colors.yellow, Colors.muted],
  high: [Colors.red, Colors.muted, Colors.muted],
};

export default function TrainCard({ train }: Props) {
  const router = useRouter();
  const lineStyle = SubwayLines[train.line] ?? { bg: Colors.muted, text: Colors.white };
  const dots = OCCUPANCY_DOTS[train.occupancy];

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/train-detail', params: { line: train.line } })}
      style={({ pressed }) => ({
        backgroundColor: pressed ? Colors.cardHigh : Colors.card,
        borderRadius: 14,
        borderCurve: 'continuous',
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Colors.border,
      })}
    >
      {/* Line badge */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: lineStyle.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: Fonts.bold, fontSize: 16, color: lineStyle.text }}>
          {train.line}
        </Text>
      </View>

      {/* Destination & ghost */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.white }}>
            {train.destination}
          </Text>
          {train.isGhost && (
            <View
              style={{
                backgroundColor: '#333',
                borderRadius: 8,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text style={{ fontSize: 10, color: Colors.muted }}>👻 Ghost</Text>
            </View>
          )}
        </View>
        {train.isGhost && (
          <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.red, marginTop: 2 }}>
            No position update in {Math.round((Date.now() - train.lastUpdate) / 1000)}s
          </Text>
        )}
      </View>

      {/* ETA */}
      <Text
        style={{
          fontFamily: Fonts.bold,
          fontSize: 18,
          color: Colors.gold,
          fontVariant: ['tabular-nums'],
        }}
      >
        {train.minutesAway} min
      </Text>

      {/* Occupancy dots */}
      <View style={{ flexDirection: 'row', gap: 3 }}>
        {dots.map((color, i) => (
          <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        ))}
      </View>
    </Pressable>
  );
}
