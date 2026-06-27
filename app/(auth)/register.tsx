import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { createUserProfile } from '../../lib/auth'
import { UserRole } from '../../types'
import { Colors } from '../../constants'

// TODO: Replace with actual design
export default function RegisterScreen() {
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('patient')
  const [loading, setLoading] = useState(false)

  const roles: { label: string; value: UserRole }[] = [
    { label: 'Patient', value: 'patient' },
    { label: 'Doctor', value: 'doctor' },
    { label: 'Lab Admin', value: 'lab_admin' },
  ]

  async function handleRegister() {
    if (!fullName.trim()) return Alert.alert('Error', 'Please enter your full name')
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return Alert.alert('Error', 'Session expired. Please login again.') }

    const { error } = await createUserProfile(user.id, fullName.trim(), role, user.phone ?? undefined, user.email ?? undefined)
    setLoading(false)
    if (error) return Alert.alert('Error', error.message)

    if (role === 'doctor') router.replace('/(doctor)/dashboard')
    else if (role === 'lab_admin') router.replace('/(lab)/dashboard')
    else router.replace('/(patient)/home')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Profile</Text>
      <Text style={styles.label}>Full Name</Text>
      <TextInput style={styles.input} placeholder="Your full name" value={fullName} onChangeText={setFullName} />
      <Text style={styles.label}>I am a...</Text>
      <View style={styles.roleRow}>
        {roles.map(r => (
          <TouchableOpacity
            key={r.value}
            style={[styles.roleBtn, role === r.value && styles.roleBtnActive]}
            onPress={() => setRole(r.value)}
          >
            <Text style={[styles.roleBtnText, role === r.value && styles.roleBtnTextActive]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Continue'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: Colors.white },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 32 },
  label: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 24 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  roleBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  roleBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  roleBtnText: { color: Colors.textSecondary, fontWeight: '500' },
  roleBtnTextActive: { color: Colors.white },
  button: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
})
