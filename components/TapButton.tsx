import React, { useRef, useEffect } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

interface Props {
  onPress: () => void;
  loading: boolean;
}

export default function TapButton({ onPress, loading }: Props) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 0.8, duration: 900, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
        ]),
      ])
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Outer glow */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 180,
          height: 58,
          borderRadius: 29,
          backgroundColor: Colors.gold,
          opacity: glowAnim,
          transform: [{ scale: pulseAnim }],
          shadowColor: Colors.gold,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 20,
          elevation: 20,
        }}
      />
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={handlePress}
          disabled={loading}
          style={{
            width: 180,
            height: 58,
            borderRadius: 29,
            backgroundColor: Colors.gold,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: Fonts.bold,
              fontSize: 18,
              color: '#000',
              letterSpacing: 0.5,
            }}
          >
            {loading ? 'Tapping...' : 'Tap OMNY'}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
