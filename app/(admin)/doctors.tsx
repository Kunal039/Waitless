import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

interface Doctor {
  id: number;
  emoji: string;
  avatarBg: string;
  name: string;
  specialization: string;
  shift: string;
  room: string;
}

const DOCTORS: Doctor[] = [
  {
    id: 1,
    emoji: '👩‍⚕️',
    avatarBg: '#dbeafe',
    name: 'Dr. Priya Sharma',
    specialization: 'General Medicine',
    shift: 'Morning',
    room: 'Room 1',
  },
  {
    id: 2,
    emoji: '👨‍⚕️',
    avatarBg: '#ede9fe',
    name: 'Dr. Amit Patel',
    specialization: 'Cardiology',
    shift: 'Morning',
    room: 'Room 2',
  },
  {
    id: 3,
    emoji: '👩‍⚕️',
    avatarBg: '#fce7f3',
    name: 'Dr. Sunita Roy',
    specialization: 'Dermatology',
    shift: 'Afternoon',
    room: 'Room 3',
  },
  {
    id: 4,
    emoji: '👨‍⚕️',
    avatarBg: '#dcfce7',
    name: 'Dr. Ravi Kumar',
    specialization: 'Orthopedics',
    shift: 'Morning',
    room: 'Room 4',
  },
  {
    id: 5,
    emoji: '👩‍⚕️',
    avatarBg: '#fff3e0',
    name: 'Dr. Meera Singh',
    specialization: 'ENT',
    shift: 'Afternoon',
    room: 'Room 5',
  },
];

const INITIAL_AVAILABILITY: Record<number, boolean> = {
  1: true,
  2: true,
  3: false,
  4: true,
  5: false,
};

export default function DoctorsScreen() {
  const [availability, setAvailability] = useState<Record<number, boolean>>(
    INITIAL_AVAILABILITY
  );

  const toggleAvailability = (id: number) => {
    setAvailability((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Doctor Management</Text>
          <Text style={styles.headerSubtitle}>4 Active · 2 On Leave</Text>
        </View>

        {/* Add Button */}
        <View style={styles.addButtonContainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => Alert.alert('Add Doctor', 'Feature coming soon')}
          >
            <Text style={styles.addButtonText}>+ Add New Doctor</Text>
          </TouchableOpacity>
        </View>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>All Doctors</Text>

        {/* Doctor List */}
        <View style={styles.listContainer}>
          {DOCTORS.map((doctor) => (
            <View key={doctor.id} style={styles.doctorCard}>
              <View
                style={[styles.avatarCircle, { backgroundColor: doctor.avatarBg }]}
              >
                <Text style={styles.avatarEmoji}>{doctor.emoji}</Text>
              </View>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{doctor.name}</Text>
                <Text style={styles.doctorSpec}>{doctor.specialization}</Text>
                <Text style={styles.doctorShift}>
                  Shift: {doctor.shift} · {doctor.room}
                </Text>
              </View>
              <Switch
                value={availability[doctor.id]}
                onValueChange={() => toggleAvailability(doctor.id)}
                trackColor={{ false: '#ccc', true: Colors.green }}
                thumbColor="#ffffff"
              />
            </View>
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
  addButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  addButton: {
    backgroundColor: '#312e81',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 16,
  },
  doctorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  doctorSpec: {
    fontSize: 13,
    color: Colors.primary,
    marginBottom: 2,
  },
  doctorShift: {
    fontSize: 12,
    color: Colors.sub,
  },
});
