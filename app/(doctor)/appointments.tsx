import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants'

// TODO: Implement with actual design
// Shows: date filter, appointment list with patient name, time, status, confirm/cancel actions
export default function DoctorAppointmentsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Appointments</Text>
      <Text style={styles.placeholder}>Doctor appointments list — to be implemented</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: Colors.background },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary, marginTop: 48, marginBottom: 16 },
  placeholder: { color: Colors.textMuted },
})
