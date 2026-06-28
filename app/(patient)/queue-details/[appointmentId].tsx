import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/context/AuthContext';

type TokenStatus = 'completed' | 'in_room' | 'yours' | 'upcoming';

interface QueueToken {
  id: number;
  tokenNumber: number;
  status: TokenStatus;
}

const mockTokens: QueueToken[] = [
  { id: 1, tokenNumber: 5, status: 'completed' },
  { id: 2, tokenNumber: 6, status: 'in_room' },
  { id: 3, tokenNumber: 7, status: 'yours' },
  { id: 4, tokenNumber: 8, status: 'upcoming' },
];

function getStatusLabel(status: TokenStatus): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in_room':
      return 'Currently Inside';
    case 'yours':
      return 'Your turn';
    case 'upcoming':
      return 'Waiting';
  }
}

export default function QueueDetailsScreen() {
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const { user } = useAuth();

  // supabase is imported for future live-queue integration
  void supabase;

  const userName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email ??
    'You';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>{'←'}</Text>
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.hospitalName}>City General Hospital</Text>
          <Text style={styles.doctorName}>Dr. Priya Sharma</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Queue Status</Text>

        {/* Timeline */}
        <View style={styles.timeline}>
          {mockTokens.map((token, index) => {
            const isLast = index === mockTokens.length - 1;
            const isYours = token.status === 'yours';

            return (
              <View key={token.id} style={styles.timelineRow}>
                {/* Left column: circle + connector */}
                <View style={styles.timelineLeft}>
                  <View
                    style={[
                      styles.tokenCircle,
                      token.status === 'completed' && styles.circleCompleted,
                      token.status === 'in_room' && styles.circleInRoom,
                      token.status === 'yours' && styles.circleYours,
                      token.status === 'upcoming' && styles.circleUpcoming,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tokenNumberText,
                        token.status === 'completed' && styles.tokenTextCompleted,
                        token.status === 'in_room' && styles.tokenTextInRoom,
                        token.status === 'yours' && styles.tokenTextYours,
                        token.status === 'upcoming' && styles.tokenTextUpcoming,
                      ]}
                    >
                      {token.tokenNumber}
                    </Text>
                  </View>
                  {!isLast && <View style={styles.connector} />}
                </View>

                {/* Right column: info */}
                <View style={styles.timelineRight}>
                  <View style={styles.tokenInfoRow}>
                    <View style={styles.tokenInfoText}>
                      <Text style={styles.tokenLabel}>
                        {isYours
                          ? `Your Token — ${userName}`
                          : `Token ${token.tokenNumber}`}
                      </Text>
                      <Text
                        style={[
                          styles.statusText,
                          token.status === 'completed' && styles.statusCompleted,
                          token.status === 'in_room' && styles.statusInRoom,
                          token.status === 'yours' && styles.statusYours,
                          token.status === 'upcoming' && styles.statusUpcoming,
                        ]}
                      >
                        {getStatusLabel(token.status)}
                      </Text>
                    </View>
                    {isYours && (
                      <View style={styles.youBadge}>
                        <Text style={styles.youBadgeText}>You</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Wait time card */}
        <View style={styles.waitCard}>
          <Text style={styles.waitCardText}>Estimated Wait: 12 Minutes</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  backArrow: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  headerTextContainer: {
    flex: 1,
  },
  hospitalName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  doctorName: {
    color: Colors.border,
    fontSize: 14,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
  },
  timeline: {
    marginBottom: 24,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineLeft: {
    alignItems: 'center',
    width: 48,
  },
  tokenCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleCompleted: {
    backgroundColor: Colors.green,
  },
  circleInRoom: {
    backgroundColor: Colors.yellow,
  },
  circleYours: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: Colors.green,
  },
  circleUpcoming: {
    backgroundColor: '#E5E7EB',
  },
  tokenNumberText: {
    fontSize: 16,
    fontWeight: '700',
  },
  tokenTextCompleted: {
    color: '#FFFFFF',
  },
  tokenTextInRoom: {
    color: Colors.text,
  },
  tokenTextYours: {
    color: Colors.green,
  },
  tokenTextUpcoming: {
    color: '#9CA3AF',
  },
  connector: {
    width: 2,
    height: 32,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  timelineRight: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 36,
    justifyContent: 'center',
    marginTop: 10,
  },
  tokenInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tokenInfoText: {
    flex: 1,
  },
  tokenLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  statusText: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  statusCompleted: {
    color: Colors.green,
  },
  statusInRoom: {
    color: Colors.orange,
  },
  statusYours: {
    color: Colors.green,
  },
  statusUpcoming: {
    color: Colors.sub,
  },
  youBadge: {
    backgroundColor: Colors.green,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  youBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  waitCard: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: Colors.green,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  waitCardText: {
    color: Colors.green,
    fontSize: 16,
    fontWeight: '700',
  },
});
