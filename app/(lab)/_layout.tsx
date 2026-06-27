import { Tabs } from 'expo-router'
import { Colors } from '../../constants'

export default function LabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: Colors.labAccent,
      tabBarInactiveTintColor: Colors.textMuted,
    }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="appointments" options={{ title: 'Bookings' }} />
      <Tabs.Screen name="tests" options={{ title: 'Tests' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  )
}
