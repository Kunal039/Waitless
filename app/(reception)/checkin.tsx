import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Colors from '../../constants/colors';

interface Patient {
  name: string;
  token: number;
  doctor: string;
  time: string;
  prominent: boolean;
}

const PATIENTS: Patient[] = [
  { name: 'Kunal Mittal', token: 22, doctor: 'Dr. Rajesh', time: '11:30 AM', prominent: true },
  { name: 'Priya Sharma', token: 23, doctor: 'Dr. Amit', time: '11:45 AM', prominent: false },
  { name: 'Ravi Verma', token: 24, doctor: 'Dr. Sunita', time: '12:00 PM', prominent: false },
];

export default function CheckinScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const handleCheckIn = (name: string) => {
    Alert.alert('Checked In', `${name} checked in successfully!`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{'← Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Check-in</Text>
        <Text style={styles.headerSubtitle}>Scan or search to check in</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.qrBox}>
          <Text style={styles.qrEmoji}>📱</Text>
          <Text style={styles.qrTitle}>Scan Patient QR Code</Text>
          <Text style={styles.qrSubtitle}>Or search by name / mobile below</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or mobile..."
            placeholderTextColor={Colors.sub}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <Text style={styles.sectionTitle}>Search Results</Text>

        {PATIENTS.map((patient) => (
          <View
            key={patient.token}
            style={[styles.patientCard, patient.prominent && styles.patientCardProminent]}
          >
            <View style={styles.cardContent}>
              <View style={[styles.avatarCircle, patient.prominent && styles.avatarCircleProminent]}>
                <Text style={styles.avatarEmoji}>👤</Text>
              </View>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{patient.name}</Text>
                <Text style={styles.patientMeta}>
                  Token #{patient.token} · {patient.doctor} · {patient.time}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.checkInButton,
                patient.prominent ? styles.checkInButtonProminent : styles.checkInButtonDefault,
              ]}
              onPress={() => handleCheckIn(patient.name)}
            >
              <Text
                style={[
                  styles.checkInButtonText,
                  patient.prominent
                    ? styles.checkInButtonTextProminent
                    : styles.checkInButtonTextDefault,
                ]}
              >
                {patient.prominent ? 'Check In ✓' : 'Check In'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
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
    fontSize: 14,
    opacity: 0.8,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  qrBox: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    marginBottom: 20,
  },
  qrEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  qrTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  qrSubtitle: {
    fontSize: 13,
    color: Colors.sub,
    textAlign: 'center',
  },
  searchContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  searchInput: {
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 3,
  },
  patientCardProminent: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarCircleProminent: {
    backgroundColor: '#16a34a',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  patientMeta: {
    fontSize: 13,
    color: Colors.sub,
    marginTop: 3,
  },
  checkInButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  checkInButtonProminent: {
    backgroundColor: '#16a34a',
  },
  checkInButtonDefault: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkInButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  checkInButtonTextProminent: {
    color: '#FFFFFF',
  },
  checkInButtonTextDefault: {
    color: Colors.sub,
  },
});
