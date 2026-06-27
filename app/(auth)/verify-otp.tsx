import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { verifyOtp, getUserProfile } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { Colors } from '../../constants'

// TODO: Replace with actual design
export default function VerifyOtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>()
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleVerify() {
    if (!otp || otp.length < 6) return Alert.alert('Error', 'Enter the 6-digit OTP')
    setLoading(true)
    const { data, error } = await verifyOtp(phone, otp)
    if (error) { setLoading(false); return Alert.alert('Error', error.message) }

    // Check if profile exists
    const { data: profile } = await getUserProfile(data.user!.id)
    setLoading(false)

    if (!profile) {
      router.replace('/(auth)/register')
    } else {
      if (profile.role === 'doctor') router.replace('/(doctor)/dashboard')
      else if (profile.role === 'lab_admin') router.replace('/(lab)/dashboard')
      else router.replace('/(patient)/home')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.subtitle}>Sent to {phone}</Text>
      <TextInput
        style={styles.input}
        placeholder="6-digit OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
      />
      <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: Colors.white },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 32 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 14, fontSize: 24, letterSpacing: 8, textAlign: 'center', marginBottom: 24 },
  button: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
})
