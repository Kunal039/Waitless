import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants'

// TODO: Implement with actual design
// Shows: list of lab tests, add/edit/toggle availability for each test
export default function LabTestsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Tests</Text>
      <Text style={styles.placeholder}>Lab test management — to be implemented</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: Colors.background },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary, marginTop: 48, marginBottom: 16 },
  placeholder: { color: Colors.textMuted },
})
