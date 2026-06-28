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

export default function DoctorLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.teal,
        tabBarInactiveTintColor: Colors.muted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏥" focused={focused} />,
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
        name="availability"
        options={{
          title: 'Availability',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🗓" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
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
    backgroundColor: '#D0F5F3',
  },
  iconText: {
    fontSize: 18,
  },
})
