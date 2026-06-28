import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';

const ADMIN_PURPLE = '#312e81';
const ADMIN_PURPLE_LIGHT = '#ede9fe';
const INACTIVE_COLOR = '#8C9BAB';
const TAB_BG = '#FFFFFF';
const TAB_BORDER = '#E0E6F0';

const TABS = [
  { name: 'dashboard', label: 'Dashboard', emoji: '📊' },
  { name: 'doctors', label: 'Doctors', emoji: '👨‍⚕️' },
  { name: 'reports', label: 'Reports', emoji: '📈' },
  { name: 'departments', label: 'Depts', emoji: '🏥' },
  { name: 'settings', label: 'Settings', emoji: '⚙️' },
];

function AdminTabBar({ state, navigation }: { state: any; navigation: any }) {
  return (
    <View style={styles.tabBar}>
      {TABS.map((tab, index) => {
        const isFocused = state.index === index;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => navigation.navigate(tab.name)}
            activeOpacity={0.75}
          >
            <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
              <Text style={styles.emoji}>{tab.emoji}</Text>
            </View>
            <Text style={[styles.label, isFocused && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <AdminTabBar {...props} />}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="doctors" />
      <Tabs.Screen name="reports" />
      <Tabs.Screen name="departments" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: TAB_BG,
    borderTopWidth: 1,
    borderTopColor: TAB_BORDER,
    paddingTop: 6,
    paddingBottom: 10,
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  iconWrap: {
    width: 38,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: ADMIN_PURPLE_LIGHT,
  },
  emoji: {
    fontSize: 17,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: INACTIVE_COLOR,
  },
  labelActive: {
    color: ADMIN_PURPLE,
    fontWeight: '700',
  },
});
