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

interface Department {
  id: number;
  emoji: string;
  avatarBg: string;
  name: string;
  status: 'Active' | 'On Leave';
  monthlyPts: number;
}

const DEPARTMENTS: Department[] = [
  {
    id: 1,
    emoji: '❤️',
    avatarBg: '#fce7f3',
    name: 'Cardiology',
    status: 'Active',
    monthlyPts: 128,
  },
  {
    id: 2,
    emoji: '🩺',
    avatarBg: '#dbeafe',
    name: 'General OPD',
    status: 'Active',
    monthlyPts: 246,
  },
  {
    id: 3,
    emoji: '🦴',
    avatarBg: '#fff3e0',
    name: 'Orthopedics',
    status: 'Active',
    monthlyPts: 89,
  },
  {
    id: 4,
    emoji: '💆',
    avatarBg: '#ede9fe',
    name: 'Dermatology',
    status: 'On Leave',
    monthlyPts: 45,
  },
  {
    id: 5,
    emoji: '👂',
    avatarBg: '#dcfce7',
    name: 'ENT',
    status: 'Active',
    monthlyPts: 67,
  },
];

export default function DepartmentsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Departments / OPDs</Text>
          <Text style={styles.headerSubtitle}>5 Active Departments</Text>
        </View>

        {/* Add Button */}
        <View style={styles.addButtonContainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => Alert.alert('Add Department', 'Feature coming soon')}
          >
            <Text style={styles.addButtonText}>+ Add Department</Text>
          </TouchableOpacity>
        </View>

        {/* Department List */}
        <View style={styles.listContainer}>
          {DEPARTMENTS.map((dept) => (
            <View key={dept.id} style={styles.deptCard}>
              <View
                style={[styles.avatarCircle, { backgroundColor: dept.avatarBg }]}
              >
                <Text style={styles.avatarEmoji}>{dept.emoji}</Text>
              </View>
              <View style={styles.deptInfo}>
                <Text style={styles.deptName}>{dept.name}</Text>
                <Text style={styles.deptMeta}>1 Doctor · ₹500/consult</Text>
              </View>
              <View style={styles.rightSection}>
                <View
                  style={[
                    styles.statusBadge,
                    dept.status === 'Active'
                      ? styles.statusBadgeActive
                      : styles.statusBadgeLeave,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      dept.status === 'Active'
                        ? styles.statusBadgeTextActive
                        : styles.statusBadgeTextLeave,
                    ]}
                  >
                    {dept.status}
                  </Text>
                </View>
                <Text style={styles.monthlyCount}>{dept.monthlyPts} pts</Text>
              </View>
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
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
    paddingBottom: 16,
  },
  deptCard: {
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
  deptInfo: {
    flex: 1,
  },
  deptName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  deptMeta: {
    fontSize: 12,
    color: Colors.sub,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeActive: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeLeave: {
    backgroundColor: '#fef9c3',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadgeTextActive: {
    color: Colors.green,
  },
  statusBadgeTextLeave: {
    color: '#856404',
  },
  monthlyCount: {
    fontSize: 12,
    color: Colors.sub,
  },
});
