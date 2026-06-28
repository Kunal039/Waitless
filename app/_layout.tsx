import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { PaperProvider } from 'react-native-paper'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '../lib/context/AuthContext'
import { BookingProvider } from '../lib/context/BookingContext'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AuthProvider>
          <BookingProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(patient)" />
              <Stack.Screen name="(doctor)" />
              <Stack.Screen name="(lab)" />
              <Stack.Screen name="(reception)" />
              <Stack.Screen name="(admin)" />
            </Stack>
            <StatusBar style="auto" />
          </BookingProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  )
}
