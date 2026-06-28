import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';

const RECEPTION_BLUE = '#0052CC';
const RECEPTION_BLUE_LIGHT = '#DDEEFF';
const INACTIVE_COLOR = '#8C9BAB';
const TAB_BG = '#FFFFFF';
const TAB_BORDER = '#E0E6F0';

const TABS = [
  { name: 'dashboard', label: 'Dashboard', emoji: '🏥' },
  { name: 'queue', label: 'Queue', emoji: '🎫' },
  { name: 'register-patient', label: 'Register', emoji: '➕' },
  { name: 'appointments', label: 'Appts', emoji: '📋' },
  { name: 'checkin', label: 'Check-in', emoji: '✓' },
];

function ReceptionTabBar({ state, navigation }: { state: any; navigation: any }) {
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
            <Text style={[styles.label, isFocused && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function ReceptionLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <ReceptionTabBar {...props} />}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="queue" />
      <Tabs.Screen name="register-patient" />
      <Tabs.Screen name="appointments" />
      <Tabs.Screen name="checkin" />
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
    backgroundColor: RECEPTION_BLUE_LIGHT,
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
    color: RECEPTION_BLUE,
    fontWeight: '700',
  },
});
