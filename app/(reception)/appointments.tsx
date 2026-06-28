import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Colors from '../../constants/colors';

type Status = 'done' | 'in_room' | 'waiting';

interface Appointment {
  token: number;
  name: string;
  doctor: string;
  reason: string;
  time: string;
  status: Status;
}

const APPOINTMENTS: Appointment[] = [
  { token: 14, name: 'Anita Sharma', doctor: 'Dr. Priya', reason: 'Checkup', time: '09:30', status: 'done' },
  { token: 15, name: 'Raman Verma', doctor: 'Dr. Priya', reason: 'Fever', time: '10:00', status: 'in_room' },
  { token: 16, name: 'Sunita Devi', doctor: 'Dr. Amit', reason: 'Cough', time: '10:45', status: 'waiting' },
  { token: 17, name: 'Ramesh Kumar', doctor: 'Dr. Amit', reason: 'Checkup', time: '11:00', status: 'waiting' },
  { token: 18, name: 'Meera Patel', doctor: 'Dr. Sunita', reason: 'Follow-up', time: '11:15', status: 'waiting' },
  { token: 19, name: 'Arjun Singh', doctor: 'Dr. Priya', reason: 'Back pain', time: '11:30', status: 'waiting' },
];

const FILTERS = [
  { label: 'All', count: 42 },
  { label: 'Waiting', count: 7 },
  { label: 'In Room', count: 1 },
  { label: 'Done', count: 18 },
];

const STATUS_CONFIG: Record<Status, { badge: object; pill: object; text: string; pillText: object }> = {
  in_room: {
    badge: { backgroundColor: '#dcfce7' },
    pill: { backgroundColor: '#dcfce7' },
    text: 'In Room',
    pillText: { color: '#16a34a' },
  },
  waiting: {
    badge: { backgroundColor: '#fef9c3' },
    pill: { backgroundColor: '#fef9c3' },
    text: 'Waiting',
    pillText: { color: '#856404' },
  },
  done: {
    badge: { backgroundColor: '#f1f5f9' },
    pill: { backgroundColor: '#f1f5f9' },
    text: 'Done',
    pillText: { color: '#6b7280' },
  },
};

export default function AppointmentsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{'← Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Today's Appointments</Text>
        <Text style={styles.headerSubtitle}>{today} · 42 Total</Text>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search patient..."
          placeholderTextColor={Colors.sub}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
        style={styles.filterScroll}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.label}
            style={[styles.filterTab, activeFilter === f.label && styles.filterTabActive]}
            onPress={() => setActiveFilter(f.label)}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === f.label && styles.filterTabTextActive,
              ]}
            >
              {f.label} ({f.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.listContent}>
        {APPOINTMENTS.map((appt) => {
          const config = STATUS_CONFIG[appt.status];
          return (
            <View key={appt.token} style={styles.appointmentCard}>
              <View style={styles.cardLeft}>
                <View style={[styles.tokenBadge, config.badge]}>
                  <Text style={[styles.tokenBadgeText, config.pillText]}>#{appt.token}</Text>
                </View>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.patientName}>{appt.name}</Text>
                  <Text style={styles.appointmentMeta}>
                    {appt.doctor} · {appt.reason} · {appt.time}
                  </Text>
                </View>
              </View>
              <View style={[styles.statusPill, config.pill]}>
                <Text style={[styles.statusPillText, config.pillText]}>{config.text}</Text>
              </View>
            </View>
          );
        })}
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
    backgroundColor: '#003380',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  backButton: {
    marginBottom: 8,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.85,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#FFFFFF',
    fontSize: 13,
    opacity: 0.8,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 10,
  },
  filterScroll: {
    marginTop: 12,
    maxHeight: 48,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  filterTab: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  filterTabActive: {
    backgroundColor: '#0052CC',
    borderColor: '#0052CC',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 3,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenBadge: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 12,
    minWidth: 46,
    alignItems: 'center',
  },
  tokenBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  appointmentInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  appointmentMeta: {
    fontSize: 12,
    color: Colors.sub,
    marginTop: 2,
  },
  statusPill: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
