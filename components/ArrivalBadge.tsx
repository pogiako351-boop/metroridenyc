import React, { useEffect, useRef } from 'react';
import { Text, Animated, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useCountdown, formatCountdown } from '@/hooks/useCountdown';

interface Props {
  arrivalTimestampMs: number | null;
  isLoading?: boolean;
  hasError?: boolean;
  /** Size variant */
  size?: 'small' | 'large';
}

export default function ArrivalBadge({
  arrivalTimestampMs,
  isLoading = false,
  hasError = false,
  size = 'small',
}: Props) {
  const state = useCountdown(arrivalTimestampMs, isLoading, hasError);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  const isLarge = size === 'large';
  const fontSize = isLarge ? 22 : 18;
  const subFontSize = isLarge ? 12 : 11;

  // Start / stop pulse animation for "Arriving" state
  useEffect(() => {
    if (state.status === 'arriving') {
      pulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      pulseRef.current.start();
    } else {
      if (pulseRef.current) {
        pulseRef.current.stop();
        pulseRef.current = null;
      }
      pulseAnim.setValue(1);
    }

    return () => {
      if (pulseRef.current) {
        pulseRef.current.stop();
        pulseRef.current = null;
      }
    };
  }, [state.status, pulseAnim]);

  if (state.status === 'arriving') {
    return (
      <Animated.Text
        style={[
          styles.arrivingText,
          {
            fontSize,
            opacity: pulseAnim,
          },
        ]}
      >
        Arriving
      </Animated.Text>
    );
  }

  if (state.status === 'departed') {
    return (
      <Text style={[styles.departedText, { fontSize: subFontSize }]}>Departed</Text>
    );
  }

  if (state.status === 'error' || state.status === 'unknown') {
    return (
      <Text style={[styles.unknownText, { fontSize }]}>—</Text>
    );
  }

  if (state.status === 'loading') {
    return (
      <Text style={[styles.unknownText, { fontSize }]}>–</Text>
    );
  }

  // Live countdown
  const { minutes, seconds } = state;
  return (
    <Text
      style={[styles.countdownText, { fontSize }]}
      aria-label={formatCountdown(state)}
    >
      {minutes > 0 && (
        <>
          <Text style={styles.countdownText}>{minutes}</Text>
          <Text style={[styles.unitText, { fontSize: subFontSize }]}> min</Text>
        </>
      )}
      {minutes > 0 && seconds > 0 && (
        <Text style={[styles.unitText, { fontSize: subFontSize }]}> </Text>
      )}
      {(seconds > 0 || minutes === 0) && (
        <>
          <Text style={styles.countdownText}>{seconds}</Text>
          <Text style={[styles.unitText, { fontSize: subFontSize }]}>s</Text>
        </>
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  countdownText: {
    fontFamily: Fonts.bold,
    color: Colors.gold,
    fontVariant: ['tabular-nums'],
  },
  unitText: {
    fontFamily: Fonts.regular,
    color: Colors.gold,
  },
  arrivingText: {
    fontFamily: Fonts.bold,
    color: '#4ADE80', // bright green for arriving
  },
  departedText: {
    fontFamily: Fonts.regular,
    color: Colors.muted,
    fontStyle: 'italic',
  },
  unknownText: {
    fontFamily: Fonts.bold,
    color: Colors.muted,
  },
});
