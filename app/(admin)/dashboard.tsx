import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

const BAR_DATA = [
  { day: 'Mon', value: 18 },
  { day: 'Tue', value: 24 },
  { day: 'Wed', value: 15 },
  { day: 'Thu', value: 28 },
  { day: 'Fri', value: 22 },
  { day: 'Sat', value: 12 },
  { day: 'Sun', value: 0 },
];

const MAX_VALUE = 28;
const MAX_HEIGHT = 80;

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>ABC Hospital · June 2026</Text>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { backgroundColor: '#0052CC' }]}>
              <Text style={styles.metricValue}>246</Text>
              <Text style={styles.metricLabel}>Patients This Month</Text>
              <Text style={styles.metricChange}>↑ 12% vs last month</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: '#1228CC' }]}>
              <Text style={styles.metricValue}>₹1.2L</Text>
              <Text style={styles.metricLabel}>Monthly Revenue</Text>
              <Text style={styles.metricChange}>↑ 8% vs last month</Text>
            </View>
          </View>
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { backgroundColor: '#b45309' }]}>
              <Text style={styles.metricValue}>4</Text>
              <Text style={styles.metricLabel}>Active Doctors</Text>
              <Text style={styles.metricChange}>2 on leave this week</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: '#6d28d9' }]}>
              <Text style={styles.metricValue}>4.6★</Text>
              <Text style={styles.metricLabel}>Avg. Rating</Text>
              <Text style={styles.metricChange}>From 230 reviews</Text>
            </View>
          </View>
        </View>

        {/* Bar Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Weekly Patients</Text>
          <View style={styles.barsContainer}>
            {BAR_DATA.map((item) => {
              const barHeight = MAX_VALUE > 0 ? (item.value / MAX_VALUE) * MAX_HEIGHT : 0;
              return (
                <View key={item.day} style={styles.barWrapper}>
                  <Text style={styles.barNumber}>{item.value > 0 ? item.value : ''}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: Colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{item.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: '#ede9fe' }]}
              onPress={() => router.push('/(admin)/doctors')}
            >
              <Text style={styles.actionEmoji}>👨‍⚕️</Text>
              <Text style={styles.actionLabel}>Doctors</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: '#dbeafe' }]}
              onPress={() => router.push('/(admin)/reports')}
            >
              <Text style={styles.actionEmoji}>📈</Text>
              <Text style={styles.actionLabel}>Reports</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: '#fef9c3' }]}
              onPress={() => router.push('/(admin)/settings')}
            >
              <Text style={styles.actionEmoji}>⚙️</Text>
              <Text style={styles.actionLabel}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: '#dcfce7' }]}
              onPress={() => router.push('/(admin)/departments')}
            >
              <Text style={styles.actionEmoji}>🏥</Text>
              <Text style={styles.actionLabel}>Departments</Text>
            </TouchableOpacity>
          </View>
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
  metricsGrid: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#ffffff',
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 10,
    color: '#c7d2fe',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 16,
    marginTop: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  barNumber: {
    fontSize: 10,
    color: Colors.sub,
    marginBottom: 2,
    height: 14,
  },
  barTrack: {
    height: MAX_HEIGHT,
    width: '60%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    minHeight: 2,
  },
  barLabel: {
    fontSize: 10,
    color: Colors.sub,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  actionsGrid: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
});
