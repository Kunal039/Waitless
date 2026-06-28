import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors } from '../../../constants/colors'
import { getDoctorById } from '../../../lib/api/doctors'
import { useBooking } from '../../../lib/context/BookingContext'
import { Doctor } from '../../../types'

export default function DoctorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { setDoctor, booking } = useBooking()

  const [doctor, setDoctorState] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const d = await getDoctorById(id)
        if (!d) throw new Error('Doctor not found')
        setDoctorState(d)
      } catch (e: any) {
        setError(e.message ?? 'Failed to load doctor')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  function handleBookAppointment() {
    if (!doctor) return
    setDoctor(doctor)
    router.push('/(patient)/book-doctor')
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  if (error || !doctor) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? 'Doctor not found'}</Text>
          <TouchableOpacity style={styles.backFallbackBtn} onPress={() => router.back()}>
            <Text style={styles.backFallbackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Gradient header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerBody}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>{doctor.avatar_emoji ?? '👨‍⚕️'}</Text>
          </View>
          <Text style={styles.doctorName}>{doctor.full_name}</Text>
          <Text style={styles.specialization}>{doctor.specialization}</Text>
          <Text style={styles.qualification}>{doctor.qualification}</Text>
          <View style={[styles.availBadge, { backgroundColor: doctor.is_available ? 'rgba(22,163,74,0.18)' : 'rgba(151,160,175,0.18)' }]}>
            <View style={[styles.availDot, { backgroundColor: doctor.is_available ? Colors.green : Colors.muted }]} />
            <Text style={[styles.availText, { color: doctor.is_available ? Colors.green : Colors.muted }]}>
              {doctor.is_available ? 'Available Today' : 'Unavailable'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{doctor.experience_years}</Text>
            <Text style={styles.statUnit}>Years</Text>
            <Text style={styles.statLabel}>Experience</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{doctor.consultation_fee}</Text>
            <Text style={styles.statUnit}> </Text>
            <Text style={styles.statLabel}>Fee</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{doctor.room_number ?? 'TBD'}</Text>
            <Text style={styles.statUnit}> </Text>
            <Text style={styles.statLabel}>Room</Text>
          </View>
        </View>

        {/* Shift timing */}
        <View style={styles.shiftCard}>
          <Text style={styles.shiftIcon}>🕐</Text>
          <View style={styles.shiftInfo}>
            <Text style={styles.shiftLabel}>SHIFT HOURS</Text>
            <Text style={styles.shiftTime}>
              {doctor.shift_start ?? '--:--'} – {doctor.shift_end ?? '--:--'}
            </Text>
          </View>
        </View>

        {/* About */}
        <View style={styles.aboutCard}>
          <Text style={styles.sectionLabel}>ABOUT</Text>
          <Text style={styles.aboutText}>
            {doctor.full_name} is a specialist in {doctor.specialization} with {doctor.experience_years} years of experience.
            Holding {doctor.qualification}, they provide expert consultation to patients in a compassionate and professional environment.
            {doctor.is_available
              ? ` Currently available for appointments at Room ${doctor.room_number ?? 'TBD'}.`
              : ' Currently not available for new appointments.'}
          </Text>
        </View>

        {/* Hospital info if available */}
        {booking.hospital && (
          <View style={styles.hospitalCard}>
            <Text style={styles.sectionLabel}>HOSPITAL</Text>
            <View style={styles.hospitalRow}>
              <Text style={styles.hospitalEmoji}>{booking.hospital.image_emoji ?? '🏥'}</Text>
              <View style={styles.hospitalInfo}>
                <Text style={styles.hospitalName}>{booking.hospital.name}</Text>
                <Text style={styles.hospitalAddress}>{booking.hospital.address}, {booking.hospital.city}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.feePreview}>
          <Text style={styles.feeLabel}>Consultation Fee</Text>
          <Text style={styles.feeAmount}>₹{doctor.consultation_fee}</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookBtn, !doctor.is_available && styles.bookBtnDisabled]}
          onPress={handleBookAppointment}
          disabled={!doctor.is_available}
          activeOpacity={0.85}
        >
          <Text style={styles.bookBtnText}>
            {doctor.is_available ? 'Book Appointment' : 'Unavailable'}
          </Text>
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
    fontSize: 16,
    color: Colors.red,
    textAlign: 'center',
    marginBottom: 16,
  },
  backFallbackBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 14,
  },
  backFallbackText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  // Header
  header: {
    backgroundColor: Colors.primaryDark,
    paddingTop: 8,
    paddingBottom: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backBtnText: {
    color: Colors.white,
    fontSize: 18,
    lineHeight: 22,
  },
  headerBody: {
    alignItems: 'center',
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarEmoji: {
    fontSize: 44,
  },
  doctorName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
    textAlign: 'center',
  },
  specialization: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
  },
  qualification: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 12,
    textAlign: 'center',
  },
  availBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  availDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  availText: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  statUnit: {
    fontSize: 11,
    color: Colors.muted,
    height: 14,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.sub,
    fontWeight: '600',
  },
  shiftCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  shiftIcon: {
    fontSize: 28,
  },
  shiftInfo: {
    flex: 1,
  },
  shiftLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  shiftTime: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  aboutCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.sub,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  aboutText: {
    fontSize: 14,
    color: Colors.sub,
    lineHeight: 22,
  },
  hospitalCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 14,
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hospitalEmoji: {
    fontSize: 32,
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  hospitalAddress: {
    fontSize: 12,
    color: Colors.muted,
  },
  // Bottom bar
  bottomBar: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  feePreview: {
    flex: 1,
  },
  feeLabel: {
    fontSize: 11,
    color: Colors.muted,
    fontWeight: '500',
    marginBottom: 2,
  },
  feeAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.green,
  },
  bookBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  bookBtnDisabled: {
    backgroundColor: Colors.muted,
  },
  bookBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
})
