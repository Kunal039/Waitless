import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { getLiveQueue, callNextToken, subscribeToQueue, getCurrentToken } from '../../lib/api/queue';
import type { QueueToken, Doctor } from '../../types';

const REC_DARK = '#003380';
const REC_BLUE = '#0052CC';

export default function QueueScreen() {
  const todayISO = new Date().toISOString().split('T')[0];

  const [loading, setLoading] = useState(true);
  const [callingNext, setCallingNext] = useState(false);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [currentToken, setCurrentToken] = useState<QueueToken | null>(null);
  const [upcomingTokens, setUpcomingTokens] = useState<QueueToken[]>([]);
  // Appointment data keyed by appointment_id for showing patient name/reason
  const [apptMap, setApptMap] = useState<Record<string, { patient_name: string; reason: string; start_time: string }>>({});

  const fetchApptDetails = useCallback(async (tokens: QueueToken[]) => {
    const ids = tokens.map((t) => t.appointment_id).filter(Boolean);
    if (ids.length === 0) return;
    const { data } = await supabase
      .from('appointments')
      .select('id, patient_name, reason, start_time')
      .in('id', ids);
    if (data) {
      const map: Record<string, { patient_name: string; reason: string; start_time: string }> = {};
      data.forEach((a: any) => { map[a.id] = a; });
      setApptMap(map);
    }
  }, []);

  const fetchQueue = useCallback(async (doc: Doctor) => {
    const [current, queue] = await Promise.all([
      getCurrentToken(doc.id, todayISO),
      getLiveQueue(doc.id, todayISO),
    ]);
    setCurrentToken(current);
    const waiting = queue.filter((t) => t.status === 'waiting');
    setUpcomingTokens(waiting);
    await fetchApptDetails([...(current ? [current] : []), ...waiting]);
  }, [todayISO, fetchApptDetails]);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data: recProfile } = await supabase
          .from('profiles')
          .select('hospital_id')
          .eq('id', session.user.id)
          .maybeSingle();
        if (!recProfile?.hospital_id) return;
        const { data: doc } = await supabase
          .from('doctors')
          .select('*')
          .eq('hospital_id', recProfile.hospital_id)
          .eq('is_available', true)
          .limit(1)
          .single();
        if (doc) {
          setDoctor(doc as Doctor);
          await fetchQueue(doc as Doctor);
        }
      } catch (e) {
        // non-fatal
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchQueue]);

  useEffect(() => {
    if (!doctor) return;
    const unsub = subscribeToQueue(doctor.id, todayISO, async (tokens) => {
      const current = tokens.find((t) => t.status === 'in_room') ?? null;
      const waiting = tokens.filter((t) => t.status === 'waiting');
      setCurrentToken(current);
      setUpcomingTokens(waiting);
      await fetchApptDetails([...(current ? [current] : []), ...waiting]);
    });
    return () => { unsub(); };
  }, [doctor, todayISO, fetchApptDetails]);

  const handleCallNext = async () => {
    if (!doctor) return;
    setCallingNext(true);
    try {
      await callNextToken(doctor.id, todayISO);
      await fetchQueue(doctor);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not call next token');
    } finally {
      setCallingNext(false);
    }
  };

  const nextToken = upcomingTokens[0];
  const currentAppt = currentToken ? apptMap[currentToken.appointment_id] : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Queue Manager</Text>
        {doctor && (
          <Text style={styles.headerSubtitle}>
            {doctor.full_name} · Room {doctor.room_number ?? '—'}
          </Text>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={REC_BLUE} style={styles.loader} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Now Serving */}
          <View style={styles.nowServingCard}>
            <Text style={styles.nowServingEyebrow}>NOW SERVING</Text>
            <Text style={styles.tokenNumber}>
              Token #{currentToken?.token_number ?? '—'}
            </Text>
            <Text style={styles.patientInfo}>
              {currentAppt
                ? `${currentAppt.patient_name} · ${currentAppt.reason}`
                : 'No patient in room'}
            </Text>
            <TouchableOpacity
              style={[styles.callBtn, callingNext && styles.callBtnDisabled]}
              onPress={handleCallNext}
              disabled={callingNext || !nextToken}
              activeOpacity={0.85}
            >
              {callingNext ? (
                <ActivityIndicator color={REC_DARK} size="small" />
              ) : (
                <Text style={styles.callBtnText}>
                  📢 Call Token #{nextToken?.token_number ?? '—'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>UPCOMING TOKENS</Text>

          {upcomingTokens.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyText}>Queue is empty</Text>
              <Text style={styles.emptySubtext}>No patients waiting right now</Text>
            </View>
          ) : (
            upcomingTokens.map((item) => {
              const appt = apptMap[item.appointment_id];
              return (
                <View key={item.id} style={styles.tokenCard}>
                  <View style={styles.tokenLeft}>
                    <View style={styles.tokenBadge}>
                      <Text style={styles.tokenBadgeText}>#{item.token_number}</Text>
                    </View>
                    <View style={styles.tokenInfo}>
                      <Text style={styles.tokenPatientName}>
                        {appt?.patient_name ?? 'Patient'}
                      </Text>
                      <Text style={styles.tokenMeta}>
                        {appt?.reason ?? '—'}{appt?.start_time ? ` · ${appt.start_time}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.waitingPill}>
                    <Text style={styles.waitingPillText}>Waiting</Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: REC_DARK,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#A8C4FF',
    fontSize: 14,
    marginTop: 3,
  },
  loader: {
    marginTop: 48,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  nowServingCard: {
    backgroundColor: REC_DARK,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: REC_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  nowServingEyebrow: {
    color: '#7EB3FF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  tokenNumber: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '900',
    marginBottom: 6,
    fontVariant: ['tabular-nums'],
  },
  patientInfo: {
    color: '#B8D0FF',
    fontSize: 15,
    marginBottom: 22,
    textAlign: 'center',
  },
  callBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    minWidth: 200,
    alignItems: 'center',
  },
  callBtnDisabled: {
    opacity: 0.5,
  },
  callBtnText: {
    color: REC_DARK,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.sub,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  emptyEmoji: { fontSize: 36, marginBottom: 10 },
  emptyText: { fontSize: 16, fontWeight: '700', color: Colors.text },
  emptySubtext: { fontSize: 13, color: Colors.sub, marginTop: 4 },
  tokenCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  tokenLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenBadge: {
    backgroundColor: '#FEF9C3',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 12,
    minWidth: 46,
    alignItems: 'center',
  },
  tokenBadgeText: {
    color: '#856404',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  tokenInfo: { flex: 1 },
  tokenPatientName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  tokenMeta: {
    fontSize: 12,
    color: Colors.sub,
    marginTop: 2,
  },
  waitingPill: {
    backgroundColor: '#FEF9C3',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  waitingPillText: {
    color: '#856404',
    fontSize: 12,
    fontWeight: '600',
  },
});
