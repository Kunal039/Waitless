import React from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { useBooking } from '../../lib/context/BookingContext'

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, valueColor ? { color: valueColor } : null]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  )
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
    gap: 16,
  },
  label: {
    fontSize: 13,
    color: Colors.muted,
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
})

export default function AppointmentSummaryScreen() {
  const router = useRouter()
  const { booking } = useBooking()
  const { hospital, doctor, selectedDate, selectedSlotTime, patientInfo } = booking

  if (!hospital || !doctor || !selectedDate || !selectedSlotTime || !patientInfo) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Booking data missing. Please start over.</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => router.push('/(patient)/home')}
          >
            <Text style={styles.retryText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const fee = doctor.consultation_fee

  function formatDateDisplay(dateStr: string): string {
    const d = new Date(dateStr)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment Summary</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hospital banner */}
        <View style={styles.hospitalBanner}>
          <View style={styles.hospitalBannerOverlay}>
            <Text style={styles.hospitalBannerEmoji}>{hospital.image_emoji ?? '🏥'}</Text>
            <View style={styles.hospitalBannerInfo}>
              <Text style={styles.hospitalBannerName}>{hospital.name}</Text>
              <Text style={styles.hospitalBannerAddress}>{hospital.address}, {hospital.city}</Text>
            </View>
          </View>
        </View>

        {/* Details card */}
        <View style={styles.detailsCard}>
          <Row label="Doctor" value={`${doctor.full_name}`} />
          <Row label="Specialization" value={doctor.specialization} />
          <Row label="Patient" value={patientInfo.name} />
          <Row label="Age / Gender" value={`${patientInfo.age} yrs · ${patientInfo.gender}`} />
          <Row label="Mobile" value={patientInfo.phone} />
          <Row label="Date" value={formatDateDisplay(selectedDate)} />
          <Row label="Time" value={selectedSlotTime} />
          <Row label="Reason" value={patientInfo.reason} />
          <Row
            label="Consultation Fee"
            value={`₹${fee}`}
            valueColor={Colors.green}
          />
        </View>

        {/* Total box */}
        <View style={styles.totalCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Consultation Fee</Text>
            <Text style={styles.totalValue}>₹{fee}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Booking Fee</Text>
            <Text style={styles.totalValue}>₹0</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>Total Amount</Text>
            <Text style={styles.grandTotalValue}>₹{fee}</Text>
          </View>
        </View>

        <View style={styles.noticeBanner}>
          <Text style={styles.noticeIcon}>ℹ️</Text>
          <Text style={styles.noticeText}>
            Please arrive 10–15 minutes early. Carry any previous medical records if applicable.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={() => router.push('/(patient)/payment')}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>Confirm & Book Token</Text>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 14,
  },
  hospitalBanner: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 16,
    overflow: 'hidden',
  },
  hospitalBannerOverlay: {
    backgroundColor: 'rgba(18,40,204,0.85)',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  hospitalBannerEmoji: {
    fontSize: 40,
  },
  hospitalBannerInfo: {
    flex: 1,
  },
  hospitalBannerName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
  },
  hospitalBannerAddress: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
  detailsCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  totalCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    padding: 16,
    gap: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    color: Colors.sub,
  },
  totalValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  totalDivider: {
    height: 1,
    backgroundColor: '#BBF7D0',
    marginVertical: 4,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.green,
  },
  noticeBanner: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noticeIcon: {
    fontSize: 16,
  },
  noticeText: {
    fontSize: 13,
    color: Colors.sub,
    lineHeight: 20,
    flex: 1,
  },
  footer: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 16,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
})
