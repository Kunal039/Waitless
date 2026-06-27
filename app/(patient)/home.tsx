import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants'

// TODO: Implement with actual design
// Shows: greeting, upcoming appointment card, quick action buttons (Book Doctor, Book Lab Test)
export default function PatientHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.placeholder}>Patient home screen — to be implemented</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: Colors.background },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary, marginTop: 48, marginBottom: 16 },
  placeholder: { color: Colors.textMuted },
})
