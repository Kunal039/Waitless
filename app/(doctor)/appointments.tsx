import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from '../../constants/colors'
import { useAuth } from '../../lib/context/AuthContext'
import { getDoctorByUserId } from '../../lib/api/doctors'
import { getDoctorAppointments, cancelAppointment } from '../../lib/api/appointments'
import { callNextToken, getLiveQueue } from '../../lib/api/queue'
import { Doctor, QueueToken } from '../../types'

type FilterTab = 'All' | 'Waiting' | 'In Room' | 'Done'

function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function formatDisplayDate(d: Date): string {
  const today = toDateString(new Date())
  const dStr = toDateString(d)
  if (dStr === today) return 'Today'
  const tomorrow = toDateString(addDays(new Date(), 1))
  if (dStr === tomorrow) return 'Tomorrow'
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
}

function getStatusForToken(appointment: any, queueTokens: QueueToken[]): FilterTab {
  const token = queueTokens.find(t => t.appointment_id === appointment.id)
  if (appointment.status === 'completed' || appointment.status === 'cancelled') return 'Done'
  if (token?.status === 'in_room') return 'In Room'
  if (token?.status === 'waiting') return 'Waiting'
  return 'Waiting'
}

function statusColor(tab: FilterTab): string {
  switch (tab) {
    case 'Waiting': return Colors.orange
    case 'In Room': return Colors.teal
    case 'Done': return Colors.green
    default: return Colors.sub
  }
}

function statusBg(tab: FilterTab): string {
  switch (tab) {
    case 'Waiting': return '#FFF3E0'
    case 'In Room': return '#D0F5F3'
    case 'Done': return '#DCFCE7'
    default: return Colors.background
  }
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[modalStyles.infoRow, last && { borderBottomWidth: 0 }]}>
      <Text style={modalStyles.infoLabel}>{label}</Text>
      <Text style={modalStyles.infoValue}>{value}</Text>
    </View>
  )
}

interface AppointmentDetailModalProps {
  visible: boolean
  appointment: any
  status: FilterTab
  onClose: () => void
  onCancel: () => void
  cancelLoading: boolean
}

function AppointmentDetailModal({
  visible,
  appointment,
  status,
  onClose,
  onCancel,
  cancelLoading,
}: AppointmentDetailModalProps) {
  if (!appointment) return null
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Appointment Details</Text>
            <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={modalStyles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={modalStyles.statusRow}>
              <View style={[modalStyles.statusBadge, { backgroundColor: statusBg(status) }]}>
                <Text style={[modalStyles.statusBadgeText, { color: statusColor(status) }]}>
                  {status}
                </Text>
              </View>
              <Text style={modalStyles.timeText}>
                {appointment.start_time} – {appointment.end_time}
              </Text>
            </View>
            <View style={modalStyles.infoCard}>
              <InfoRow label="Patient Name" value={appointment.patient_name ?? '—'} />
              <InfoRow
                label="Age"
                value={appointment.patient_age ? `${appointment.patient_age} yrs` : '—'}
              />
              <InfoRow label="Gender" value={appointment.patient_gender ?? '—'} />
              <InfoRow label="Phone" value={appointment.patient_phone ?? '—'} />
              <InfoRow label="Reason" value={appointment.reason ?? '—'} last />
            </View>
            {appointment.notes ? (
              <View style={modalStyles.notesCard}>
                <Text style={modalStyles.notesLabel}>NOTES</Text>
                <Text style={modalStyles.notesText}>{appointment.notes}</Text>
              </View>
            ) : null}
            {status !== 'Done' && (
              <TouchableOpacity
                style={modalStyles.cancelBtn}
                onPress={onCancel}
                disabled={cancelLoading}
                activeOpacity={0.85}
              >
                {cancelLoading ? (
                  <ActivityIndicator size="small" color={Colors.red} />
                ) : (
                  <Text style={modalStyles.cancelBtnText}>Cancel Appointment</Text>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 12,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    color: Colors.sub,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 14,
    color: Colors.sub,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  notesCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: Colors.text,
  },
  cancelBtn: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    marginTop: 4,
  },
  cancelBtnText: {
    color: Colors.red,
    fontWeight: '700',
    fontSize: 15,
  },
})

export default function DoctorAppointmentsScreen() {
  const { profile } = useAuth()
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appointments, setAppointments] = useState<any[]>([])
  const [queueTokens, setQueueTokens] = useState<QueueToken[]>([])
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All')
  const [loading, setLoading] = useState(true)
  const [selectedAppt, setSelectedAppt] = useState<any | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [callingNext, setCallingNext] = useState(false)

  const dateStr = toDateString(selectedDate)

  const loadAppointments = useCallback(async () => {
    if (!doctor) return
    try {
      setLoading(true)
      const [appts, queue] = await Promise.all([
        getDoctorAppointments(doctor.id, dateStr),
        getLiveQueue(doctor.id, dateStr),
      ])
      setAppointments(appts)
      setQueueTokens(queue)
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }, [doctor, dateStr])

  useEffect(() => {
    const init = async () => {
      if (!profile?.id) return
      const doc = await getDoctorByUserId(profile.id)
      setDoctor(doc)
    }
    init()
  }, [profile?.id])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  const filtered = appointments.filter(a => {
    const matchSearch = search
      ? (a.patient_name ?? '').toLowerCase().includes(search.toLowerCase())
      : true
    if (!matchSearch) return false
    if (activeFilter === 'All') return true
    return getStatusForToken(a, queueTokens) === activeFilter
  })

  async function handleCancelAppointment() {
    if (!selectedAppt) return
    Alert.alert('Cancel Appointment', 'Cancel this appointment?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            setCancelLoading(true)
            await cancelAppointment(selectedAppt.id)
            setDetailVisible(false)
            setSelectedAppt(null)
            await loadAppointments()
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Failed to cancel')
          } finally {
            setCancelLoading(false)
          }
        },
      },
    ])
  }

  async function handleCallNext() {
    if (!doctor) return
    try {
      setCallingNext(true)
      await callNextToken(doctor.id, dateStr)
      await loadAppointments()
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to call next token')
    } finally {
      setCallingNext(false)
    }
  }

  const FILTER_TABS: FilterTab[] = ['All', 'Waiting', 'In Room', 'Done']

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Appointments</Text>
        <View style={styles.datePicker}>
          <TouchableOpacity
            style={styles.dateArrow}
            onPress={() => setSelectedDate(prev => addDays(prev, -1))}
            activeOpacity={0.7}
          >
            <Text style={styles.dateArrowText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.datePickerLabel}>{formatDisplayDate(selectedDate)}</Text>
          <TouchableOpacity
            style={styles.dateArrow}
            onPress={() => setSelectedDate(prev => addDays(prev, 1))}
            activeOpacity={0.7}
          >
            <Text style={styles.dateArrowText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search patient name…"
            placeholderTextColor={Colors.muted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === tab && styles.filterTabTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Appointment list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.teal} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>No appointments</Text>
          <Text style={styles.emptySub}>
            {search ? 'No results match your search' : 'No appointments for this date'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {filtered.map(appt => {
            const apptStatus = getStatusForToken(appt, queueTokens)
            const token = queueTokens.find(t => t.appointment_id === appt.id)
            return (
              <TouchableOpacity
                key={appt.id}
                style={styles.apptCard}
                onPress={() => {
                  setSelectedAppt(appt)
                  setDetailVisible(true)
                }}
                activeOpacity={0.85}
              >
                <View style={[styles.tokenBadge, { backgroundColor: statusBg(apptStatus) }]}>
                  <Text style={[styles.tokenBadgeText, { color: statusColor(apptStatus) }]}>
                    {token ? `#${token.token_number}` : '—'}
                  </Text>
                </View>
                <View style={styles.apptInfo}>
                  <Text style={styles.apptPatientName}>
                    {appt.patient_name ?? 'Unknown Patient'}
                  </Text>
                  <Text style={styles.apptMeta}>
                    {appt.reason ?? 'General Consultation'} · {appt.start_time}
                  </Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: statusBg(apptStatus) }]}>
                  <Text style={[styles.statusPillText, { color: statusColor(apptStatus) }]}>
                    {apptStatus}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}
          <View style={styles.listBottom} />
        </ScrollView>
      )}

      {/* Call Next floating button */}
      <View style={styles.fab}>
        <TouchableOpacity
          style={styles.fabBtn}
          onPress={handleCallNext}
          disabled={callingNext}
          activeOpacity={0.85}
        >
          {callingNext ? (
            <ActivityIndicator size="small" color={Colors.card} />
          ) : (
            <Text style={styles.fabBtnText}>Call Next →</Text>
          )}
        </TouchableOpacity>
      </View>

      <AppointmentDetailModal
        visible={detailVisible}
        appointment={selectedAppt}
        status={selectedAppt ? getStatusForToken(selectedAppt, queueTokens) : 'All'}
        onClose={() => {
          setDetailVisible(false)
          setSelectedAppt(null)
        }}
        onCancel={handleCancelAppointment}
        cancelLoading={cancelLoading}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: '#0E8070',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 4,
  },
  dateArrow: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dateArrowText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  datePickerLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    minWidth: 100,
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  searchClear: {
    fontSize: 13,
    color: Colors.muted,
    fontWeight: '700',
  },
  filterScroll: {
    flexGrow: 0,
    marginBottom: 12,
  },
  filterRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: '#0E8070',
    borderColor: '#0E8070',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.sub,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  listBottom: {
    height: 90,
  },
  apptCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tokenBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tokenBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  apptInfo: {
    flex: 1,
  },
  apptPatientName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 3,
  },
  apptMeta: {
    fontSize: 12,
    color: Colors.muted,
    textTransform: 'capitalize',
  },
  statusPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 0,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  fabBtn: {
    backgroundColor: '#0E8070',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#0E8070',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
})
