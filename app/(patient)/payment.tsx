import React, { useState } from 'react'
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
import { useBooking } from '../../lib/context/BookingContext'
import { createAppointment, createQueueToken } from '../../lib/api/appointments'
import { markSlotBooked } from '../../lib/api/doctors'

interface PaymentMethod {
  id: string
  icon: string
  title: string
  subtitle: string
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'upi', icon: '📱', title: 'UPI', subtitle: 'Pay with Google Pay, PhonePe, Paytm' },
  { id: 'card', icon: '💳', title: 'Credit / Debit Card', subtitle: 'Visa, Mastercard, Rupay' },
  { id: 'netbanking', icon: '🏦', title: 'Net Banking', subtitle: 'All major banks supported' },
  { id: 'wallet', icon: '👛', title: 'Wallet', subtitle: 'Paytm, Amazon Pay, Freecharge' },
]

export default function PaymentScreen() {
  const router = useRouter()
  const { session } = useAuth()
  const { booking, setPaymentMethod, resetBooking } = useBooking()
  const { hospital, doctor, selectedDate, selectedSlotId, selectedSlotTime, patientInfo, paymentMethod } = booking

  const [selectedMethod, setSelectedMethod] = useState<string>(paymentMethod ?? 'upi')
  const [paying, setPaying] = useState(false)

  const fee = doctor?.consultation_fee ?? 0

  async function handlePay() {
    if (!hospital || !doctor || !selectedDate || !selectedSlotId || !selectedSlotTime || !patientInfo) {
      Alert.alert('Error', 'Booking data is incomplete. Please start over.')
      return
    }
    if (!session?.user) {
      Alert.alert('Error', 'You are not logged in.')
      return
    }

    try {
      setPaying(true)
      setPaymentMethod(selectedMethod)

      // 1. Create appointment
      const appointment = await createAppointment({
        patient_id: session.user.id,
        hospital_id: hospital.id,
        doctor_id: doctor.id,
        doctor_slot_id: selectedSlotId,
        date: selectedDate,
        start_time: selectedSlotTime.split(' – ')[0] ?? '',
        end_time: selectedSlotTime.split(' – ')[1] ?? '',
        patient_name: patientInfo.name,
        patient_age: Number(patientInfo.age),
        patient_gender: patientInfo.gender,
        patient_phone: patientInfo.phone,
        reason: patientInfo.reason,
      })

      // 2. Create queue token
      const tokenNumber = await createQueueToken({
        appointment_id: appointment.id,
        hospital_id: hospital.id,
        doctor_id: doctor.id,
        date: selectedDate,
      })

      // 3. Mark slot as booked
      await markSlotBooked(selectedSlotId)

      // Navigate to confirmation
      router.replace({
        pathname: '/(patient)/booking-confirmed',
        params: { appointmentId: appointment.id, tokenNumber: String(tokenNumber) },
      })
    } catch (e: any) {
      Alert.alert('Payment Failed', e.message ?? 'Something went wrong. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  if (!hospital || !doctor || !patientInfo) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Booking data missing. Please start over.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.push('/(patient)/home')}>
            <Text style={styles.retryText}>Go Home</Text>
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
        <Text style={styles.headerTitle}>Select Payment</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount banner */}
        <View style={styles.amountBanner}>
          <Text style={styles.amountLabel}>Total Amount to Pay</Text>
          <Text style={styles.amountValue}>₹{fee}</Text>
          <Text style={styles.amountSub}>
            {doctor.full_name} · {patientInfo.name}
          </Text>
        </View>

        {/* Payment methods */}
        <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
        <View style={styles.methodsList}>
          {PAYMENT_METHODS.map(method => {
            const isSelected = selectedMethod === method.id
            return (
              <TouchableOpacity
                key={method.id}
                style={[styles.methodCard, isSelected && styles.methodCardSelected]}
                onPress={() => setSelectedMethod(method.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.methodIcon}>{method.icon}</Text>
                <View style={styles.methodInfo}>
                  <Text style={[styles.methodTitle, isSelected && styles.methodTitleSelected]}>
                    {method.title}
                  </Text>
                  <Text style={styles.methodSub}>{method.subtitle}</Text>
                </View>
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Security note */}
        <View style={styles.securityNote}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>
            Payments are secured with 256-bit SSL encryption. Your card details are never stored.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Paying</Text>
          <Text style={styles.footerTotalAmount}>₹{fee}</Text>
        </View>
        <TouchableOpacity
          style={[styles.payBtn, paying && styles.payBtnDisabled]}
          onPress={handlePay}
          disabled={paying}
          activeOpacity={0.85}
        >
          {paying ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.payBtnText}>🔒  Pay Securely</Text>
          )}
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
  },
  // Amount banner
  amountBanner: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.white,
    marginBottom: 6,
    fontVariant: ['tabular-nums'],
  },
  amountSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.sub,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  methodsList: {
    gap: 10,
    marginBottom: 16,
  },
  methodCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  methodCardSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  methodIcon: {
    fontSize: 28,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  methodTitleSelected: {
    color: Colors.primary,
  },
  methodSub: {
    fontSize: 12,
    color: Colors.muted,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  securityNote: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  securityIcon: {
    fontSize: 16,
  },
  securityText: {
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 18,
    flex: 1,
  },
  footer: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  footerTotal: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: 11,
    color: Colors.muted,
    marginBottom: 2,
  },
  footerTotalAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.green,
  },
  payBtn: {
    flex: 2.5,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnDisabled: {
    backgroundColor: Colors.muted,
  },
  payBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
})
