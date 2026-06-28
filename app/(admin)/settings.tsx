import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

interface SettingsItem {
  iconBg: string;
  emoji: string;
  title: string;
  subtitle: string;
}

const SETTINGS_ITEMS: SettingsItem[] = [
  {
    iconBg: '#dbeafe',
    emoji: '🏥',
    title: 'Hospital Profile',
    subtitle: 'Name, address, contact',
  },
  {
    iconBg: '#ede9fe',
    emoji: '🕐',
    title: 'OPD Timings',
    subtitle: 'Mon–Sat · 9:00 AM – 6:00 PM',
  },
  {
    iconBg: '#dcfce7',
    emoji: '💰',
    title: 'Consultation Fees',
    subtitle: 'General: ₹300 · Specialist: ₹500',
  },
  {
    iconBg: '#fef9c3',
    emoji: '🔔',
    title: 'Notifications',
    subtitle: 'SMS, push alerts to patients',
  },
  {
    iconBg: '#fce7f3',
    emoji: '👥',
    title: 'Staff Accounts',
    subtitle: '3 reception staff accounts',
  },
  {
    iconBg: '#fff3e0',
    emoji: '🎫',
    title: 'Token System',
    subtitle: 'Auto-reset daily at midnight',
  },
  {
    iconBg: '#f1f5f9',
    emoji: '📱',
    title: 'App Appearance',
    subtitle: 'Theme, logo, colours',
  },
];

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hospital Settings</Text>
          <Text style={styles.headerSubtitle}>ABC Hospital Configuration</Text>
        </View>

        {/* Settings Card */}
        <View style={styles.settingsCard}>
          {SETTINGS_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.title}
              style={[
                styles.settingsItem,
                index < SETTINGS_ITEMS.length - 1 && styles.settingsItemBorder,
              ]}
              onPress={() => Alert.alert(item.title, `Opening ${item.title}...`)}
            >
              <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
                <Text style={styles.iconEmoji}>{item.emoji}</Text>
              </View>
              <View style={styles.itemTextContainer}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: '#1e1b4b',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#a5b4fc',
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconEmoji: {
    fontSize: 20,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 12,
    color: Colors.sub,
  },
  chevron: {
    fontSize: 22,
    color: '#9ca3af',
    fontWeight: '300',
  },
});
