import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  progress: number; // 0-1
  tapCount: number;
  ridesLeft: number;
  isUnlimited: boolean;
}

const SIZE = 160;
const STROKE = 10;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

export default function OmnyGauge({ progress, tapCount, ridesLeft, isUnlimited }: Props) {
  const animProgress = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(animProgress, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  useEffect(() => {
    if (isUnlimited) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnlimited]);

  const strokeDashoffset = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  if (isUnlimited) {
    return (
      <Animated.View style={{ transform: [{ scale: pulseAnim }], alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: SIZE,
            height: SIZE,
            borderRadius: SIZE / 2,
            backgroundColor: Colors.gold,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: Colors.gold,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: '#000', textAlign: 'center' }}>
            🎉 UNLIMITED
          </Text>
          <Text style={{ fontFamily: Fonts.bold, fontSize: 11, color: '#000', textAlign: 'center', marginTop: 2 }}>
            MODE
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Colors.gold} />
            <Stop offset="100%" stopColor={Colors.goldDark} />
          </LinearGradient>
        </Defs>
        {/* Background track */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={Colors.border}
          strokeWidth={STROKE}
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="url(#goldGrad)"
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text
          style={{
            fontFamily: Fonts.bold,
            fontSize: 42,
            color: Colors.gold,
            lineHeight: 46,
            fontVariant: ['tabular-nums'],
          }}
        >
          {tapCount}
        </Text>
        <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.muted }}>
          Rides to
        </Text>
        <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, color: Colors.muted }}>
          Free / Rolling 7-Day Window
        </Text>
      </View>
    </View>
  );
}
