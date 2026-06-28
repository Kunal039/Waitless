import { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '../lib/context/AuthContext'
import { Colors } from '../constants/colors'

export default function Index() {
  const { session, profile, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!session) {
      router.replace('/(auth)/welcome')
      return
    }

    if (!profile) {
      router.replace('/(auth)/register')
      return
    }

    switch (profile.role) {
      case 'doctor':     router.replace('/(doctor)/dashboard'); break
      case 'lab_admin':  router.replace('/(lab)/dashboard'); break
      case 'reception':  router.replace('/(reception)/dashboard'); break
      case 'admin':      router.replace('/(admin)/dashboard'); break
      default:           router.replace('/(patient)/home'); break
    }
  }, [loading, session, profile])

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
})
