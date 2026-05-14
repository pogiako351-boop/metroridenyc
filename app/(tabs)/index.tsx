import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useOMNY } from '@/hooks/useOMNY';
import { useMTATrains } from '@/hooks/useMTA';
import OmnyGauge from '@/components/OmnyGauge';
import TapButton from '@/components/TapButton';
import TrainCard from '@/components/TrainCard';
import VibeAlert from '@/components/VibeAlert';
import AISentinelBanner from '@/components/AISentinelBanner';
import { submitCommunityReport } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import BrandHeader from '@/components/BrandHeader';

const SENTINEL_MESSAGES = [
  'Ripple Effect Delay ahead on A line. Switch to C recommended.',
  'Platform crowding at Times Sq detected. Board 1 train instead.',
  'Ghost trains spotted on N/W line — expect 8+ min gaps.',
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useCurrentUser();
  const { tapCount, tapping, tap, isUnlimited, ridesLeft, progress, fetchTaps } = useOMNY(
    user?.id ?? null
  );
  const { trains, loading: trainsLoading, feedError, feedTimestamp } = useMTATrains();
  const [sentinelMsg] = useState(SENTINEL_MESSAGES[0]);
  const [showSentinel, setShowSentinel] = useState(true);
  const [reportModal, setReportModal] = useState(false);
  const [reportType, setReportType] = useState<'crowd' | 'delay' | 'safety' | 'smell'>('crowd');
  const [reportStation, setReportStation] = useState('Times Sq');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleTap = async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await tap();
    if (isUnlimited) {
      if (Platform.OS === 'ios') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTaps();
    setRefreshing(false);
  };

  const handleReport = async () => {
    setSubmittingReport(true);
    try {
      await submitCommunityReport(reportStation, reportType, undefined, user?.id);
      setReportModal(false);
      Alert.alert('Thanks!', 'Your report helps other riders.');
    } catch {
      Alert.alert('Error', 'Failed to submit report. Try again.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const ISSUE_TYPES = ['crowd', 'delay', 'safety', 'smell'] as const;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 16,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.gold}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <BrandHeader
          rightAction={
            <Pressable
              onPress={() => setReportModal(true)}
              style={{
                backgroundColor: Colors.card,
                borderRadius: 20,
                borderCurve: 'continuous',
                padding: 8,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
              hitSlop={8}
            >
              <Ionicons name="flag" size={18} color={Colors.muted} />
            </Pressable>
          }
        />

        {/* Vibe Alert */}
        <VibeAlert temp={72} crowdLevel="Moderate Crowds" station="Times Sq" />

        {/* AI Sentinel */}
        {showSentinel && (
          <AISentinelBanner
            message={sentinelMsg}
            onDismiss={() => setShowSentinel(false)}
          />
        )}

        {/* OMNY Section */}
        <View
          style={{
            backgroundColor: Colors.card,
            borderRadius: 20,
            borderCurve: 'continuous',
            padding: 20,
            alignItems: 'center',
            marginBottom: 16,
            borderWidth: 1,
            borderColor: Colors.border,
            gap: 20,
          }}
        >
          <OmnyGauge
            progress={progress}
            tapCount={tapCount}
            ridesLeft={ridesLeft}
            isUnlimited={isUnlimited}
          />

          <TapButton onPress={handleTap} loading={tapping} />

          {!isUnlimited && (
            <Text
              style={{
                fontFamily: Fonts.regular,
                fontSize: 13,
                color: Colors.muted,
                textAlign: 'center',
              }}
            >
              {ridesLeft} more {ridesLeft === 1 ? 'ride' : 'rides'} to Unlimited Mode
            </Text>
          )}
        </View>

        {/* Nearest Trains */}
        <View style={{ marginBottom: 8 }}>

          <Text
            style={{
              fontFamily: Fonts.bold,
              fontSize: 16,
              color: Colors.white,
              marginBottom: 10,
            }}
          >
            Nearest Trains
          </Text>
          {trainsLoading ? (
            <ActivityIndicator color={Colors.gold} style={{ marginVertical: 20 }} />
          ) : (
            trains.map((train) => (
              <TrainCard
                key={`${train.line}-${train.vehicleId}`}
                train={train}
                isLoading={trainsLoading}
                hasError={!!feedError && feedTimestamp === 0}
              />
            ))
          )}
        </View>

        {/* Legal footer */}
        <Text
          style={{
            fontFamily: Fonts.regular,
            fontSize: 10,
            color: Colors.muted + 'BB',
            textAlign: 'center',
            marginTop: 16,
            lineHeight: 15,
          }}
        >
          By using MetroRide, you agree to our Terms & Privacy.{'\n'}
          Not affiliated with the MTA.
        </Text>
      </ScrollView>

      {/* Community Report Modal */}
      <Modal visible={reportModal} transparent animationType="slide" onRequestClose={() => setReportModal(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' }}
          onPress={() => setReportModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: Colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: insets.bottom + 24,
              gap: 16,
            }}
            onPress={() => {}}
          >
            <View style={{ alignItems: 'center', marginBottom: 4 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border }} />
            </View>
            <Text style={{ fontFamily: Fonts.bold, fontSize: 18, color: Colors.white }}>
              Report an Issue
            </Text>

            <TextInput
              value={reportStation}
              onChangeText={setReportStation}
              placeholder="Station name"
              placeholderTextColor={Colors.muted}
              style={{
                backgroundColor: Colors.bg,
                borderRadius: 10,
                borderCurve: 'continuous',
                padding: 14,
                color: Colors.white,
                fontFamily: Fonts.regular,
                fontSize: 14,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            />

            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {ISSUE_TYPES.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setReportType(type)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: reportType === type ? Colors.gold : Colors.bg,
                    borderWidth: 1,
                    borderColor: reportType === type ? Colors.gold : Colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: Fonts.semiBold,
                      fontSize: 13,
                      color: reportType === type ? '#000' : Colors.muted,
                      textTransform: 'capitalize',
                    }}
                  >
                    {type === 'crowd' ? '👥 ' : type === 'delay' ? '⏰ ' : type === 'safety' ? '⚠️ ' : '🤢 '}
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={handleReport}
              disabled={submittingReport}
              style={({ pressed }) => ({
                backgroundColor: Colors.gold,
                borderRadius: 14,
                borderCurve: 'continuous',
                padding: 16,
                alignItems: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              {submittingReport ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={{ fontFamily: Fonts.bold, fontSize: 15, color: '#000' }}>
                  Submit Report
                </Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
