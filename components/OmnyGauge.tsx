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

// Confetti particle positions (pre-computed for determinism)
const CONFETTI_PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  angle: (i / 12) * 2 * Math.PI,
  distance: 85 + (i % 3) * 10,
  size: 6 + (i % 4) * 2,
  color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7', '#FF9500', '#00D4AA'][i % 6],
}));

export default function OmnyGauge({ progress, tapCount, ridesLeft, isUnlimited }: Props) {
  const animProgress = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;

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
      // Celebration sequence: confetti burst + badge bounce
      Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          ])
        ),
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.spring(badgeScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnlimited]);

  const strokeDashoffset = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  if (isUnlimited) {
    return (
      <View style={{ alignItems: 'center', gap: 12 }}>
        {/* Gold Unlimited Banner */}
        <Animated.View
          style={{
            transform: [{ scale: badgeScale }],
            backgroundColor: Colors.gold,
            borderRadius: 20,
            paddingHorizontal: 20,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            shadowColor: Colors.gold,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <Text style={{ fontSize: 14 }}>🎫</Text>
          <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: '#000', letterSpacing: 1 }}>
            UNLIMITED RIDES ACTIVE
          </Text>
          <Text style={{ fontSize: 14 }}>🎫</Text>
        </Animated.View>

        {/* Confetti ring + gauge */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }], alignItems: 'center', justifyContent: 'center' }}>
          {/* Confetti particles */}
          {CONFETTI_PARTICLES.map((p, i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                backgroundColor: p.color,
                left: SIZE / 2 + Math.cos(p.angle) * p.distance - p.size / 2,
                top: SIZE / 2 + Math.sin(p.angle) * p.distance - p.size / 2,
                opacity: confettiAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 1, 0.7],
                }),
                transform: [{
                  scale: confettiAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 1.4, 1],
                  }),
                }],
              }}
            />
          ))}

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
            <Text style={{ fontSize: 28, marginBottom: 2 }}>🎉</Text>
            <Text style={{ fontFamily: Fonts.bold, fontSize: 14, color: '#000', textAlign: 'center' }}>
              UNLIMITED
            </Text>
            <Text style={{ fontFamily: Fonts.bold, fontSize: 12, color: '#000', textAlign: 'center', marginTop: 1 }}>
              MODE
            </Text>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 10, color: '#000000AA', marginTop: 4 }}>
              {tapCount} rides this week
            </Text>
          </View>
        </Animated.View>
      </View>
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
          {ridesLeft} more to
        </Text>
        <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, color: Colors.muted }}>
          Unlimited / 7-Day Window
        </Text>
      </View>
    </View>
  );
}
