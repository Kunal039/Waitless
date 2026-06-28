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
import { getHospitalById } from '../../../lib/api/hospitals'
import { getDoctorsByHospital } from '../../../lib/api/doctors'
import { useBooking } from '../../../lib/context/BookingContext'
import { Hospital, Doctor } from '../../../types'

export default function HospitalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { setHospital, setDoctor } = useBooking()

  const [hospital, setHospitalState] = useState<Hospital | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const [h, d] = await Promise.all([
          getHospitalById(id),
          getDoctorsByHospital(id),
        ])
        if (!h) throw new Error('Hospital not found')
        setHospitalState(h)
        setDoctors(d)
      } catch (e: any) {
        setError(e.message ?? 'Failed to load hospital')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  function handleBookDoctor(doctor: Doctor) {
    if (!hospital) return
    setHospital(hospital)
    setDoctor(doctor)
    router.push(`/(patient)/doctors/${doctor.id}`)
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

  if (error || !hospital) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? 'Hospital not found'}</Text>
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
        <View style={styles.headerMeta}>
          <Text style={styles.hospitalEmoji}>{hospital.image_emoji ?? '🏥'}</Text>
          <Text style={styles.hospitalName} numberOfLines={2}>{hospital.name}</Text>
          <Text style={styles.hospitalAddress} numberOfLines={2}>{hospital.address}, {hospital.city}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.starIcon}>★</Text>
            <Text style={styles.ratingText}>{hospital.rating?.toFixed(1) ?? 'N/A'}</Text>
            <Text style={styles.reviewText}>({hospital.total_reviews ?? 0} reviews)</Text>
            <View style={styles.dividerDot} />
            <Text style={styles.timingText}>
              {hospital.opening_time ?? '09:00'} – {hospital.closing_time ?? '18:00'}
            </Text>
          </View>
        </View>
      </View>

      {/* Doctor list */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>DOCTORS AT THIS HOSPITAL</Text>

        {doctors.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🩺</Text>
            <Text style={styles.emptyTitle}>No doctors available</Text>
            <Text style={styles.emptySubtitle}>Check back later for available appointments</Text>
          </View>
        ) : (
          doctors.map(doctor => (
            <View key={doctor.id} style={styles.doctorCard}>
              <View style={styles.doctorTop}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarEmoji}>{doctor.avatar_emoji ?? '👨‍⚕️'}</Text>
                </View>
                <View style={styles.doctorInfo}>
                  <View style={styles.doctorNameRow}>
                    <Text style={styles.doctorName}>{doctor.full_name}</Text>
                    <View style={[styles.availDot, { backgroundColor: doctor.is_available ? Colors.green : Colors.muted }]} />
                  </View>
                  <Text style={styles.specialization}>{doctor.specialization}</Text>
                  <Text style={styles.qualification}>{doctor.qualification}</Text>
                </View>
              </View>

              <View style={styles.doctorStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{doctor.experience_years}y</Text>
                  <Text style={styles.statLabel}>Experience</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>₹{doctor.consultation_fee}</Text>
                  <Text style={styles.statLabel}>Fee</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{doctor.shift_start ?? '--'}</Text>
                  <Text style={styles.statLabel}>Shift start</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{doctor.shift_end ?? '--'}</Text>
                  <Text style={styles.statLabel}>Shift end</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.bookBtn}
                onPress={() => handleBookDoctor(doctor)}
                activeOpacity={0.85}
              >
                <Text style={styles.bookBtnText}>Book Appointment</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
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
  },
  errorText: {
    fontSize: 16,
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
    fontSize: 15,
  },
  // Header (gradient-style using solid primaryDark background)
  header: {
    backgroundColor: Colors.primaryDark,
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  backBtnText: {
    color: Colors.white,
    fontSize: 18,
    lineHeight: 22,
  },
  headerMeta: {
    alignItems: 'flex-start',
  },
  hospitalEmoji: {
    fontSize: 44,
    marginBottom: 8,
  },
  hospitalName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    lineHeight: 28,
    marginBottom: 4,
  },
  hospitalAddress: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 10,
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starIcon: {
    color: Colors.yellow,
    fontSize: 14,
  },
  ratingText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  reviewText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
  },
  dividerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  timingText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
  },
  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.sub,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 32,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
  },
  // Doctor card
  doctorCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 14,
  },
  doctorTop: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarEmoji: {
    fontSize: 30,
  },
  doctorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  doctorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  availDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  specialization: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  qualification: {
    fontSize: 12,
    color: Colors.muted,
  },
  doctorStats: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 14,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.muted,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  bookBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  bookBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
})
