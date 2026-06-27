import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../lib/supabase'
import { Colors } from '../constants'

export default function Index() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // User is logged in — get their role and redirect
        supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.role === 'doctor') router.replace('/(doctor)/dashboard')
            else if (data?.role === 'lab_admin') router.replace('/(lab)/dashboard')
            else router.replace('/(patient)/home')
          })
      } else {
        router.replace('/(auth)/welcome')
      }
    })
  }, [])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  )
}
