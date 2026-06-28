import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/context/AuthContext';

const ADMIN_DARK = '#1e1b4b';
const ADMIN_MID = '#312e81';
const ADMIN_LIGHT = '#a5b4fc';

const BAR_MAX_HEIGHT = 80;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface DashboardMetrics {
  patientsThisMonth: number;
  revenueThisMonth: number;
  activeDoctors: number;
  avgRating: number;
  weeklyData: number[];
  hospitalName: string;
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];
  return { start, end };
}

function getWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function getCurrentMonthLabel() {
  return new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export default function AdminDashboard() {
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    patientsThisMonth: 0,
    revenueThisMonth: 0,
    activeDoctors: 0,
    avgRating: 0,
    weeklyData: [0, 0, 0, 0, 0, 0, 0],
    hospitalName: 'Hospital',
  });

  const fetchMetrics = useCallback(async () => {
    try {
      // Get hospital_id for admin
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('hospital_id')
        .eq('id', profile?.id ?? '')
        .maybeSingle();

      const hospitalId: string | null = adminProfile?.hospital_id ?? null;

      const { start, end } = getMonthRange();
      const weekDays = getWeekRange();

      // Hospital name
      let hospitalName = 'Hospital';
      if (hospitalId) {
        const { data: hosp } = await supabase
          .from('hospitals')
          .select('name')
          .eq('id', hospitalId)
          .maybeSingle();
        if (hosp?.name) hospitalName = hosp.name;
      }

      // Patients this month
      const appointmentQuery = supabase
        .from('appointments')
        .select('id, date', { count: 'exact' })
        .gte('date', start)
        .lte('date', end);
      if (hospitalId) appointmentQuery.eq('hospital_id', hospitalId);
      const { count: patientCount } = await appointmentQuery;

      // Revenue this month (sum consultation_fee via join)
      const revenueQuery = supabase
        .from('appointments')
        .select('doctors(consultation_fee)')
        .gte('date', start)
        .lte('date', end)
        .eq('status', 'completed');
      if (hospitalId) revenueQuery.eq('hospital_id', hospitalId);
      const { data: revenueRows } = await revenueQuery;
      const totalRevenue = (revenueRows ?? []).reduce((sum: number, row: any) => {
        return sum + (row?.doctors?.consultation_fee ?? 0);
      }, 0);

      // Active doctors
      const doctorQuery = supabase
        .from('doctors')
        .select('id', { count: 'exact', head: true })
        .eq('is_available', true);
      if (hospitalId) doctorQuery.eq('hospital_id', hospitalId);
      const { count: activeDoctors } = await doctorQuery;

      // Avg rating from hospitals table
      let avgRating = 0;
      if (hospitalId) {
        const { data: hospRating } = await supabase
          .from('hospitals')
          .select('rating')
          .eq('id', hospitalId)
          .maybeSingle();
        avgRating = hospRating?.rating ?? 0;
      }

      // Weekly bar data — count appointments per day of current week
      const weeklyData: number[] = await Promise.all(
        weekDays.map(async (day) => {
          const q = supabase
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('date', day);
          if (hospitalId) q.eq('hospital_id', hospitalId);
          const { count } = await q;
          return count ?? 0;
        })
      );

      setMetrics({
        patientsThisMonth: patientCount ?? 0,
        revenueThisMonth: totalRevenue,
        activeDoctors: activeDoctors ?? 0,
        avgRating,
        weeklyData,
        hospitalName,
      });
    } catch (_e) {
      // Non-fatal — show zeros
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const maxBar = Math.max(...metrics.weeklyData, 1);

  const formatRevenue = (v: number) => {
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
    return `₹${v}`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.headerEyebrow}>ADMIN PANEL</Text>
              <Text style={styles.headerTitle}>Admin Dashboard</Text>
            </View>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>⚡ Live</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>
            {metrics.hospitalName} · {getCurrentMonthLabel()}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={ADMIN_MID} style={styles.loader} size="large" />
        ) : (
          <>
            {/* Metrics 2x2 Grid */}
            <View style={styles.metricsGrid}>
              {/* Patients */}
              <View style={[styles.metricCard, styles.metricBlue]}>
                <Text style={styles.metricIcon}>👥</Text>
                <Text style={styles.metricValue}>
                  {metrics.patientsThisMonth}
                </Text>
                <Text style={styles.metricLabel}>Patients This Month</Text>
                <Text style={styles.metricChange}>↑ 12% vs last month</Text>
              </View>

              {/* Revenue */}
              <View style={[styles.metricCard, styles.metricGreen]}>
                <Text style={styles.metricIcon}>💰</Text>
                <Text style={styles.metricValue}>
                  {formatRevenue(metrics.revenueThisMonth)}
                </Text>
                <Text style={styles.metricLabel}>Monthly Revenue</Text>
                <Text style={styles.metricChange}>↑ 8% vs last month</Text>
              </View>

              {/* Active Doctors */}
              <View style={[styles.metricCard, styles.metricOrange]}>
                <Text style={styles.metricIcon}>👨‍⚕️</Text>
                <Text style={styles.metricValue}>{metrics.activeDoctors}</Text>
                <Text style={styles.metricLabel}>Active Doctors</Text>
                <Text style={styles.metricChange}>On duty today</Text>
              </View>

              {/* Rating */}
              <View style={[styles.metricCard, styles.metricPurple]}>
                <Text style={styles.metricIcon}>⭐</Text>
                <Text style={styles.metricValue}>
                  {metrics.avgRating > 0 ? metrics.avgRating.toFixed(1) : '—'}
                </Text>
                <Text style={styles.metricLabel}>Avg. Rating</Text>
                <Text style={styles.metricChange}>Patient reviews</Text>
              </View>
            </View>

            {/* Weekly Bar Chart */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Weekly Patients</Text>
                <Text style={styles.chartSubtitle}>This week</Text>
              </View>
              <View style={styles.barsRow}>
                {metrics.weeklyData.map((val, i) => {
                  const barH = Math.max((val / maxBar) * BAR_MAX_HEIGHT, val > 0 ? 4 : 2);
                  return (
                    <View key={DAYS[i]} style={styles.barCol}>
                      <Text style={styles.barCount}>{val > 0 ? val : ''}</Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.bar,
                            { height: barH },
                            val === 0 && styles.barEmpty,
                          ]}
                        />
                      </View>
                      <Text style={styles.barDay}>{DAYS[i]}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={[styles.actionCard, styles.actionPurple]}
                onPress={() => router.push('/(admin)/doctors')}
                activeOpacity={0.8}
              >
                <Text style={styles.actionEmoji}>👨‍⚕️</Text>
                <Text style={[styles.actionText, { color: ADMIN_MID }]}>Doctors</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, styles.actionBlue]}
                onPress={() => router.push('/(admin)/reports')}
                activeOpacity={0.8}
              >
                <Text style={styles.actionEmoji}>📈</Text>
                <Text style={[styles.actionText, { color: Colors.primary }]}>Reports</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, styles.actionYellow]}
                onPress={() => router.push('/(admin)/settings')}
                activeOpacity={0.8}
              >
                <Text style={styles.actionEmoji}>⚙️</Text>
                <Text style={[styles.actionText, { color: '#92400e' }]}>Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, styles.actionGreen]}
                onPress={() => router.push('/(admin)/departments')}
                activeOpacity={0.8}
              >
                <Text style={styles.actionEmoji}>🏥</Text>
                <Text style={[styles.actionText, { color: Colors.green }]}>Departments</Text>
              </TouchableOpacity>
            </View>
          </>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loader: {
    marginTop: 60,
  },

  // Header
  header: {
    backgroundColor: ADMIN_DARK,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: ADMIN_LIGHT,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerBadge: {
    backgroundColor: 'rgba(165,180,252,0.18)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(165,180,252,0.35)',
  },
  headerBadgeText: {
    color: ADMIN_LIGHT,
    fontSize: 12,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    color: ADMIN_LIGHT,
  },

  // Metrics grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  metricCard: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    minHeight: 110,
  },
  metricBlue: { backgroundColor: '#1d4ed8' },
  metricGreen: { backgroundColor: '#15803d' },
  metricOrange: { backgroundColor: '#c2410c' },
  metricPurple: { backgroundColor: ADMIN_MID },
  metricIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
    fontWeight: '500',
  },
  metricChange: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },

  // Bar chart
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  chartSubtitle: {
    fontSize: 12,
    color: Colors.muted,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: BAR_MAX_HEIGHT + 36,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  barCount: {
    fontSize: 9,
    color: Colors.sub,
    height: 13,
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    height: BAR_MAX_HEIGHT,
    width: '60%',
    justifyContent: 'flex-end',
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    backgroundColor: ADMIN_MID,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barEmpty: {
    backgroundColor: '#e2e8f0',
    height: 2,
  },
  barDay: {
    fontSize: 10,
    color: Colors.sub,
    marginTop: 5,
  },

  // Quick actions
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.sub,
    letterSpacing: 0.8,
    marginHorizontal: 16,
    marginTop: 28,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionCard: {
    width: '47%',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    gap: 8,
  },
  actionPurple: { backgroundColor: '#ede9fe' },
  actionBlue: { backgroundColor: Colors.primaryLight },
  actionYellow: { backgroundColor: '#fef3c7' },
  actionGreen: { backgroundColor: '#dcfce7' },
  actionEmoji: { fontSize: 26 },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
