import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { useAuth } from '../../lib/context/AuthContext'
import { getPatientAppointments, cancelAppointment } from '../../lib/api/appointments'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { AppointmentWithDetails } from '../../types'

type Tab = 'upcoming' | 'past'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

function isUpcoming(appt: AppointmentWithDetails): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const apptDate = new Date(appt.date + 'T00:00:00')
  const isPastDate = apptDate < today
  const isEndedStatus = appt.status === 'completed' || appt.status === 'cancelled' || appt.status === 'no_show'
  return !isPastDate && !isEndedStatus
}

export default function PatientAppointmentsScreen() {
  const router = useRouter()
  const { profile } = useAuth()
  const [tab, setTab] = useState<Tab>('upcoming')
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const loadAppointments = useCallback(async () => {
    if (!profile?.id) return
    try {
      setLoading(true)
      setError(null)
      const data = await getPatientAppointments(profile.id)
      setAppointments(data)
    } catch (e: any) {
      setError(e.message ?? 'Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }, [profile?.id])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  const upcomingAppts = appointments.filter(isUpcoming)
  const pastAppts = appointments.filter(a => !isUpcoming(a))
  const displayList = tab === 'upcoming' ? upcomingAppts : pastAppts

  async function handleCancel(appointmentId: string) {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancellingId(appointmentId)
              await cancelAppointment(appointmentId)
              await loadAppointments()
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Failed to cancel appointment')
            } finally {
              setCancellingId(null)
            }
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Appointments</Text>
        <Text style={styles.headerSub}>
          {upcomingAppts.length} upcoming · {pastAppts.length} past
        </Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === 'upcoming' && styles.tabActive]}
          onPress={() => setTab('upcoming')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
          {upcomingAppts.length > 0 && (
            <View style={[styles.tabBadge, tab === 'upcoming' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, tab === 'upcoming' && styles.tabBadgeTextActive]}>
                {upcomingAppts.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'past' && styles.tabActive]}
          onPress={() => setTab('past')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, tab === 'past' && styles.tabTextActive]}>
            Past
          </Text>
          {pastAppts.length > 0 && (
            <View style={[styles.tabBadge, tab === 'past' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, tab === 'past' && styles.tabBadgeTextActive]}>
                {pastAppts.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadAppointments}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {displayList.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>
                {tab === 'upcoming' ? '📋' : '🗂'}
              </Text>
              <Text style={styles.emptyTitle}>
                {tab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
              </Text>
              <Text style={styles.emptySub}>
                {tab === 'upcoming'
                  ? 'Book a doctor to get started'
                  : 'Your completed appointments will appear here'}
              </Text>
              {tab === 'upcoming' && (
                <TouchableOpacity
                  style={styles.bookBtn}
                  onPress={() => router.push('/(patient)/search')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.bookBtnText}>Find Doctors</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            displayList.map((appt) => {
              const doctor = (appt as any).doctors
              const hospital = (appt as any).hospitals
              const isCancelling = cancellingId === appt.id

              return (
                <View key={appt.id} style={styles.card}>
                  {/* Card header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.hospitalEmoji}>
                      <Text style={styles.hospitalEmojiText}>🏥</Text>
                    </View>
                    <View style={styles.cardHeaderInfo}>
                      <Text style={styles.hospitalName} numberOfLines={1}>
                        {hospital?.name ?? 'Hospital'}
                      </Text>
                      <Text style={styles.doctorName} numberOfLines={1}>
                        {doctor?.full_name ? `Dr. ${doctor.full_name}` : 'Doctor'}
                      </Text>
                    </View>
                    <StatusBadge status={appt.status} />
                  </View>

                  {/* Specialization */}
                  {doctor?.specialization && (
                    <View style={styles.specRow}>
                      <Text style={styles.specText}>{doctor.specialization}</Text>
                    </View>
                  )}

                  {/* Divider */}
                  <View style={styles.cardDivider} />

                  {/* Date / time row */}
                  <View style={styles.datetimeRow}>
                    <View style={styles.datetimeItem}>
                      <Text style={styles.datetimeIcon}>📅</Text>
                      <Text style={styles.datetimeText}>{formatDate(appt.date)}</Text>
                    </View>
                    <View style={styles.datetimeDot} />
                    <View style={styles.datetimeItem}>
                      <Text style={styles.datetimeIcon}>🕐</Text>
                      <Text style={styles.datetimeText}>
                        {formatTime(appt.start_time)}
                      </Text>
                    </View>
                  </View>

                  {/* Action buttons for upcoming */}
                  {tab === 'upcoming' && (
                    <View style={styles.actionRow}>
                      {appt.status === 'confirmed' && (
                        <TouchableOpacity
                          style={styles.viewQueueBtn}
                          onPress={() => router.push(`/(patient)/queue/${appt.id}`)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.viewQueueBtnText}>View Queue</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.cancelBtn, isCancelling && styles.cancelBtnDisabled]}
                        onPress={() => handleCancel(appt.id)}
                        disabled={isCancelling}
                        activeOpacity={0.85}
                      >
                        {isCancelling ? (
                          <ActivityIndicator size="small" color={Colors.red} />
                        ) : (
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primaryDark,
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginTop: -1,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.muted,
  },
  tabTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: Colors.border,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.sub,
  },
  tabBadgeTextActive: {
    color: Colors.white,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyEmoji: {
    fontSize: 52,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  bookBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 28,
  },
  bookBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  // Appointment card
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  hospitalEmoji: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  hospitalEmojiText: {
    fontSize: 22,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  doctorName: {
    fontSize: 13,
    color: Colors.sub,
  },
  specRow: {
    marginBottom: 10,
  },
  specText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    backgroundColor: Colors.primaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  datetimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datetimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  datetimeIcon: {
    fontSize: 14,
  },
  datetimeText: {
    fontSize: 13,
    color: Colors.sub,
    fontWeight: '500',
  },
  datetimeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  viewQueueBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  viewQueueBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  cancelBtnDisabled: {
    opacity: 0.6,
  },
  cancelBtnText: {
    color: Colors.red,
    fontWeight: '700',
    fontSize: 14,
  },
})
