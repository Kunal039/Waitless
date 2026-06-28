import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#312e81',
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>📊</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="doctors"
        options={{
          title: 'Doctors',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>👨‍⚕️</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>📈</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>⚙️</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="departments"
        options={{
          title: 'Depts',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>🏥</Text>
          ),
        }}
      />
    </Tabs>
  );
}
