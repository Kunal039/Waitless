import { View, Text, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Colors } from '../../constants'

// TODO: Implement with actual design
// Shows: lab info, test selection list, slot picker, confirm booking button
export default function BookLabScreen() {
  const { labId } = useLocalSearchParams<{ labId: string }>()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book Lab Test</Text>
      <Text style={styles.placeholder}>Lab booking flow for {labId} — to be implemented</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: Colors.background },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary, marginTop: 48, marginBottom: 16 },
  placeholder: { color: Colors.textMuted },
})
