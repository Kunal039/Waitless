import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { signOut } from '../../lib/auth'
import { Colors } from '../../constants'

// TODO: Implement with actual design
// Shows: lab info, address, opening hours, edit details, logout
export default function LabProfileScreen() {
  async function handleLogout() {
    await signOut()
    router.replace('/(auth)/welcome')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lab Profile</Text>
      <Text style={styles.placeholder}>Lab profile — to be implemented</Text>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: Colors.background },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary, marginTop: 48, marginBottom: 16 },
  placeholder: { color: Colors.textMuted, marginBottom: 48 },
  logoutBtn: { backgroundColor: Colors.error, padding: 16, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: Colors.white, fontWeight: '600' },
})
