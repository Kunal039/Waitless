import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { router } from 'expo-router'
import { signInWithPhone } from '../../lib/auth'
import { Colors } from '../../constants'

// TODO: Replace with actual design
export default function LoginScreen() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSendOtp() {
    if (!phone) return Alert.alert('Error', 'Please enter your phone number')
    setLoading(true)
    const { error } = await signInWithPhone(phone)
    setLoading(false)
    if (error) return Alert.alert('Error', error.message)
    router.push({ pathname: '/(auth)/verify-otp', params: { phone } })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        placeholder="+91 9876543210"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoFocus
      />
      <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Send OTP'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: Colors.white },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 32 },
  label: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 24 },
  button: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
})
