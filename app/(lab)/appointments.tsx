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
import { Colors } from '../../constants/colors'
import { useAuth } from '../../lib/context/AuthContext'
import { supabase } from '../../lib/supabase'

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'

interface LabBooking {
  id: string
  patient_name: string
  test_name: string
  date: string
  start_time: string
  end_time: string
  status: string
  price: number
  phone: string | null
}

function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(t: string): string {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${m} ${ampm}`
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed': return Colors.green
    case 'cancelled': return Colors.red
    case 'confirmed': return Colors.purple
    default: return Colors.orange
  }
}

function getStatusBg(status: string): string {
  switch (status) {
    case 'completed': return '#dcfce7'
    case 'cancelled': return '#fee2e2'
    case 'confirmed': return '#EDE9FF'
    default: return '#FFF3CD'
  }
}

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const DATE_OFFSETS = [-1, 0, 1, 2, 3]

export default function LabAppointmentsScreen() {
  const { profile } = useAuth()
  const today = new Date()

  const [labId, setLabId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(toDateString(today))
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [bookings, setBookings] = useState<LabBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadLabId = useCallback(async () => {
    if (!profile?.id) return
    const { data } = await supabase
      .from('labs')
      .select('id')
      .eq('user_id', profile.id)
      .single()
    if (data) setLabId(data.id)
  }, [profile?.id])

  useEffect(() => { loadLabId() }, [loadLabId])

  const loadBookings = useCallback(async () => {
    if (!labId) return
    setLoading(true)
    try {
      let query = supabase
        .from('lab_appointments')
        .select('id, patient_name, test_name, date, start_time, end_time, status, price, phone')
        .eq('lab_id', labId)
        .eq('date', selectedDate)
        .order('start_time', { ascending: true })

      if (filter !== 'all') query = query.eq('status', filter)

      const { data, error } = await query
      if (error) throw error
      setBookings(data ?? [])
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [labId, selectedDate, filter])

  useEffect(() => { loadBookings() }, [loadBookings])

  async function updateStatus(bookingId: string, newStatus: string) {
    setActionLoading(bookingId)
    try {
      const { error } = await supabase
        .from('lab_appointments')
        .update({ status: newStatus })
        .eq('id', bookingId)
      if (error) throw error
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      )
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to update status')
    } finally {
      setActionLoading(null)
    }
  }

  function confirmAction(bookingId: string, action: 'confirmed' | 'cancelled') {
    const label = action === 'confirmed' ? 'confirm' : 'cancel'
    Alert.alert(
      `${label.charAt(0).toUpperCase() + label.slice(1)} Booking`,
      `Are you sure you want to ${label} this booking?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => updateStatus(bookingId, action) },
      ]
    )
  }

  function getDateLabel(offset: number): string {
    const d = new Date(today)
    d.setDate(d.getDate() + offset)
    if (offset === 0) return 'Today'
    if (offset === -1) return 'Yesterday'
    if (offset === 1) return 'Tomorrow'
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  function getDateStr(offset: number): string {
    const d = new Date(today)
    d.setDate(d.getDate() + offset)
    return toDateString(d)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lab Bookings</Text>
        <Text style={styles.headerSub}>{formatDisplayDate(selectedDate)}</Text>
      </View>

      {/* Date Picker */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.datePicker}
        contentContainerStyle={styles.datePickerContent}
      >
        {DATE_OFFSETS.map((offset) => {
          const ds = getDateStr(offset)
          const active = ds === selectedDate
          return (
            <TouchableOpacity
              key={offset}
              style={[styles.dateChip, active && styles.dateChipActive]}
              onPress={() => setSelectedDate(ds)}
              activeOpacity={0.75}
            >
              <Text style={[styles.dateChipText, active && styles.dateChipTextActive]}>
                {getDateLabel(offset)}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        {FILTERS.map((f) => {
          const active = filter === f.key
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterTab, active && styles.filterTabActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* Bookings List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.purple} />
          <Text style={styles.loadingText}>Loading bookings…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {bookings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>No bookings found</Text>
              <Text style={styles.emptySubText}>
                {filter !== 'all' ? 'Try a different filter' : 'No bookings for this date'}
              </Text>
            </View>
          ) : (
            bookings.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <View style={styles.bookingHeaderLeft}>
                    <Text style={styles.patientName}>{booking.patient_name}</Text>
                    {booking.phone ? (
                      <Text style={styles.patientPhone}>{booking.phone}</Text>
                    ) : null}
                  </View>
                  <View
                    style={[styles.statusPill, { backgroundColor: getStatusBg(booking.status) }]}
                  >
                    <Text style={[styles.statusPillText, { color: getStatusColor(booking.status) }]}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.bookingMeta}>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Test</Text>
                    <Text style={styles.metaValue}>{booking.test_name}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Time</Text>
                    <Text style={styles.metaValue}>
                      {formatTime(booking.start_time)}
                      {booking.end_time ? ` – ${formatTime(booking.end_time)}` : ''}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Price</Text>
                    <Text style={styles.metaValue}>₹{booking.price?.toLocaleString('en-IN') ?? '—'}</Text>
                  </View>
                </View>

                {(booking.status === 'pending' || booking.status === 'confirmed') && (
                  <View style={styles.actionRow}>
                    {booking.status === 'pending' && (
                      <TouchableOpacity
                        style={styles.confirmBtn}
                        onPress={() => confirmAction(booking.id, 'confirmed')}
                        disabled={actionLoading === booking.id}
                        activeOpacity={0.8}
                      >
                        {actionLoading === booking.id ? (
                          <ActivityIndicator size="small" color={Colors.card} />
                        ) : (
                          <Text style={styles.confirmBtnText}>Confirm</Text>
                        )}
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => confirmAction(booking.id, 'cancelled')}
                      disabled={actionLoading === booking.id}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: '#4C3BA0',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 2 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  datePicker: { maxHeight: 54, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  datePickerContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  dateChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateChipActive: { backgroundColor: Colors.purple, borderColor: Colors.purple },
  dateChipText: { fontSize: 13, fontWeight: '600', color: Colors.sub },
  dateChipTextActive: { color: '#FFFFFF' },
  filterBar: { maxHeight: 50, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterBarContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.background,
  },
  filterTabActive: { backgroundColor: '#EDE9FF' },
  filterTabText: { fontSize: 13, fontWeight: '600', color: Colors.sub },
  filterTabTextActive: { color: Colors.purple },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: Colors.muted },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 28 },
  bookingCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    gap: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  bookingHeaderLeft: { flex: 1, gap: 2 },
  patientName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  patientPhone: { fontSize: 12, color: Colors.muted },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  bookingMeta: { gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.muted,
    width: 44,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metaValue: { fontSize: 13, fontWeight: '600', color: Colors.sub, flex: 1 },
  actionRow: { flexDirection: 'row', gap: 10 },
  confirmBtn: {
    flex: 1,
    backgroundColor: Colors.purple,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: { color: Colors.red, fontWeight: '700', fontSize: 14 },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 40,
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  emptyEmoji: { fontSize: 36 },
  emptyText: { fontSize: 16, fontWeight: '700', color: Colors.text },
  emptySubText: { fontSize: 13, color: Colors.muted, textAlign: 'center' },
})
