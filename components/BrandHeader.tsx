import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

interface Props {
  /** Render an action button on the right side */
  rightAction?: React.ReactNode;
}

/**
 * Shared top header used by Home and Trains screens.
 * Displays the M-Genie logo centred with the "MetroRide NYC" wordmark.
 */
export default function BrandHeader({ rightAction }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
      }}
    >
      {/* Left spacer so logo+text are visually centred */}
      <View style={{ width: 36 }} />

      {/* Logo + wordmark */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' }}>
        <Image
          source={require('@/assets/logos/mgenie-logo.png')}
          style={{ width: 34, height: 34 }}
          contentFit="contain"
          transition={200}
        />
        <View>
          <Text
            style={{
              fontFamily: Fonts.bold,
              fontSize: 18,
              color: Colors.gold,
              letterSpacing: 0.4,
            }}
          >
            MetroRide{' '}
            <Text style={{ color: Colors.white }}>NYC</Text>
          </Text>
          <Text
            style={{
              fontFamily: Fonts.regular,
              fontSize: 10,
              color: Colors.muted,
              letterSpacing: 0.2,
            }}
          >
            M-Genie · NYC Subway Companion
          </Text>
        </View>
      </View>

      {/* Right action slot */}
      <View style={{ width: 36, alignItems: 'flex-end' }}>
        {rightAction ?? null}
      </View>
    </View>
  );
}
