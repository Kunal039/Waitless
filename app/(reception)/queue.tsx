import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Colors from '../../constants/colors';

const UPCOMING_TOKENS = [
  { token: 16, name: 'Sunita Devi', reason: 'Cough', time: '10:45' },
  { token: 17, name: 'Ramesh Kumar', reason: 'Checkup', time: '11:00' },
  { token: 18, name: 'Meera Patel', reason: 'Follow-up', time: '11:15' },
  { token: 19, name: 'Arjun Singh', reason: 'Back pain', time: '11:30' },
  { token: 20, name: 'Pooja Sharma', reason: 'Headache', time: '11:45' },
];

export default function QueueScreen() {
  const router = useRouter();
  const [counter, setCounter] = useState(15);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{'← Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Queue Manager</Text>
        <Text style={styles.headerSubtitle}>Dr. Priya Sharma</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.nowServingCard}>
          <Text style={styles.nowServingLabel}>Now Serving</Text>
          <Text style={styles.tokenNumber}>Token #{counter}</Text>
          <Text style={styles.patientName}>Raman Verma · Fever</Text>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => setCounter((prev) => prev + 1)}
          >
            <Text style={styles.callButtonText}>📢 Call Token #{counter + 1}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Upcoming Tokens</Text>

        {UPCOMING_TOKENS.map((item) => (
          <View key={item.token} style={styles.tokenCard}>
            <View style={styles.tokenCardLeft}>
              <View style={styles.tokenBadge}>
                <Text style={styles.tokenBadgeText}>#{item.token}</Text>
              </View>
              <View style={styles.tokenInfo}>
                <Text style={styles.tokenPatientName}>{item.name}</Text>
                <Text style={styles.tokenMeta}>
                  {item.reason} · {item.time}
                </Text>
              </View>
            </View>
            <View style={styles.waitingPill}>
              <Text style={styles.waitingPillText}>Waiting</Text>
            </View>
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
    paddingBottom: 32,
  },
  nowServingCard: {
    backgroundColor: '#003380',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  nowServingLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    opacity: 0.75,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tokenNumber: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
    marginBottom: 4,
  },
  patientName: {
    color: '#FFFFFF',
    fontSize: 15,
    opacity: 0.85,
    marginBottom: 20,
  },
  callButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  callButtonText: {
    color: '#003380',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  tokenCard: {
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
  tokenCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenBadge: {
    backgroundColor: '#fef9c3',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 12,
  },
  tokenBadgeText: {
    color: '#856404',
    fontSize: 13,
    fontWeight: '700',
  },
  tokenInfo: {
    flex: 1,
  },
  tokenPatientName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  tokenMeta: {
    fontSize: 12,
    color: Colors.sub,
    marginTop: 2,
  },
  waitingPill: {
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  waitingPillText: {
    color: Colors.sub,
    fontSize: 12,
    fontWeight: '500',
  },
});
