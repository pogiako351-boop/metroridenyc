import React from 'react';
import { View, Text } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

interface Props {
  temp?: number;
  crowdLevel?: string;
  station?: string;
}

export default function VibeAlert({ temp = 72, crowdLevel = 'Moderate Crowds', station = 'Times Sq' }: Props) {
  return (
    <View
      style={{
        backgroundColor: Colors.card,
        borderRadius: 10,
        borderCurve: 'continuous',
        paddingVertical: 8,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 10,
      }}
    >
      <Text style={{ fontSize: 14 }}>🌡️</Text>
      <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.muted, flex: 1 }}>
        <Text style={{ color: Colors.white, fontFamily: Fonts.semiBold }}>Vibe Alert: </Text>
        {temp}°F · {crowdLevel} at {station}
      </Text>
    </View>
  );
}
