import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { useAuth } from '../../lib/context/AuthContext'
import { getDoctorByUserId } from '../../lib/api/doctors'
import { getDoctorAppointments } from '../../lib/api/appointments'
import { getLiveQueue, callNextToken, subscribeToQueue, getCurrentToken } from '../../lib/api/queue'
import { Doctor } from '../../types'
import { QueueToken } from '../../types'

function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export default function DoctorDashboardScreen() {
  const router = useRouter()
  const { profile } = useAuth()

  const today = new Date()
  const todayStr = toDateString(today)

  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<any[]>([])
  const [queueTokens, setQueueTokens] = useState<QueueToken[]>([])
  const [currentToken, setCurrentToken] = useState<QueueToken | null>(null)
  const [callingNext, setCallingNext] = useState(false)

  const loadData = useCallback(async () => {
    if (!profile?.id) return
    try {
      const doc = await getDoctorByUserId(profile.id)
      setDoctor(doc)
      if (doc) {
        const [appts, queue, current] = await Promise.all([
          getDoctorAppointments(doc.id, todayStr),
          getLiveQueue(doc.id, todayStr),
          getCurrentToken(doc.id, todayStr),
        ])
        setAppointments(appts)
        setQueueTokens(queue)
        setCurrentToken(current)
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [profile?.id, todayStr])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!doctor) return
    const unsub = subscribeToQueue(doctor.id, todayStr, (tokens) => {
      setQueueTokens(tokens)
      const inRoom = tokens.find(t => t.status === 'in_room') ?? null
      setCurrentToken(inRoom)
    })
    return unsub
  }, [doctor, todayStr])

  async function handleCallNext() {
    if (!doctor) return
    try {
      setCallingNext(true)
      await callNextToken(doctor.id, todayStr)
      const [queue, current] = await Promise.all([
        getLiveQueue(doctor.id, todayStr),
        getCurrentToken(doctor.id, todayStr),
      ])
      setQueueTokens(queue)
      setCurrentToken(current)
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to call next token')
    } finally {
      setCallingNext(false)
    }
  }

  const totalToday = appointments.length
  const waiting = queueTokens.filter(t => t.status === 'waiting').length
  const inRoom = queueTokens.filter(t => t.status === 'in_room').length
  const completed = appointments.filter(a => a.status === 'completed').length
  const servingToken = currentToken ?? queueTokens.find(t => t.status === 'waiting') ?? null
  const servingAppointment = servingToken
    ? appointments.find(a => a.id === servingToken.appointment_id)
    : null

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.teal} />
          <Text style={styles.loadingText}>Loading dashboard…</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Teal gradient header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {getGreeting()}, Dr. {profile?.full_name?.split(' ')[0] ?? 'Doctor'} 👋
          </Text>
          <Text style={styles.hospitalName}>
            {doctor ? `${doctor.specialization}` : 'Loading…'}
          </Text>
          <View style={styles.dateRow}>
            <Text style={styles.dateText}>{formatDate(today)}</Text>
            <View style={styles.opdChip}>
              <Text style={styles.opdChipText}>OPD Open</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardTeal]}>
            <Text style={styles.statLabel}>Today's Patients</Text>
            <Text style={[styles.statValue, { color: Colors.teal }]}>{totalToday}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardBlue]}>
            <Text style={styles.statLabel}>Current Token</Text>
            <Text style={[styles.statValue, { color: Colors.primary }]}>
              {currentToken ? `#${currentToken.token_number}` : '—'}
            </Text>
          </View>
          <View style={[styles.statCard, styles.statCardOrange]}>
            <Text style={styles.statLabel}>In Waiting</Text>
            <Text style={[styles.statValue, { color: Colors.orange }]}>{waiting}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardGreen]}>
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={[styles.statValue, { color: Colors.green }]}>{completed}</Text>
          </View>
        </View>

        {/* Now Serving card */}
        <View style={styles.servingCard}>
          <View style={styles.servingCardInner}>
            <Text style={styles.servingLabel}>NOW SERVING</Text>
            {servingToken ? (
              <>
                <Text style={styles.servingTokenNum}>Token #{servingToken.token_number}</Text>
                <Text style={styles.servingPatient}>
                  {servingAppointment?.patient_name ?? 'Patient'}
                </Text>
                {servingAppointment?.reason ? (
                  <Text style={styles.servingReason}>{servingAppointment.reason}</Text>
                ) : null}
              </>
            ) : (
              <>
                <Text style={styles.servingTokenNum}>—</Text>
                <Text style={styles.servingPatient}>No active token</Text>
              </>
            )}
            <TouchableOpacity
              style={styles.callNextBtn}
              onPress={handleCallNext}
              disabled={callingNext}
              activeOpacity={0.85}
            >
              {callingNext ? (
                <ActivityIndicator size="small" color={Colors.teal} />
              ) : (
                <Text style={styles.callNextBtnText}>Call Next Token →</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, styles.actionTeal]}
            onPress={() => router.push('/(doctor)/appointments')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionEmoji}>📋</Text>
            <Text style={[styles.actionLabel, { color: Colors.teal }]}>Today's Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, styles.actionBlue]}
            onPress={() => router.push('/(doctor)/availability')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionEmoji}>🗓</Text>
            <Text style={[styles.actionLabel, { color: Colors.primary }]}>Mark Availability</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.muted,
  },
  // Header
  header: {
    backgroundColor: '#0E8070',
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
  hospitalName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  dateText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  opdChip: {
    backgroundColor: Colors.green,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  opdChipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
  },
  statCardTeal: {
    borderColor: '#B2EAE7',
  },
  statCardBlue: {
    borderColor: Colors.border,
  },
  statCardOrange: {
    borderColor: '#FFE0B2',
  },
  statCardGreen: {
    borderColor: '#BBF7D0',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.sub,
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  // Now Serving
  servingCard: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  servingCardInner: {
    backgroundColor: '#0E8070',
    padding: 20,
  },
  servingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  servingTokenNum: {
    fontSize: 44,
    fontWeight: '800',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    marginBottom: 4,
  },
  servingPatient: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
  },
  servingReason: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 16,
  },
  callNextBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 12,
  },
  callNextBtnText: {
    color: '#0E8070',
    fontWeight: '700',
    fontSize: 15,
  },
  // Quick Actions
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.sub,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    gap: 8,
  },
  actionTeal: {
    backgroundColor: '#D0F5F3',
  },
  actionBlue: {
    backgroundColor: Colors.primaryLight,
  },
  actionEmoji: {
    fontSize: 26,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
})
