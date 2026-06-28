import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/context/AuthContext'
import { Lab, LabTest, LabSlot } from '../../types'

const TODAY = new Date()
const DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(TODAY)
  d.setDate(TODAY.getDate() + i)
  return d
})
const FMT_DATE = (d: Date) => d.toISOString().split('T')[0]
const FMT_DISPLAY = (d: Date) =>
  d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
const FMT_TIME = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  const ampm = h < 12 ? 'AM' : 'PM'
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`
}

export default function BookLabScreen() {
  const { labId } = useLocalSearchParams<{ labId: string }>()
  const router = useRouter()
  const { profile } = useAuth()

  const [lab, setLab] = useState<Lab | null>(null)
  const [tests, setTests] = useState<LabTest[]>([])
  const [slots, setSlots] = useState<LabSlot[]>([])
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null)
  const [selectedDate, setSelectedDate] = useState(FMT_DATE(TODAY))
  const [selectedSlot, setSelectedSlot] = useState<LabSlot | null>(null)
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    if (!labId) return
    Promise.all([
      supabase.from('labs').select('*').eq('id', labId).single(),
      supabase.from('lab_tests').select('*').eq('lab_id', labId).eq('is_available', true),
    ]).then(([labRes, testsRes]) => {
      setLab(labRes.data)
      setTests(testsRes.data ?? [])
    }).finally(() => setLoading(false))
  }, [labId])

  useEffect(() => {
    if (!labId) return
    setSlotsLoading(true)
    supabase
      .from('lab_slots')
      .select('*')
      .eq('lab_id', labId)
      .eq('date', selectedDate)
      .order('start_time')
      .then(({ data }) => setSlots(data ?? []))
      .finally(() => setSlotsLoading(false))
  }, [labId, selectedDate])

  const handleBook = async () => {
    if (!selectedTest) { Alert.alert('Select a test', 'Please choose a lab test.'); return }
    if (!selectedSlot) { Alert.alert('Select a slot', 'Please choose a time slot.'); return }
    if (!profile) return

    setBooking(true)
    try {
      const { data: appt, error } = await supabase
        .from('appointments')
        .insert({
          patient_id: profile.id,
          appointment_type: 'lab',
          status: 'confirmed',
          date: selectedDate,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          lab_id: labId,
          lab_slot_id: selectedSlot.id,
          lab_test_id: selectedTest.id,
          patient_name: profile.full_name,
          patient_phone: profile.phone,
        })
        .select()
        .single()

      if (error) throw error

      // Increment booked count
      await supabase
        .from('lab_slots')
        .update({ booked_count: selectedSlot.booked_count + 1 })
        .eq('id', selectedSlot.id)

      Alert.alert('Booked!', `Your lab test is confirmed for ${FMT_TIME(selectedSlot.start_time)}.`, [
        { text: 'View Appointments', onPress: () => router.replace('/(patient)/appointments') },
      ])
    } catch (e: any) {
      Alert.alert('Booking failed', e.message)
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{lab?.name ?? 'Book Lab Test'}</Text>
          <Text style={styles.headerSub}>{lab?.address}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Select Test */}
        <Text style={styles.sectionLabel}>SELECT TEST</Text>
        {tests.length === 0 ? (
          <Text style={styles.emptyText}>No tests available at this lab.</Text>
        ) : (
          tests.map(test => (
            <TouchableOpacity
              key={test.id}
              style={[styles.testCard, selectedTest?.id === test.id && styles.testCardSelected]}
              onPress={() => setSelectedTest(test)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.testName, selectedTest?.id === test.id && styles.testNameSelected]}>
                  {test.name}
                </Text>
                {test.description ? (
                  <Text style={styles.testDesc}>{test.description}</Text>
                ) : null}
                <Text style={styles.testMeta}>
                  Result in ~{test.result_time_hours}h
                  {test.preparation_info ? ` · ${test.preparation_info}` : ''}
                </Text>
              </View>
              <Text style={[styles.testPrice, selectedTest?.id === test.id && styles.testPriceSelected]}>
                ₹{test.price}
              </Text>
            </TouchableOpacity>
          ))
        )}

        {/* Select Date */}
        <Text style={styles.sectionLabel}>SELECT DATE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
          {DAYS.map(d => {
            const iso = FMT_DATE(d)
            const active = iso === selectedDate
            return (
              <TouchableOpacity
                key={iso}
                style={[styles.dateChip, active && styles.dateChipActive]}
                onPress={() => { setSelectedDate(iso); setSelectedSlot(null) }}
              >
                <Text style={[styles.dateText, active && styles.dateTextActive]}>{FMT_DISPLAY(d)}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Select Time Slot */}
        <Text style={styles.sectionLabel}>SELECT TIME SLOT</Text>
        {slotsLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
        ) : slots.length === 0 ? (
          <Text style={styles.emptyText}>No slots available for this date.</Text>
        ) : (
          <View style={styles.slotGrid}>
            {slots.map(slot => {
              const full = slot.booked_count >= slot.capacity
              const active = selectedSlot?.id === slot.id
              return (
                <TouchableOpacity
                  key={slot.id}
                  style={[styles.slotBtn, active && styles.slotBtnActive, full && styles.slotBtnFull]}
                  onPress={() => !full && setSelectedSlot(slot)}
                  disabled={full}
                >
                  <Text style={[styles.slotText, active && styles.slotTextActive, full && styles.slotTextFull]}>
                    {FMT_TIME(slot.start_time)}
                  </Text>
                  {full && <Text style={styles.fullLabel}>Full</Text>}
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        {/* Summary */}
        {selectedTest && selectedSlot && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Test</Text>
              <Text style={styles.summaryValue}>{selectedTest.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>{selectedDate}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Time</Text>
              <Text style={styles.summaryValue}>{FMT_TIME(selectedSlot.start_time)}</Text>
            </View>
            <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.summaryLabel}>Fee</Text>
              <Text style={[styles.summaryValue, { color: Colors.primary, fontWeight: '800' }]}>
                ₹{selectedTest.price}
              </Text>
            </View>
          </View>
        )}

        {/* Confirm Button */}
        <TouchableOpacity
          style={[styles.confirmBtn, (!selectedTest || !selectedSlot) && styles.confirmBtnDisabled]}
          onPress={handleBook}
          disabled={!selectedTest || !selectedSlot || booking}
        >
          {booking
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.confirmText}>Confirm Lab Booking</Text>
          }
        </TouchableOpacity>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primaryDark, flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  backBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backArrow: { color: '#fff', fontSize: 18 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.sub, letterSpacing: 0.5, textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  emptyText: { color: Colors.muted, fontSize: 13, paddingHorizontal: 16, paddingBottom: 12 },
  testCard: { marginHorizontal: 16, marginBottom: 8, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: '#fff', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  testCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  testName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  testNameSelected: { color: Colors.primary },
  testDesc: { fontSize: 12, color: Colors.sub, marginTop: 2 },
  testMeta: { fontSize: 11, color: Colors.muted, marginTop: 3 },
  testPrice: { fontSize: 16, fontWeight: '800', color: Colors.text },
  testPriceSelected: { color: Colors.primary },
  dateRow: { paddingHorizontal: 16, gap: 8 },
  dateChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: '#fff' },
  dateChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  dateText: { fontSize: 12, fontWeight: '600', color: Colors.text },
  dateTextActive: { color: '#fff' },
  slotGrid: { paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotBtn: { width: '30%', paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: '#fff', alignItems: 'center' },
  slotBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  slotBtnFull: { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb' },
  slotText: { fontSize: 12, fontWeight: '600', color: Colors.text },
  slotTextActive: { color: '#fff', fontWeight: '700' },
  slotTextFull: { color: '#d1d5db' },
  fullLabel: { fontSize: 9, color: '#d1d5db', marginTop: 2 },
  summaryCard: { margin: 16, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: '#fff', overflow: 'hidden' },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: '#fff', backgroundColor: Colors.primaryDark, padding: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  summaryLabel: { fontSize: 13, color: Colors.sub },
  summaryValue: { fontSize: 13, fontWeight: '700', color: Colors.text },
  confirmBtn: { marginHorizontal: 16, marginTop: 4, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
