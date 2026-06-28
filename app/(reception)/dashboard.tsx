import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/context/AuthContext';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { getLiveQueue, callNextToken, subscribeToQueue, getCurrentToken } from '../../lib/api/queue';
import type { QueueToken, Doctor } from '../../types';

const REC_DARK = '#003380';
const REC_BLUE = '#0052CC';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function ReceptionDashboard() {
  const router = useRouter();
  const { profile } = useAuth();

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const todayISO = new Date().toISOString().split('T')[0];

  const [loading, setLoading] = useState(true);
  const [callingNext, setCallingNext] = useState(false);
  const [currentToken, setCurrentToken] = useState<QueueToken | null>(null);
  const [queueTokens, setQueueTokens] = useState<QueueToken[]>([]);
  const [appointmentsToday, setAppointmentsToday] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [firstDoctor, setFirstDoctor] = useState<Doctor | null>(null);

  // We fetch the first available doctor for the reception's hospital
  const fetchDashboardData = useCallback(async () => {
    try {
      // Get hospital_id from profiles table (receptionist's hospital)
      const { data: recProfile } = await supabase
        .from('profiles')
        .select('hospital_id')
        .eq('id', profile?.id ?? '')
        .maybeSingle();

      const hospitalId: string | null = recProfile?.hospital_id ?? null;

      if (hospitalId) {
        const { data: docs } = await supabase
          .from('doctors')
          .select('*')
          .eq('hospital_id', hospitalId)
          .eq('is_available', true)
          .limit(1)
          .single();
        if (docs) setFirstDoctor(docs as Doctor);

        // Appointments today
        const { count: apptCount } = await supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('date', todayISO);
        setAppointmentsToday(apptCount ?? 0);

        const { count: doneCount } = await supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('date', todayISO)
          .eq('status', 'completed');
        setCompletedCount(doneCount ?? 0);

        if (docs) {
          const [current, queue] = await Promise.all([
            getCurrentToken(docs.id, todayISO),
            getLiveQueue(docs.id, todayISO),
          ]);
          setCurrentToken(current);
          setQueueTokens(queue);
        }
      }
    } catch (e) {
      // Non-fatal: display zeros
    } finally {
      setLoading(false);
    }
  }, [profile?.id, todayISO]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time subscription
  useEffect(() => {
    if (!firstDoctor) return;
    const unsub = subscribeToQueue(firstDoctor.id, todayISO, (tokens) => {
      setQueueTokens(tokens);
      const inRoom = tokens.find((t) => t.status === 'in_room') ?? null;
      setCurrentToken(inRoom);
    });
    return () => { unsub(); };
  }, [firstDoctor, todayISO]);

  const handleCallNext = async () => {
    if (!firstDoctor) return;
    setCallingNext(true);
    try {
      await callNextToken(firstDoctor.id, todayISO);
      const [current, queue] = await Promise.all([
        getCurrentToken(firstDoctor.id, todayISO),
        getLiveQueue(firstDoctor.id, todayISO),
      ]);
      setCurrentToken(current);
      setQueueTokens(queue);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not call next token');
    } finally {
      setCallingNext(false);
    }
  };

  const waitingCount = queueTokens.filter((t) => t.status === 'waiting').length;
  const currentTokenNumber = currentToken?.token_number ?? '—';
  const nextTokenNumber = queueTokens.find((t) => t.status === 'waiting')?.token_number;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {getGreeting()}, {profile?.full_name ?? 'Staff'} 👋
          </Text>
          <Text style={styles.subtitle}>ABC Hospital · Front Desk</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateChip}>
              <Text style={styles.dateChipText}>{today}</Text>
            </View>
            <View style={styles.opdChip}>
              <Text style={styles.opdChipText}>● OPD Open</Text>
            </View>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={REC_BLUE} style={styles.loader} />
        ) : (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Appointments{'\n'}Today</Text>
                <Text style={[styles.statValue, { color: REC_BLUE }]}>{appointmentsToday}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Current{'\n'}Token</Text>
                <Text style={[styles.statValue, { color: REC_BLUE }]}>{currentTokenNumber}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>In Waiting{'\n'}Room</Text>
                <Text style={[styles.statValue, { color: Colors.orange }]}>{waitingCount}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Completed</Text>
                <Text style={[styles.statValue, { color: Colors.green }]}>{completedCount}</Text>
              </View>
            </View>

            {/* Now Serving Card */}
            <View style={styles.servingCard}>
              <Text style={styles.servingEyebrow}>NOW SERVING</Text>
              <Text style={styles.servingToken}>Token #{currentTokenNumber}</Text>
              {firstDoctor ? (
                <Text style={styles.servingDoctor}>
                  {firstDoctor.full_name} · Room {firstDoctor.room_number ?? '—'}
                </Text>
              ) : (
                <Text style={styles.servingDoctor}>No doctor assigned</Text>
              )}
              <TouchableOpacity
                style={[styles.callNextBtn, callingNext && styles.callNextBtnDisabled]}
                onPress={handleCallNext}
                disabled={callingNext || !firstDoctor}
                activeOpacity={0.85}
              >
                {callingNext ? (
                  <ActivityIndicator color={REC_DARK} size="small" />
                ) : (
                  <Text style={styles.callNextBtnText}>
                    Call Next Token{nextTokenNumber ? ` #${nextTokenNumber}` : ''} →
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={[styles.actionCard, styles.actionGreen]}
                onPress={() => router.push('/(reception)/register-patient')}
                activeOpacity={0.8}
              >
                <Text style={styles.actionEmoji}>➕</Text>
                <Text style={[styles.actionText, { color: Colors.green }]}>Register Patient</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionCard, styles.actionBlue]}
                onPress={() => router.push('/(reception)/appointments')}
                activeOpacity={0.8}
              >
                <Text style={styles.actionEmoji}>📋</Text>
                <Text style={[styles.actionText, { color: REC_BLUE }]}>Appointments</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionCard, styles.actionOrange, styles.actionFull]}
                onPress={() => router.push('/(reception)/queue')}
                activeOpacity={0.8}
              >
                <Text style={styles.actionEmoji}>🎫</Text>
                <Text style={[styles.actionText, { color: Colors.orange }]}>Queue Manager</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loader: {
    marginTop: 48,
  },
  header: {
    backgroundColor: REC_DARK,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#A8C4FF',
    marginBottom: 14,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  dateChip: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dateChipText: {
    color: '#C8D8FF',
    fontSize: 12,
  },
  opdChip: {
    backgroundColor: Colors.green,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  opdChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.sub,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 34,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  servingCard: {
    backgroundColor: REC_DARK,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 22,
    shadowColor: REC_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  servingEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7EB3FF',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  servingToken: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
    fontVariant: ['tabular-nums'],
  },
  servingDoctor: {
    fontSize: 14,
    color: '#B8D0FF',
    marginBottom: 20,
  },
  callNextBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  callNextBtnDisabled: {
    opacity: 0.6,
  },
  callNextBtnText: {
    color: REC_DARK,
    fontWeight: '700',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.sub,
    letterSpacing: 0.8,
    marginHorizontal: 16,
    marginTop: 28,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionCard: {
    width: '47%',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    gap: 6,
  },
  actionFull: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  actionGreen: { backgroundColor: '#DCFCE7' },
  actionBlue: { backgroundColor: '#DBEAFE' },
  actionOrange: { backgroundColor: '#FFF3E0' },
  actionEmoji: { fontSize: 22 },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
