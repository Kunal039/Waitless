import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/context/AuthContext';

const ADMIN_DARK = '#1e1b4b';
const ADMIN_MID = '#312e81';
const ADMIN_LIGHT = '#a5b4fc';

interface DepartmentGroup {
  specialization: string;
  emoji: string;
  avatarBg: string;
  doctorCount: number;
  avgFee: number;
  activeCount: number;
  onLeaveCount: number;
  monthlyPatients: number;
}

// Map known specializations to emoji/color
const SPEC_META: Record<string, { emoji: string; avatarBg: string }> = {
  Cardiology: { emoji: '❤️', avatarBg: '#fce7f3' },
  'General Medicine': { emoji: '🩺', avatarBg: '#dbeafe' },
  'General OPD': { emoji: '🩺', avatarBg: '#dbeafe' },
  Orthopedics: { emoji: '🦴', avatarBg: '#fff3e0' },
  Dermatology: { emoji: '💆', avatarBg: '#ede9fe' },
  ENT: { emoji: '👂', avatarBg: '#dcfce7' },
  Gynecology: { emoji: '🌸', avatarBg: '#fce7f3' },
  Pediatrics: { emoji: '🧒', avatarBg: '#fef9c3' },
  Neurology: { emoji: '🧠', avatarBg: '#e0e7ff' },
  Ophthalmology: { emoji: '👁️', avatarBg: '#dbeafe' },
  Psychiatry: { emoji: '🧘', avatarBg: '#ede9fe' },
  Oncology: { emoji: '🎗️', avatarBg: '#fce7f3' },
  Urology: { emoji: '🫀', avatarBg: '#fff3e0' },
  Radiology: { emoji: '📡', avatarBg: '#f1f5f9' },
};

function getSpecMeta(spec: string): { emoji: string; avatarBg: string } {
  return (
    SPEC_META[spec] ?? {
      emoji: '🏥',
      avatarBg: '#f1f5f9',
    }
  );
}

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  return { start, end };
}

export default function DepartmentsScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<DepartmentGroup[]>([]);

  const fetchDepartments = useCallback(async () => {
    try {
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('hospital_id')
        .eq('id', profile?.id ?? '')
        .maybeSingle();
      const hospitalId: string | null = adminProfile?.hospital_id ?? null;

      const doctorQuery = supabase
        .from('doctors')
        .select('id, specialization, consultation_fee, is_available');
      if (hospitalId) doctorQuery.eq('hospital_id', hospitalId);
      const { data: doctors, error } = await doctorQuery;
      if (error) throw error;

      const allDoctors = doctors ?? [];

      // Group by specialization
      const grouped: Record<string, typeof allDoctors> = {};
      allDoctors.forEach((d: any) => {
        const key = d.specialization ?? 'General OPD';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(d);
      });

      const { start, end } = getCurrentMonthRange();

      // For each group, count monthly patients
      const deptGroups: DepartmentGroup[] = await Promise.all(
        Object.entries(grouped).map(async ([spec, docs]) => {
          const doctorIds = docs.map((d: any) => d.id);
          const avgFee =
            docs.reduce((s: number, d: any) => s + (d.consultation_fee ?? 0), 0) /
            docs.length;
          const activeCount = docs.filter((d: any) => d.is_available).length;
          const onLeaveCount = docs.length - activeCount;

          // Count appointments for these doctors in current month
          let monthlyPatients = 0;
          if (doctorIds.length > 0) {
            const { count } = await supabase
              .from('appointments')
              .select('id', { count: 'exact', head: true })
              .in('doctor_id', doctorIds)
              .gte('date', start)
              .lte('date', end);
            monthlyPatients = count ?? 0;
          }

          const meta = getSpecMeta(spec);
          return {
            specialization: spec,
            emoji: meta.emoji,
            avatarBg: meta.avatarBg,
            doctorCount: docs.length,
            avgFee: Math.round(avgFee),
            activeCount,
            onLeaveCount,
            monthlyPatients,
          };
        })
      );

      // Sort by monthly patients desc
      deptGroups.sort((a, b) => b.monthlyPatients - a.monthlyPatients);
      setDepartments(deptGroups);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const activeDeptCount = departments.filter((d) => d.activeCount > 0).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Departments / OPDs</Text>
          <Text style={styles.headerSubtitle}>
            {activeDeptCount} Active Department{activeDeptCount !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Add button */}
        <View style={styles.addBtnWrap}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() =>
              Alert.alert('Add Department', 'Departments are grouped by doctor specialization. Add a new doctor with a new specialization to create a department.')
            }
            activeOpacity={0.85}
          >
            <Text style={styles.addBtnText}>+ Add Department</Text>
          </TouchableOpacity>
        </View>

        {/* Section label */}
        <Text style={styles.sectionLabel}>
          DEPARTMENTS ({departments.length})
        </Text>

        {loading ? (
          <ActivityIndicator color={ADMIN_MID} style={{ marginTop: 32 }} size="large" />
        ) : departments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏥</Text>
            <Text style={styles.emptyText}>No departments yet</Text>
            <Text style={styles.emptySubtext}>
              Departments appear once doctors are added
            </Text>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {departments.map((dept) => (
              <View key={dept.specialization} style={styles.deptCard}>
                <View
                  style={[styles.avatarWrap, { backgroundColor: dept.avatarBg }]}
                >
                  <Text style={styles.avatarEmoji}>{dept.emoji}</Text>
                </View>

                <View style={styles.deptInfo}>
                  <Text style={styles.deptName}>{dept.specialization}</Text>
                  <Text style={styles.deptMeta}>
                    {dept.doctorCount} Doctor{dept.doctorCount !== 1 ? 's' : ''} · ₹
                    {dept.avgFee}/consult
                  </Text>
                  <Text style={styles.deptMonthly}>
                    {dept.monthlyPatients} patients this month
                  </Text>
                </View>

                <View style={styles.rightSection}>
                  <View
                    style={[
                      styles.statusBadge,
                      dept.activeCount > 0
                        ? styles.badgeActive
                        : styles.badgeLeave,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        dept.activeCount > 0
                          ? styles.badgeActiveText
                          : styles.badgeLeaveText,
                      ]}
                    >
                      {dept.activeCount > 0 ? 'Active' : 'On Leave'}
                    </Text>
                  </View>
                  {dept.onLeaveCount > 0 && (
                    <Text style={styles.leaveCount}>
                      {dept.onLeaveCount} on leave
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  header: {
    backgroundColor: ADMIN_DARK,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: ADMIN_LIGHT,
  },

  addBtnWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  addBtn: {
    backgroundColor: ADMIN_MID,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.sub,
    letterSpacing: 0.8,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },

  listWrap: {
    paddingHorizontal: 16,
    gap: 12,
  },
  deptCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarEmoji: { fontSize: 24 },

  deptInfo: { flex: 1 },
  deptName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  deptMeta: {
    fontSize: 12,
    color: Colors.sub,
    marginBottom: 2,
  },
  deptMonthly: {
    fontSize: 11,
    color: Colors.muted,
    fontVariant: ['tabular-nums'],
  },

  rightSection: {
    alignItems: 'flex-end',
    gap: 5,
    minWidth: 70,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeActive: { backgroundColor: '#dcfce7' },
  badgeLeave: { backgroundColor: '#fef9c3' },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeActiveText: { color: Colors.green },
  badgeLeaveText: { color: '#92400e' },
  leaveCount: {
    fontSize: 10,
    color: Colors.muted,
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
  },
});
