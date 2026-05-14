import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, SubwayLines } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useMTATrains } from '@/hooks/useMTA';
import TrainCard from '@/components/TrainCard';

const ALL_LINES = ['1', '2', '3', '4', '5', '6', '7', 'A', 'C', 'E', 'B', 'D', 'F', 'M', 'G', 'J', 'Z', 'L', 'N', 'Q', 'R', 'W', 'S'];

export default function TrainsScreen() {
  const insets = useSafeAreaInsets();
  const { trains } = useMTATrains();
  const [selectedLine, setSelectedLine] = useState<string | null>(null);

  const filtered = selectedLine
    ? trains.filter((t) => t.line === selectedLine)
    : trains;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={{ fontFamily: Fonts.bold, fontSize: 22, color: Colors.white, marginBottom: 16 }}>
          Live Trains
        </Text>

        {/* Line filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, marginBottom: 16 }}
          contentContainerStyle={{ gap: 8, paddingRight: 16 }}
        >
          <Pressable
            onPress={() => setSelectedLine(null)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 20,
              backgroundColor: selectedLine === null ? Colors.gold : Colors.card,
              borderWidth: 1,
              borderColor: selectedLine === null ? Colors.gold : Colors.border,
            }}
          >
            <Text
              style={{
                fontFamily: Fonts.semiBold,
                fontSize: 12,
                color: selectedLine === null ? '#000' : Colors.muted,
              }}
            >
              All Lines
            </Text>
          </Pressable>
          {ALL_LINES.map((line) => {
            const ls = SubwayLines[line] ?? { bg: Colors.muted, text: '#fff' };
            const active = selectedLine === line;
            return (
              <Pressable
                key={line}
                onPress={() => setSelectedLine(active ? null : line)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: active ? ls.bg : Colors.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: active ? ls.bg : Colors.border,
                }}
              >
                <Text style={{ fontFamily: Fonts.bold, fontSize: 14, color: active ? ls.text : Colors.muted }}>
                  {line}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Train list */}
        {filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🚉</Text>
            <Text style={{ fontFamily: Fonts.semiBold, fontSize: 16, color: Colors.muted }}>
              No trains on this line right now
            </Text>
          </View>
        ) : (
          filtered.map((train) => (
            <TrainCard key={`${train.line}-${train.vehicleId}`} train={train} />
          ))
        )}

        {/* Ghost Train Info */}
        <View
          style={{
            backgroundColor: Colors.card,
            borderRadius: 14,
            borderCurve: 'continuous',
            padding: 14,
            marginTop: 8,
            borderWidth: 1,
            borderColor: Colors.border,
            flexDirection: 'row',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <Text style={{ fontSize: 18 }}>👻</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.white, marginBottom: 4 }}>
              Ghost Train Detection
            </Text>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.muted, lineHeight: 18 }}>
              Trains with no position update for 3+ minutes are flagged as ghost trains. They may be delayed, out of service, or data is stale.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
