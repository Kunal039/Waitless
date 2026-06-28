import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors } from '../../../constants/colors'
import { getLiveQueue, subscribeToQueue } from '../../../lib/api/queue'
import { getAppointmentWithQueue } from '../../../lib/api/appointments'
import { QueueToken } from '../../../types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function LiveQueueScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [queue, setQueue] = useState<QueueToken[]>([])
  const [myToken, setMyToken] = useState<QueueToken | null>(null)
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [date, setDate] = useState<string | null>(null)
  const [doctorName, setDoctorName] = useState<string>('')
  const [hospitalName, setHospitalName] = useState<string>('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { appointment, token } = await getAppointmentWithQueue(appointmentId)
      setMyToken(token)
      setDoctorId(appointment.doctor_id)
      setDate(appointment.date)
      setDoctorName((appointment as any).doctors?.full_name ?? 'Doctor')
      setHospitalName((appointment as any).hospitals?.name ?? 'Hospital')
      const liveQueue = await getLiveQueue(appointment.doctor_id!, appointment.date)
      setQueue(liveQueue)
    } catch (e: any) {
      setError(e.message ?? 'Failed to load queue')
    } finally {
      setLoading(false)
    }
  }, [appointmentId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!doctorId || !date) return
    const unsubscribe = subscribeToQueue(doctorId, date, (tokens) => {
      setQueue(tokens)
    })
    return unsubscribe
  }, [doctorId, date])

  const currentlyServing = queue.find(t => t.status === 'in_room')
  const waitingQueue = queue.filter(t => t.status === 'waiting')
  const myPositionInWaiting = myToken
    ? waitingQueue.findIndex(t => t.id === myToken.id)
    : -1
  const tokensAhead = myPositionInWaiting > 0 ? myPositionInWaiting : 0
  const estimatedWait = tokensAhead * 5

  // Progress bar logic
  const allTokens = [...queue]
  const minToken = allTokens.length > 0 ? Math.min(...allTokens.map(t => t.token_number)) : 1
  const maxToken = allTokens.length > 0 ? Math.max(...allTokens.map(t => t.token_number)) : 1
  const currentTokenNum = currentlyServing?.token_number ?? minToken
  const myTokenNum = myToken?.token_number ?? maxToken
  const tokenRange = Math.max(maxToken - minToken, 1)
  const currentProgress = Math.max(0, Math.min(1, (currentTokenNum - minToken) / tokenRange))
  const myProgress = Math.max(0, Math.min(1, (myTokenNum - minToken) / tokenRange))

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading queue status...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Blue gradient header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push('/(patient)/appointments')}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>{hospitalName}</Text>
            <Text style={styles.headerSub} numberOfLines={1}>{doctorName}</Text>
          </View>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Token {minToken}</Text>
            <Text style={styles.progressLabel}>Token {maxToken}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${currentProgress * 100}%` }]} />
            {/* Current token dot */}
            <View style={[styles.progressDot, styles.progressDotCurrent, { left: `${currentProgress * 100}%` }]} />
            {/* Your token marker */}
            {myToken && myTokenNum !== currentTokenNum && (
              <View style={[styles.youMarkerWrapper, { left: `${myProgress * 100}%` }]}>
                <View style={styles.youMarkerDot} />
                <View style={styles.youMarkerLabel}>
                  <Text style={styles.youMarkerText}>You</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Token card */}
        <View style={styles.cardsRow}>
          <View style={[styles.infoCard, styles.currentTokenCard]}>
            <Text style={styles.cardLabel}>CURRENT TOKEN</Text>
            <Text style={styles.currentTokenNum}>
              {currentlyServing ? currentlyServing.token_number : '—'}
            </Text>
            <Text style={styles.cardSub}>
              {currentlyServing ? 'In Room' : 'None yet'}
            </Text>
          </View>

          {/* Your Token card */}
          <View style={[styles.infoCard, styles.myTokenCard]}>
            <Text style={styles.cardLabel}>YOUR TOKEN</Text>
            <Text style={styles.myTokenNum}>
              {myToken ? myToken.token_number : '—'}
            </Text>
            {myToken?.status === 'in_room' ? (
              <Text style={styles.yourTurnText}>Your Turn!</Text>
            ) : (
              <Text style={styles.cardSub}>
                {tokensAhead > 0 ? `${tokensAhead} ahead` : 'Next up!'}
              </Text>
            )}
          </View>
        </View>

        {/* Estimated wait time */}
        <View style={styles.waitCard}>
          <View style={styles.waitCardLeft}>
            <Text style={styles.waitCardLabel}>ESTIMATED WAITING TIME</Text>
            <Text style={styles.waitCardTime}>
              {myToken?.status === 'in_room'
                ? 'Now!'
                : estimatedWait === 0
                ? '< 5 min'
                : `~${estimatedWait} min`}
            </Text>
            <Text style={styles.waitCardSub}>Each token ≈ 5 minutes</Text>
          </View>
          <Text style={styles.waitCardEmoji}>⏱</Text>
        </View>

        {/* Queue summary row */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNum}>{waitingQueue.length}</Text>
            <Text style={styles.summarySub}>Waiting</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNum}>{currentlyServing ? 1 : 0}</Text>
            <Text style={styles.summarySub}>In Room</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNum}>{tokensAhead}</Text>
            <Text style={styles.summarySub}>Before You</Text>
          </View>
        </View>

        {/* View Full Queue button */}
        <TouchableOpacity
          style={styles.fullQueueBtn}
          onPress={() => router.push(`/(patient)/queue-details/${appointmentId}`)}
          activeOpacity={0.85}
        >
          <Text style={styles.fullQueueBtnText}>View Full Live Queue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.muted,
  },
  errorText: {
    fontSize: 15,
    color: Colors.red,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 14,
  },
  retryText: {
    color: Colors.white,
    fontWeight: '700',
  },
  // Header
  header: {
    backgroundColor: Colors.primaryDark,
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  backBtnText: {
    color: Colors.white,
    fontSize: 18,
    lineHeight: 22,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(222,53,11,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(222,53,11,0.4)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.red,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.red,
    letterSpacing: 1,
  },
  // Progress bar
  progressSection: {
    paddingHorizontal: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    position: 'relative',
    marginBottom: 20,
  },
  progressFill: {
    height: 8,
    backgroundColor: Colors.yellow,
    borderRadius: 4,
  },
  progressDot: {
    position: 'absolute',
    top: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -9,
  },
  progressDotCurrent: {
    backgroundColor: Colors.yellow,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  youMarkerWrapper: {
    position: 'absolute',
    top: -10,
    alignItems: 'center',
    marginLeft: -14,
  },
  youMarkerDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.white,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  youMarkerLabel: {
    marginTop: 4,
    backgroundColor: Colors.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  youMarkerText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  // Cards
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    alignItems: 'center',
  },
  currentTokenCard: {
    borderColor: Colors.yellow,
    backgroundColor: '#FFFBF0',
  },
  myTokenCard: {
    borderColor: Colors.green,
    backgroundColor: '#F0FDF4',
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.sub,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  currentTokenNum: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.yellow,
    fontVariant: ['tabular-nums'],
    lineHeight: 56,
  },
  myTokenNum: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.green,
    fontVariant: ['tabular-nums'],
    lineHeight: 56,
  },
  cardSub: {
    fontSize: 12,
    color: Colors.muted,
    fontWeight: '600',
    marginTop: 4,
  },
  yourTurnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.green,
    marginTop: 4,
  },
  // Wait card
  waitCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  waitCardLeft: {
    flex: 1,
  },
  waitCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.sub,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  waitCardTime: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
    marginBottom: 4,
  },
  waitCardSub: {
    fontSize: 12,
    color: Colors.muted,
  },
  waitCardEmoji: {
    fontSize: 36,
  },
  // Summary row
  summaryRow: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNum: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  summarySub: {
    fontSize: 11,
    color: Colors.muted,
    fontWeight: '600',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  // Full queue button
  fullQueueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  fullQueueBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
})
