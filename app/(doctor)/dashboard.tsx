import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants'

// TODO: Implement with actual design
// Shows: today's appointment count, next appointment card, quick stats
export default function DoctorDashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Doctor Dashboard</Text>
      <Text style={styles.placeholder}>Doctor dashboard — to be implemented</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: Colors.background },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary, marginTop: 48, marginBottom: 16 },
  placeholder: { color: Colors.textMuted },
})
