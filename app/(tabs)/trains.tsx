import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, SubwayLines } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useMTATrains } from '@/hooks/useMTA';
import TrainCard from '@/components/TrainCard';
import { Ionicons } from '@expo/vector-icons';

const ALL_LINES = ['1', '2', '3', '4', '5', '6', '7', 'A', 'C', 'E', 'B', 'D', 'F', 'M', 'G', 'J', 'Z', 'L', 'N', 'Q', 'R', 'W', 'S'];

export default function TrainsScreen() {
  const insets = useSafeAreaInsets();
  const { trains, loading, feedError, feedTimestamp } = useMTATrains();
  const [selectedLine, setSelectedLine] = useState<string | null>(null);

  const filtered = selectedLine
    ? trains.filter((t) => t.line === selectedLine)
    : trains;

  const isLiveFeed = feedTimestamp > 0;
  const lastUpdateSec = feedTimestamp > 0
    ? Math.round((Date.now() - feedTimestamp) / 1000)
    : null;

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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontFamily: Fonts.bold, fontSize: 22, color: Colors.white }}>
            Live Trains
          </Text>
          {/* Feed status indicator */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {loading ? (
              <ActivityIndicator size="small" color={Colors.gold} />
            ) : (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: feedError && !isLiveFeed ? Colors.red : Colors.green,
                }}
              />
            )}
            <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.muted }}>
              {loading
                ? 'Connecting...'
                : feedError && !isLiveFeed
                ? 'Offline'
                : lastUpdateSec !== null
                ? `Updated ${lastUpdateSec}s ago`
                : 'Live'}
            </Text>
          </View>
        </View>

        {/* Feed error banner */}
        {feedError && !isLiveFeed && (
          <View
            style={{
              backgroundColor: '#2A1A1A',
              borderRadius: 12,
              borderCurve: 'continuous',
              padding: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: Colors.red + '44',
            }}
          >
            <Ionicons name="warning-outline" size={16} color={Colors.red} />
            <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.muted, flex: 1 }}>
              Live feed unavailable. Showing estimated times.
            </Text>
          </View>
        )}

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
        {loading && filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: 16 }}>
            <ActivityIndicator color={Colors.gold} size="large" />
            <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.muted }}>
              Fetching live arrivals…
            </Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🚉</Text>
            <Text style={{ fontFamily: Fonts.semiBold, fontSize: 16, color: Colors.muted }}>
              No trains on this line right now
            </Text>
          </View>
        ) : (
          filtered.map((train) => (
            <TrainCard
              key={`${train.line}-${train.vehicleId}`}
              train={train}
              isLoading={loading}
              hasError={!!feedError && !isLiveFeed}
            />
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
