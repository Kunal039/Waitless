import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants'

// TODO: Implement with actual design
// Shows: calendar, add slot button, existing slots list with delete option
export default function DoctorAvailabilityScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Availability</Text>
      <Text style={styles.placeholder}>Slot management — to be implemented</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: Colors.background },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary, marginTop: 48, marginBottom: 16 },
  placeholder: { color: Colors.textMuted },
})
