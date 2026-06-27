import { Tabs } from 'expo-router'
import { Colors } from '../../constants'

export default function DoctorLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: Colors.doctorAccent,
      tabBarInactiveTintColor: Colors.textMuted,
    }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="appointments" options={{ title: 'Appointments' }} />
      <Tabs.Screen name="availability" options={{ title: 'Availability' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  )
}
