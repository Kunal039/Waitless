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
import { supabase } from '../../lib/supabase'
import { Lab } from '../../types/lab'

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

function formatTime(t: string): string {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${m} ${ampm}`
}

interface RecentBooking {
  id: string
  patient_name: string
  test_name: string
  date: string
  start_time: string
  status: string
}

interface DashboardStats {
  totalToday: number
  pending: number
  completed: number
  revenue: number
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

export default function LabDashboardScreen() {
  const router = useRouter()
  const { profile } = useAuth()

  const today = new Date()
  const todayStr = toDateString(today)

  const [lab, setLab] = useState<Lab | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalToday: 0,
    pending: 0,
    completed: 0,
    revenue: 0,
  })
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])

  const loadData = useCallback(async () => {
    if (!profile?.id) return
    try {
      const { data: labData, error: labError } = await supabase
        .from('labs')
        .select('*')
        .eq('user_id', profile.id)
        .single()

      if (labError || !labData) throw new Error('Lab not found')
      setLab(labData)

      const { data: appts, error: apptsError } = await supabase
        .from('lab_appointments')
        .select('id, patient_name, test_name, date, start_time, status, price')
        .eq('lab_id', labData.id)
        .eq('date', todayStr)
        .order('start_time', { ascending: true })

      if (apptsError) throw apptsError

      const allAppts = appts ?? []
      const pendingCount = allAppts.filter(
        (a: any) => a.status === 'pending' || a.status === 'confirmed'
      ).length
      const completedCount = allAppts.filter((a: any) => a.status === 'completed').length
      const revenue = allAppts
        .filter((a: any) => a.status === 'completed')
        .reduce((sum: number, a: any) => sum + (a.price ?? 0), 0)

      setStats({ totalToday: allAppts.length, pending: pendingCount, completed: completedCount, revenue })
      setRecentBookings(allAppts.slice(0, 5))
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [profile?.id, todayStr])

  useEffect(() => { loadData() }, [loadData])

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.purple} />
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
        {/* Purple gradient header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={styles.headerEmoji}>🧪</Text>
            <View style={styles.headerChip}>
              <Text style={styles.headerChipText}>Lab Admin</Text>
            </View>
          </View>
          <Text style={styles.labName}>{lab?.name ?? 'Your Lab'}</Text>
          <Text style={styles.labCity}>{lab?.city ?? ''}</Text>
          <Text style={styles.dateText}>{formatDate(today)}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardPurple]}>
            <Text style={styles.statLabel}>Today's Bookings</Text>
            <Text style={[styles.statValue, { color: Colors.purple }]}>{stats.totalToday}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardOrange]}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={[styles.statValue, { color: Colors.orange }]}>{stats.pending}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardGreen]}>
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={[styles.statValue, { color: Colors.green }]}>{stats.completed}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardBlue]}>
            <Text style={styles.statLabel}>Revenue</Text>
            <Text style={[styles.statValue, { color: Colors.primary, fontSize: 22 }]}>
              ₹{stats.revenue.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, styles.actionPurple]}
            onPress={() => router.push('/(lab)/tests')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionEmoji}>🔬</Text>
            <Text style={[styles.actionLabel, { color: Colors.purple }]}>Manage Tests</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, styles.actionBlue]}
            onPress={() => router.push('/(lab)/appointments')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionEmoji}>📋</Text>
            <Text style={[styles.actionLabel, { color: Colors.primary }]}>View Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, styles.actionGreen]}
            onPress={() => router.push('/(lab)/tests')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionEmoji}>➕</Text>
            <Text style={[styles.actionLabel, { color: Colors.green }]}>Add Test</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Bookings */}
        <Text style={styles.sectionTitle}>RECENT BOOKINGS</Text>
        {recentBookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No bookings today yet</Text>
          </View>
        ) : (
          <View style={styles.bookingsList}>
            {recentBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingLeft}>
                  <Text style={styles.bookingPatient}>{booking.patient_name}</Text>
                  <Text style={styles.bookingTest}>{booking.test_name}</Text>
                  <Text style={styles.bookingTime}>{formatTime(booking.start_time)}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: getStatusBg(booking.status) }]}>
                  <Text style={[styles.statusPillText, { color: getStatusColor(booking.status) }]}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 28 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: Colors.muted },
  header: {
    backgroundColor: '#4C3BA0',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerEmoji: { fontSize: 32 },
  headerChip: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  headerChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  labName: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  labCity: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 10 },
  dateText: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },
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
  statCardPurple: { borderColor: '#D6D0FF' },
  statCardOrange: { borderColor: '#FFE0B2' },
  statCardGreen: { borderColor: '#BBF7D0' },
  statCardBlue: { borderColor: Colors.border },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.sub,
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 30,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
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
  actionsGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  actionCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  actionPurple: { backgroundColor: '#EDE9FF' },
  actionBlue: { backgroundColor: Colors.primaryLight },
  actionGreen: { backgroundColor: '#dcfce7' },
  actionEmoji: { fontSize: 24 },
  actionLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  bookingsList: { paddingHorizontal: 16, gap: 10 },
  bookingCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookingLeft: { flex: 1, gap: 3 },
  bookingPatient: { fontSize: 15, fontWeight: '700', color: Colors.text },
  bookingTest: { fontSize: 13, color: Colors.sub },
  bookingTime: { fontSize: 12, color: Colors.muted, fontVariant: ['tabular-nums'] },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  emptyCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyEmoji: { fontSize: 32 },
  emptyText: { fontSize: 14, color: Colors.muted },
})
