import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function ReceptionLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0052CC',
        tabBarInactiveTintColor: '#4A5080',
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>🏥</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="queue"
        options={{
          title: 'Queue',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>🎫</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="register"
        options={{
          title: 'Register',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>➕</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>📋</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="checkin"
        options={{
          title: 'Check-in',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>✓</Text>
          ),
        }}
      />
    </Tabs>
  );
}
