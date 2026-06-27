import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants'

// TODO: Implement with actual design
// Shows: search bar, filter (Doctor / Lab), list of results with cards
export default function PatientSearchScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search</Text>
      <Text style={styles.placeholder}>Search doctors and labs — to be implemented</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: Colors.background },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary, marginTop: 48, marginBottom: 16 },
  placeholder: { color: Colors.textMuted },
})
