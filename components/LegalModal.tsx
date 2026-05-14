import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function SectionHeader({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          borderCurve: 'continuous',
          backgroundColor: Colors.gold + '22',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={16} color={Colors.gold} />
      </View>
      <Text style={{ fontFamily: Fonts.bold, fontSize: 14, color: Colors.white }}>
        {title}
      </Text>
    </View>
  );
}

function Divider() {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: 20,
      }}
    />
  );
}

export default function LegalModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: '#1E1E1E',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: '88%',
            borderWidth: 1,
            borderColor: Colors.border,
            borderBottomWidth: 0,
          }}
          onPress={() => {}}
        >
          {/* Grab handle */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border }} />
          </View>

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 22,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: Colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  borderCurve: 'continuous',
                  backgroundColor: Colors.gold + '18',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: Colors.gold + '33',
                }}
              >
                <Ionicons name="shield-checkmark" size={18} color={Colors.gold} />
              </View>
              <View>
                <Text style={{ fontFamily: Fonts.bold, fontSize: 17, color: Colors.white }}>
                  Legal & Privacy
                </Text>
                <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.muted }}>
                  MetroRide NYC — Independent App
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: Colors.card,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={16} color={Colors.muted} />
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 22,
              paddingTop: 20,
              paddingBottom: insets.bottom + 24,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Section 1: Independent Service Disclaimer */}
            <SectionHeader icon="information-circle-outline" title="Independent Service Disclaimer" />
            <View
              style={{
                backgroundColor: '#FF6319' + '0F',
                borderRadius: 14,
                borderCurve: 'continuous',
                padding: 14,
                borderWidth: 1,
                borderColor: '#FF6319' + '33',
                marginBottom: 4,
              }}
            >
              <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: '#E8E8E8', lineHeight: 20 }}>
                MetroRide NYC is an{' '}
                <Text style={{ fontFamily: Fonts.semiBold, color: Colors.white }}>independent utility application</Text>
                {' '}developed and maintained by independent developers. This app is{' '}
                <Text style={{ fontFamily: Fonts.semiBold, color: Colors.white }}>not affiliated with, endorsed by, sponsored by, or in any way officially connected</Text>
                {' '}to the Metropolitan Transportation Authority (MTA), New York City Transit (NYCT), or any of their subsidiaries or affiliates.
              </Text>
            </View>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.muted, marginTop: 8, lineHeight: 18 }}>
              All MTA and NYC Transit trademarks, service marks, trade names, and logos are the property of the Metropolitan Transportation Authority. Use of these references is solely for user-facing informational purposes under nominative fair use.
            </Text>

            <Divider />

            {/* Section 2: Data Accuracy & Reliability */}
            <SectionHeader icon="analytics-outline" title="Data Accuracy & Reliability" />
            <View
              style={{
                backgroundColor: Colors.gold + '0D',
                borderRadius: 14,
                borderCurve: 'continuous',
                padding: 14,
                borderWidth: 1,
                borderColor: Colors.gold + '2A',
                marginBottom: 4,
              }}
            >
              <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: '#E8E8E8', lineHeight: 20 }}>
                All transit data — including real-time train arrivals, departure estimates, and service alerts — is sourced from the{' '}
                <Text style={{ fontFamily: Fonts.semiBold, color: Colors.white }}>MTA GTFS-Realtime public feeds</Text>
                {' '}and is provided{' '}
                <Text style={{ fontFamily: Fonts.semiBold, color: Colors.white }}>{'\"AS IS\"'}</Text>
                {' '}without any warranty of accuracy, completeness, or fitness for any particular purpose.
              </Text>
            </View>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.muted, marginTop: 8, lineHeight: 18 }}>
              Arrival and departure estimates are{' '}
              <Text style={{ fontFamily: Fonts.semiBold, color: Colors.muted }}>algorithmically derived</Text>
              {' '}from live feed data and may not reflect actual train positions or schedules. Service disruptions, express/local changes, and real-world delays may not always be reflected in a timely manner. Do not rely solely on this app for time-critical transit decisions.
            </Text>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.muted, marginTop: 8, lineHeight: 18 }}>
              MetroRide NYC makes no representations regarding the accuracy of OMNY tap counting. Always verify your tap count and fare status with the official MTA OMNY system.
            </Text>

            <Divider />

            {/* Section 3: Zero-Footprint Privacy */}
            <SectionHeader icon="lock-closed-outline" title="Zero-Footprint Privacy Protocol" />
            <View
              style={{
                backgroundColor: Colors.green + '0F',
                borderRadius: 14,
                borderCurve: 'continuous',
                padding: 14,
                borderWidth: 1,
                borderColor: Colors.green + '33',
                marginBottom: 4,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.green} />
                <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.green }}>
                  Your data stays on your device. Always.
                </Text>
              </View>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: '#E8E8E8', lineHeight: 20 }}>
                All fare tracking history, OMNY tap records, and transit usage data are stored{' '}
                <Text style={{ fontFamily: Fonts.semiBold, color: Colors.white }}>{'exclusively in your device\'s local storage'}</Text>
                . This data is{' '}
                <Text style={{ fontFamily: Fonts.semiBold, color: Colors.white }}>never transmitted to, stored on, or accessible by any central server</Text>
                , including our own.
              </Text>
            </View>

            {/* Privacy bullets */}
            {[
              { icon: 'phone-portrait-outline' as const, text: 'Tap history lives only on your device — not in the cloud.' },
              { icon: 'eye-off-outline' as const, text: 'We do not collect, sell, or share any personal transit data.' },
              { icon: 'person-remove-outline' as const, text: 'No account is required to use core transit features.' },
              { icon: 'server-outline' as const, text: 'Anonymous sessions are used solely to enable optional sync features.' },
            ].map(({ icon, text }, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 10,
                  marginTop: 10,
                }}
              >
                <Ionicons name={icon} size={14} color={Colors.green} style={{ marginTop: 2 }} />
                <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.muted, flex: 1, lineHeight: 18 }}>
                  {text}
                </Text>
              </View>
            ))}

            <Divider />

            {/* Footer */}
            <View style={{ alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: Colors.card,
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                }}
              >
                <Ionicons name="subway-outline" size={13} color={Colors.gold} />
                <Text style={{ fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.gold }}>
                  MetroRide NYC
                </Text>
                <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.muted }}>
                  · Independent Transit Companion
                </Text>
              </View>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.muted, textAlign: 'center', lineHeight: 16 }}>
                Not affiliated with the MTA. Transit data sourced from public GTFS-RT feeds.{'\n'}
                © 2026 MetroRide. All rights reserved.
              </Text>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
