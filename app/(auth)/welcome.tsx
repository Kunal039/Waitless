import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { Colors } from '../../constants'

// TODO: Replace with actual design
export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>WaitLess</Text>
      <Text style={styles.subtitle}>Appointments for Hospitals & Labs</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/(auth)/login')}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white, padding: 24 },
  title: { fontSize: 36, fontWeight: 'bold', color: Colors.primary, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.textSecondary, marginBottom: 48, textAlign: 'center' },
  button: { backgroundColor: Colors.primary, paddingVertical: 16, paddingHorizontal: 48, borderRadius: 12 },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
})
