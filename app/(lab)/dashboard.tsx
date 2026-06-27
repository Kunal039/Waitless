import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants'

// TODO: Implement with actual design
// Shows: today's booking count, revenue summary, upcoming bookings list
export default function LabDashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lab Dashboard</Text>
      <Text style={styles.placeholder}>Lab dashboard — to be implemented</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: Colors.background },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary, marginTop: 48, marginBottom: 16 },
  placeholder: { color: Colors.textMuted },
})
