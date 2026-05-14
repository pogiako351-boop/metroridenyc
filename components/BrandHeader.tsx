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
 * Shared top header for MetroRide NYC screens.
 * Displays the Gold Train circular logo with the "MetroRide NYC" wordmark.
 * NYC Subway branding — independent of MTA.
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
      <View style={{ width: 38 }} />

      {/* Gold Train logo + wordmark */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'center' }}>
        {/* Gold Train circular badge */}
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: Colors.bg,
            borderWidth: 1.5,
            borderColor: Colors.gold + '55',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <Image
            source={require('@/assets/images/metroride-nyc-icon.png')}
            style={{ width: 38, height: 38 }}
            contentFit="cover"
            transition={200}
          />
        </View>

        <View>
          <Text
            style={{
              fontFamily: Fonts.bold,
              fontSize: 18,
              color: Colors.gold,
              letterSpacing: 0.5,
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
            NYC Subway Companion
          </Text>
        </View>
      </View>

      {/* Right action slot */}
      <View style={{ width: 38, alignItems: 'flex-end' }}>
        {rightAction ?? null}
      </View>
    </View>
  );
}
