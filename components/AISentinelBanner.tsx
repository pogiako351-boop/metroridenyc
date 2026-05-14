import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, Pressable } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  message: string;
  onDismiss?: () => void;
}

export default function AISentinelBanner({ message, onDismiss }: Props) {
  const slideAnim = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY: slideAnim }], marginBottom: 10 }}>
      <View
        style={{
          backgroundColor: '#2A1F00',
          borderRadius: 10,
          borderCurve: 'continuous',
          padding: 12,
          borderWidth: 1,
          borderColor: Colors.goldDark,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: Colors.gold,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Ionicons name="alert" size={14} color="#000" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.gold, marginBottom: 2 }}>
            AI Sentinel Alert
          </Text>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.white }}>
            {message}
          </Text>
        </View>
        {onDismiss && (
          <Pressable onPress={onDismiss} hitSlop={8}>
            <Ionicons name="close" size={16} color={Colors.muted} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}
