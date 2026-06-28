import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { getDoctorSlots } from '../../lib/api/doctors'
import { useBooking } from '../../lib/context/BookingContext'
import { DoctorSlot } from '../../types'

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getDayLabel(d: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[d.getDay()]
}

function getMonthLabel(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[d.getMonth()]
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

export default function BookDoctorScreen() {
  const router = useRouter()
  const { booking, setDateSlot } = useBooking()
  const doctor = booking.doctor

  const today = new Date()
  const dateOptions: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return d
  })

  const [selectedDate, setSelectedDate] = useState<string>(formatDate(today))
  const [slots, setSlots] = useState<DoctorSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<DoctorSlot | null>(null)

  const loadSlots = useCallback(async (date: string) => {
    if (!doctor) return
    try {
      setLoadingSlots(true)
      setSlotsError(null)
      setSelectedSlot(null)
      const data = await getDoctorSlots(doctor.id, date)
      setSlots(data)
    } catch (e: any) {
      setSlotsError(e.message ?? 'Failed to load slots')
    } finally {
      setLoadingSlots(false)
    }
  }, [doctor])

  useEffect(() => {
    loadSlots(selectedDate)
  }, [selectedDate, loadSlots])

  function handleContinue() {
    if (!selectedSlot) return
    const slotTime = `${formatTime(selectedSlot.start_time)} – ${formatTime(selectedSlot.end_time)}`
    setDateSlot(selectedDate, selectedSlot.id, slotTime)
    router.push('/(patient)/patient-info')
  }

  if (!doctor) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>No doctor selected. Please go back.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Select Date & Time</Text>
          <Text style={styles.headerSub}>{doctor.full_name} · {doctor.specialization}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date selection */}
        <Text style={styles.sectionLabel}>SELECT DATE</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dateScroll}
          contentContainerStyle={styles.dateScrollContent}
        >
          {dateOptions.map((d, idx) => {
            const dateStr = formatDate(d)
            const isSelected = selectedDate === dateStr
            const isToday = idx === 0
            const isTomorrow = idx === 1
            return (
              <TouchableOpacity
                key={dateStr}
                style={[styles.datePill, isSelected && styles.datePillSelected]}
                onPress={() => setSelectedDate(dateStr)}
                activeOpacity={0.8}
              >
                <Text style={[styles.datePillDay, isSelected && styles.datePillDaySelected]}>
                  {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : getDayLabel(d)}
                </Text>
                <Text style={[styles.datePillDate, isSelected && styles.datePillDateSelected]}>
                  {d.getDate()} {getMonthLabel(d)}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Time slot selection */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>SELECT TIME SLOT</Text>

        {loadingSlots ? (
          <View style={styles.slotsLoading}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.slotsLoadingText}>Loading available slots...</Text>
          </View>
        ) : slotsError ? (
          <View style={styles.slotsError}>
            <Text style={styles.slotsErrorText}>{slotsError}</Text>
            <TouchableOpacity onPress={() => loadSlots(selectedDate)}>
              <Text style={styles.retryLink}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : slots.length === 0 ? (
          <View style={styles.noSlots}>
            <Text style={styles.noSlotsEmoji}>📅</Text>
            <Text style={styles.noSlotsTitle}>No slots available</Text>
            <Text style={styles.noSlotsSub}>Try another date</Text>
          </View>
        ) : (
          <View style={styles.slotsGrid}>
            {slots.map(slot => {
              const isBooked = slot.is_booked
              const isSelected = selectedSlot?.id === slot.id
              return (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.slotBtn,
                    isBooked && styles.slotBtnBooked,
                    isSelected && styles.slotBtnSelected,
                  ]}
                  onPress={() => !isBooked && setSelectedSlot(slot)}
                  disabled={isBooked}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.slotTime,
                    isBooked && styles.slotTimeBooked,
                    isSelected && styles.slotTimeSelected,
                  ]}>
                    {formatTime(slot.start_time)}
                  </Text>
                  {isBooked && <Text style={styles.slotBookedLabel}>Full</Text>}
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        {selectedSlot && (
          <View style={styles.selectedSlotBanner}>
            <Text style={styles.selectedSlotIcon}>✓</Text>
            <Text style={styles.selectedSlotText}>
              {formatTime(selectedSlot.start_time)} – {formatTime(selectedSlot.end_time)} on {selectedDate}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, !selectedSlot && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!selectedSlot}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>Continue →</Text>
        </TouchableOpacity>
      </View>
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
  },
  errorText: {
    fontSize: 15,
    color: Colors.red,
    textAlign: 'center',
    marginBottom: 16,
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
  header: {
    backgroundColor: Colors.primaryDark,
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
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
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.sub,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  dateScroll: {
    marginHorizontal: -16,
  },
  dateScrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  datePill: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    minWidth: 76,
  },
  datePillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  datePillDay: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.sub,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  datePillDaySelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  datePillDate: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  datePillDateSelected: {
    color: Colors.white,
  },
  slotsLoading: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  slotsLoadingText: {
    fontSize: 13,
    color: Colors.muted,
  },
  slotsError: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  slotsErrorText: {
    fontSize: 14,
    color: Colors.red,
    textAlign: 'center',
  },
  retryLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  noSlots: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  noSlotsEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  noSlotsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  noSlotsSub: {
    fontSize: 13,
    color: Colors.muted,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotBtn: {
    width: '31%',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  slotBtnBooked: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    opacity: 0.6,
  },
  slotBtnSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  slotTime: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  slotTimeBooked: {
    color: Colors.muted,
  },
  slotTimeSelected: {
    color: Colors.white,
  },
  slotBookedLabel: {
    fontSize: 10,
    color: Colors.muted,
    marginTop: 2,
  },
  selectedSlotBanner: {
    marginTop: 16,
    backgroundColor: '#EEF9F2',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  selectedSlotIcon: {
    fontSize: 16,
    color: Colors.green,
    fontWeight: '800',
  },
  selectedSlotText: {
    fontSize: 14,
    color: Colors.green,
    fontWeight: '600',
    flex: 1,
  },
  footer: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 16,
  },
  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  continueBtnDisabled: {
    backgroundColor: Colors.muted,
  },
  continueBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
})
