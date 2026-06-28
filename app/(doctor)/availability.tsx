import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from '../../constants/colors'
import { useAuth } from '../../lib/context/AuthContext'
import { getDoctorByUserId, getDoctorSlots } from '../../lib/api/doctors'
import { supabase } from '../../lib/supabase'
import { Doctor, DoctorSlot } from '../../types'

// ---- helpers ----

function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

// 30-min increments 09:00 – 18:00
function generateTimeOptions(): string[] {
  const times: string[] = []
  for (let h = 9; h <= 18; h++) {
    times.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 18) times.push(`${String(h).padStart(2, '0')}:30`)
  }
  return times
}

const TIME_OPTIONS = generateTimeOptions()
const DURATION_OPTIONS = [15, 30, 45, 60]

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  const nh = Math.floor(total / 60)
  const nm = total % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}

// ---- Add Slot Modal ----

interface AddSlotModalProps {
  visible: boolean
  onClose: () => void
  onSave: (startTime: string, endTime: string) => Promise<void>
  saving: boolean
}

function AddSlotModal({ visible, onClose, onSave, saving }: AddSlotModalProps) {
  const [selectedTime, setSelectedTime] = useState('09:00')
  const [selectedDuration, setSelectedDuration] = useState(30)

  async function handleSave() {
    const endTime = addMinutes(selectedTime, selectedDuration)
    await onSave(selectedTime, endTime)
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={addSlotStyles.overlay}>
        <View style={addSlotStyles.sheet}>
          <View style={addSlotStyles.handle} />
          <View style={addSlotStyles.header}>
            <Text style={addSlotStyles.title}>Add Time Slot</Text>
            <TouchableOpacity
              style={addSlotStyles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={addSlotStyles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={addSlotStyles.sectionLabel}>START TIME</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={addSlotStyles.timeRow}
          >
            {TIME_OPTIONS.map(t => (
              <TouchableOpacity
                key={t}
                style={[
                  addSlotStyles.timeChip,
                  selectedTime === t && addSlotStyles.timeChipActive,
                ]}
                onPress={() => setSelectedTime(t)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    addSlotStyles.timeChipText,
                    selectedTime === t && addSlotStyles.timeChipTextActive,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[addSlotStyles.sectionLabel, { marginTop: 16 }]}>DURATION</Text>
          <View style={addSlotStyles.durationRow}>
            {DURATION_OPTIONS.map(d => (
              <TouchableOpacity
                key={d}
                style={[
                  addSlotStyles.durationChip,
                  selectedDuration === d && addSlotStyles.durationChipActive,
                ]}
                onPress={() => setSelectedDuration(d)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    addSlotStyles.durationChipText,
                    selectedDuration === d && addSlotStyles.durationChipTextActive,
                  ]}
                >
                  {d} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={addSlotStyles.previewRow}>
            <Text style={addSlotStyles.previewLabel}>Slot: </Text>
            <Text style={addSlotStyles.previewValue}>
              {selectedTime} – {addMinutes(selectedTime, selectedDuration)}
            </Text>
          </View>

          <TouchableOpacity
            style={addSlotStyles.saveBtn}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={addSlotStyles.saveBtnText}>Add Slot</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const addSlotStyles = StyleSheet.create({
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
    marginBottom: 20,
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.sub,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  timeRow: {
    gap: 8,
    paddingRight: 16,
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  timeChipActive: {
    backgroundColor: '#0E8070',
    borderColor: '#0E8070',
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.sub,
  },
  timeChipTextActive: {
    color: '#FFFFFF',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  durationChipActive: {
    backgroundColor: '#0E8070',
    borderColor: '#0E8070',
  },
  durationChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.sub,
  },
  durationChipTextActive: {
    color: '#FFFFFF',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
    backgroundColor: '#D0F5F3',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  previewLabel: {
    fontSize: 14,
    color: Colors.sub,
    fontWeight: '600',
  },
  previewValue: {
    fontSize: 14,
    color: '#0E8070',
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#0E8070',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
})

// ---- Main Screen ----

export default function DoctorAvailabilityScreen() {
  const { profile } = useAuth()
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()))
  const [slots, setSlots] = useState<DoctorSlot[]>([])
  const [slotsWithDates, setSlotsWithDates] = useState<Set<string>>(new Set())
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [savingSlot, setSavingSlot] = useState(false)
  const [availableToday, setAvailableToday] = useState(true)
  const [togglingAvailability, setTogglingAvailability] = useState(false)

  useEffect(() => {
    const init = async () => {
      if (!profile?.id) return
      const doc = await getDoctorByUserId(profile.id)
      setDoctor(doc)
      if (doc) setAvailableToday(doc.is_available)
    }
    init()
  }, [profile?.id])

  const loadSlots = useCallback(async () => {
    if (!doctor) return
    try {
      setLoadingSlots(true)
      const data = await getDoctorSlots(doctor.id, selectedDate)
      setSlots(data)
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load slots')
    } finally {
      setLoadingSlots(false)
    }
  }, [doctor, selectedDate])

  useEffect(() => {
    loadSlots()
  }, [loadSlots])

  // Load all dates in current month that have slots
  useEffect(() => {
    if (!doctor) return
    const loadMonthSlots = async () => {
      const firstDay = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-01`
      const lastDay = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(getDaysInMonth(calendarYear, calendarMonth)).padStart(2, '0')}`
      const { data } = await supabase
        .from('doctor_slots')
        .select('date')
        .eq('doctor_id', doctor.id)
        .gte('date', firstDay)
        .lte('date', lastDay)
      if (data) {
        setSlotsWithDates(new Set(data.map((r: any) => r.date)))
      }
    }
    loadMonthSlots()
  }, [doctor, calendarYear, calendarMonth])

  async function handleAddSlot(startTime: string, endTime: string) {
    if (!doctor) return
    try {
      setSavingSlot(true)
      const { error } = await supabase.from('doctor_slots').insert({
        doctor_id: doctor.id,
        date: selectedDate,
        start_time: startTime,
        end_time: endTime,
        is_booked: false,
      })
      if (error) throw error
      setAddModalVisible(false)
      await loadSlots()
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to add slot')
    } finally {
      setSavingSlot(false)
    }
  }

  async function handleDeleteSlot(slotId: string) {
    Alert.alert('Delete Slot', 'Remove this time slot?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('doctor_slots')
              .delete()
              .eq('id', slotId)
            if (error) throw error
            await loadSlots()
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Failed to delete slot')
          }
        },
      },
    ])
  }

  async function handleToggleAvailability(value: boolean) {
    if (!doctor) return
    try {
      setTogglingAvailability(true)
      const { error } = await supabase
        .from('doctors')
        .update({ is_available: value })
        .eq('id', doctor.id)
      if (error) throw error
      setAvailableToday(value)
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to update availability')
    } finally {
      setTogglingAvailability(false)
    }
  }

  // Build calendar grid
  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth)
  const firstDayOfWeek = getFirstDayOfMonth(calendarYear, calendarMonth)
  const todayStr = toDateString(new Date())

  const calendarCells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Availability</Text>
          <Text style={styles.headerSub}>Manage your schedule & time slots</Text>
        </View>

        {/* Available Today toggle */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleLeft}>
            <Text style={styles.toggleLabel}>Available Today</Text>
            <Text style={styles.toggleSub}>Patients can book appointments</Text>
          </View>
          {togglingAvailability ? (
            <ActivityIndicator size="small" color={Colors.teal} />
          ) : (
            <Switch
              value={availableToday}
              onValueChange={handleToggleAvailability}
              trackColor={{ false: Colors.border, true: Colors.teal }}
              thumbColor={Colors.card}
            />
          )}
        </View>

        {/* Calendar */}
        <View style={styles.calendarCard}>
          {/* Month navigation */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              style={styles.calNavBtn}
              onPress={() => {
                if (calendarMonth === 0) {
                  setCalendarMonth(11)
                  setCalendarYear(y => y - 1)
                } else {
                  setCalendarMonth(m => m - 1)
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.calNavBtnText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.calMonthLabel}>
              {MONTH_NAMES[calendarMonth]} {calendarYear}
            </Text>
            <TouchableOpacity
              style={styles.calNavBtn}
              onPress={() => {
                if (calendarMonth === 11) {
                  setCalendarMonth(0)
                  setCalendarYear(y => y + 1)
                } else {
                  setCalendarMonth(m => m + 1)
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.calNavBtnText}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Day names */}
          <View style={styles.dayNamesRow}>
            {DAY_NAMES.map(d => (
              <Text key={d} style={styles.dayName}>{d}</Text>
            ))}
          </View>

          {/* Day cells */}
          <View style={styles.daysGrid}>
            {calendarCells.map((day, idx) => {
              if (!day) {
                return <View key={`empty-${idx}`} style={styles.dayCell} />
              }
              const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDate
              const hasSlots = slotsWithDates.has(dateStr)
              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    isToday && !isSelected && styles.dayCellToday,
                  ]}
                  onPress={() => setSelectedDate(dateStr)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayCellText,
                      isSelected && styles.dayCellTextSelected,
                      isToday && !isSelected && styles.dayCellTextToday,
                    ]}
                  >
                    {day}
                  </Text>
                  {hasSlots && (
                    <View
                      style={[
                        styles.slotDot,
                        isSelected && styles.slotDotSelected,
                      ]}
                    />
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Slots for selected date */}
        <View style={styles.slotsSection}>
          <View style={styles.slotsSectionHeader}>
            <Text style={styles.slotsSectionTitle}>
              SLOTS FOR{' '}
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <TouchableOpacity
              style={styles.addSlotBtn}
              onPress={() => setAddModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.addSlotBtnText}>+ Add Slot</Text>
            </TouchableOpacity>
          </View>

          {loadingSlots ? (
            <View style={styles.slotsLoading}>
              <ActivityIndicator size="small" color={Colors.teal} />
            </View>
          ) : slots.length === 0 ? (
            <View style={styles.slotsEmpty}>
              <Text style={styles.slotsEmptyEmoji}>🗓</Text>
              <Text style={styles.slotsEmptyText}>No slots for this day</Text>
              <Text style={styles.slotsEmptySub}>Tap "Add Slot" to create time slots</Text>
            </View>
          ) : (
            <View style={styles.slotsList}>
              {slots.map(slot => (
                <View key={slot.id} style={styles.slotItem}>
                  <View
                    style={[
                      styles.slotTimeBadge,
                      slot.is_booked && styles.slotTimeBadgeBooked,
                    ]}
                  >
                    <Text
                      style={[
                        styles.slotTimeText,
                        slot.is_booked && styles.slotTimeTextBooked,
                      ]}
                    >
                      {slot.start_time}
                    </Text>
                  </View>
                  <View style={styles.slotInfo}>
                    <Text style={styles.slotRange}>
                      {slot.start_time} – {slot.end_time}
                    </Text>
                    <Text
                      style={[
                        styles.slotStatus,
                        { color: slot.is_booked ? Colors.orange : Colors.green },
                      ]}
                    >
                      {slot.is_booked ? 'Booked' : 'Available'}
                    </Text>
                  </View>
                  {!slot.is_booked && (
                    <TouchableOpacity
                      style={styles.deleteSlotBtn}
                      onPress={() => handleDeleteSlot(slot.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.deleteSlotBtnText}>🗑</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <AddSlotModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSave={handleAddSlot}
        saving={savingSlot}
      />
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
    paddingBottom: 32,
  },
  header: {
    backgroundColor: '#0E8070',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  // Toggle card
  toggleCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLeft: {
    flex: 1,
    paddingRight: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  toggleSub: {
    fontSize: 12,
    color: Colors.muted,
  },
  // Calendar
  calendarCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calNavBtnText: {
    fontSize: 18,
    color: Colors.text,
    fontWeight: '700',
  },
  calMonthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 0.3,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  dayCellSelected: {
    backgroundColor: '#0E8070',
  },
  dayCellToday: {
    backgroundColor: '#D0F5F3',
  },
  dayCellText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  dayCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayCellTextToday: {
    color: '#0E8070',
    fontWeight: '700',
  },
  slotDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.teal,
    position: 'absolute',
    bottom: 4,
  },
  slotDotSelected: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  // Slots section
  slotsSection: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  slotsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  slotsSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.sub,
    letterSpacing: 0.5,
  },
  addSlotBtn: {
    backgroundColor: '#0E8070',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  addSlotBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  slotsLoading: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  slotsEmpty: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  slotsEmptyEmoji: {
    fontSize: 36,
  },
  slotsEmptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  slotsEmptySub: {
    fontSize: 12,
    color: Colors.muted,
    textAlign: 'center',
  },
  slotsList: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  slotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  slotTimeBadge: {
    backgroundColor: '#D0F5F3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexShrink: 0,
  },
  slotTimeBadgeBooked: {
    backgroundColor: '#FFF3E0',
  },
  slotTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E8070',
    fontVariant: ['tabular-nums'],
  },
  slotTimeTextBooked: {
    color: Colors.orange,
  },
  slotInfo: {
    flex: 1,
  },
  slotRange: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
    marginBottom: 2,
  },
  slotStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteSlotBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  deleteSlotBtnText: {
    fontSize: 16,
  },
})
