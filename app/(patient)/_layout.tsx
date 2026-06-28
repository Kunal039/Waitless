import { Tabs } from 'expo-router'
import { Text, StyleSheet, View } from 'react-native'
import { Colors } from '../../constants/colors'

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
      <Text style={styles.iconText}>{emoji}</Text>
    </View>
  )
}

export default function PatientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.muted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
      <Tabs.Screen name="hospitals/[id]" options={{ href: null }} />
      <Tabs.Screen name="doctors/[id]" options={{ href: null }} />
      <Tabs.Screen name="book-doctor" options={{ href: null }} />
      <Tabs.Screen name="patient-info" options={{ href: null }} />
      <Tabs.Screen name="appointment-summary" options={{ href: null }} />
      <Tabs.Screen name="payment" options={{ href: null }} />
      <Tabs.Screen name="booking-confirmed" options={{ href: null }} />
      <Tabs.Screen name="queue/[appointmentId]" options={{ href: null }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  iconWrapper: {
    width: 32,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconWrapperActive: {
    backgroundColor: Colors.primaryLight,
  },
  iconText: {
    fontSize: 18,
  },
})
