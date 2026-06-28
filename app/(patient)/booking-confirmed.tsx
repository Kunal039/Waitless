import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { useBooking } from '../../lib/context/BookingContext'

export default function BookingConfirmedScreen() {
  const router = useRouter()
  const { appointmentId, tokenNumber } = useLocalSearchParams<{ appointmentId: string; tokenNumber: string }>()
  const { booking, resetBooking } = useBooking()

  const scaleAnim = useRef(new Animated.Value(0)).current
  const opacityAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(40)).current

  useEffect(() => {
    Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start()
  }, [scaleAnim, opacityAnim, slideAnim])

  const { hospital, doctor, selectedDate, selectedSlotTime } = booking

  function formatDateDisplay(dateStr: string | null): string {
    if (!dateStr) return '--'
    const d = new Date(dateStr)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  }

  function handleViewQueue() {
    if (!appointmentId) {
      Alert.alert('Error', 'Appointment ID not found.')
      return
    }
    resetBooking()
    router.push(`/(patient)/queue/${appointmentId}`)
  }

  function handleDownload() {
    Alert.alert('Download', 'Receipt download feature coming soon.')
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Top section */}
        <View style={styles.topSection}>
          {/* Check circle */}
          <Animated.View
            style={[
              styles.checkCircle,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            <Text style={styles.checkIcon}>✓</Text>
          </Animated.View>

          <Animated.View style={{ opacity: opacityAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.successTitle}>Appointment Booked{'\n'}Successfully!</Text>
            <Text style={styles.successSub}>
              Your token has been assigned and your slot is confirmed
            </Text>
          </Animated.View>

          {/* Token box */}
          <Animated.View
            style={[
              styles.tokenBox,
              { opacity: opacityAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.tokenLabel}>YOUR TOKEN</Text>
            <Text style={styles.tokenNumber}>#{tokenNumber ?? '--'}</Text>
            <Text style={styles.tokenNote}>Show this at reception</Text>
          </Animated.View>
        </View>

        {/* Details card */}
        <Animated.View
          style={[
            styles.detailsCard,
            { opacity: opacityAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📅</Text>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDateDisplay(selectedDate)}</Text>
            </View>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🕐</Text>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{selectedSlotTime ?? '--'}</Text>
            </View>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🏥</Text>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Hospital</Text>
              <Text style={styles.detailValue}>{hospital?.name ?? '--'}</Text>
            </View>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>👨‍⚕️</Text>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Doctor</Text>
              <Text style={styles.detailValue}>{doctor?.full_name ?? '--'}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Buttons */}
        <Animated.View
          style={[
            styles.buttonsRow,
            { opacity: opacityAnim },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={handleViewQueue}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryActionText}>View Live Queue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={handleDownload}
            activeOpacity={0.85}
          >
            <Text style={styles.outlineBtnText}>Download ↓</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  checkIcon: {
    fontSize: 48,
    color: Colors.white,
    fontWeight: '800',
    lineHeight: 56,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 10,
  },
  successSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  tokenBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  tokenLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  tokenNumber: {
    fontSize: 52,
    fontWeight: '900',
    color: Colors.white,
    lineHeight: 60,
    fontVariant: ['tabular-nums'],
  },
  tokenNote: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 8,
  },
  detailsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 4,
    width: '100%',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  detailIcon: {
    fontSize: 22,
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: Colors.muted,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.background,
    marginHorizontal: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  primaryActionBtn: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryActionText: {
    color: Colors.primaryDark,
    fontSize: 15,
    fontWeight: '700',
  },
  outlineBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  outlineBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
})
