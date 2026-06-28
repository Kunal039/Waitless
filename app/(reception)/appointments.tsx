import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';

const REC_DARK = '#003380';
const REC_BLUE = '#0052CC';

type ApptStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

interface ApptRow {
  id: string;
  token_number: number | null;
  patient_name: string;
  reason: string;
  start_time: string;
  status: ApptStatus;
  queue_status: 'waiting' | 'in_room' | 'completed' | null;
  doctor_name: string;
  patient_age: number | null;
  patient_gender: string | null;
  patient_phone: string | null;
}

const STATUS_CONF: Record<string, { bg: string; color: string; label: string }> = {
  waiting:   { bg: '#FEF9C3', color: '#856404', label: 'Waiting' },
  in_room:   { bg: '#DCFCE7', color: '#16A34A', label: 'In Room' },
  completed: { bg: '#F1F5F9', color: '#6B7280', label: 'Done' },
  confirmed: { bg: '#DBEAFE', color: REC_BLUE,  label: 'Confirmed' },
  cancelled: { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled' },
  no_show:   { bg: '#FFF3E0', color: Colors.orange, label: 'No Show' },
  pending:   { bg: '#F1F5F9', color: Colors.sub, label: 'Pending' },
};

type FilterTab = 'All' | 'Waiting' | 'In Room' | 'Done';

export default function AppointmentsScreen() {
  const todayISO = new Date().toISOString().split('T')[0];
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<ApptRow[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const [hospitalId, setHospitalId] = useState<string | null>(null);

  const fetchAppointments = useCallback(async (hid: string) => {
    try {
      // Join appointments with queue_tokens and doctors
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_name,
          reason,
          start_time,
          status,
          patient_age,
          patient_gender,
          patient_phone,
          doctors!doctor_id (full_name),
          queue_tokens (token_number, status)
        `)
        .eq('date', todayISO)
        .order('start_time');

      if (error) throw error;

      const rows: ApptRow[] = (data ?? []).map((a: any) => ({
        id: a.id,
        patient_name: a.patient_name ?? '—',
        reason: a.reason ?? '—',
        start_time: a.start_time ?? '—',
        status: a.status,
        patient_age: a.patient_age,
        patient_gender: a.patient_gender,
        patient_phone: a.patient_phone,
        doctor_name: a.doctors?.full_name ?? '—',
        token_number: a.queue_tokens?.[0]?.token_number ?? null,
        queue_status: a.queue_tokens?.[0]?.status ?? null,
      }));

      setAppointments(rows);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to load appointments');
    }
  }, [todayISO]);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data: recProfile } = await supabase
          .from('profiles')
          .select('hospital_id')
          .eq('id', session.user.id)
          .maybeSingle();
        const hid: string | null = recProfile?.hospital_id ?? null;
        setHospitalId(hid);
        if (hid) await fetchAppointments(hid);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchAppointments]);

  const handleAction = async (apptId: string, action: 'confirmed' | 'completed' | 'no_show') => {
    setActioning(apptId);
    try {
      await supabase.from('appointments').update({ status: action }).eq('id', apptId);
      if (hospitalId) await fetchAppointments(hospitalId);
      setExpandedId(null);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Action failed');
    } finally {
      setActioning(null);
    }
  };

  const getDisplayStatus = (appt: ApptRow): string => {
    if (appt.queue_status) return appt.queue_status;
    return appt.status;
  };

  const filtered = appointments.filter((a) => {
    const ds = getDisplayStatus(a);
    const matchSearch =
      search === '' ||
      a.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      String(a.token_number ?? '').includes(search);
    const matchFilter =
      activeFilter === 'All' ||
      (activeFilter === 'Waiting' && ds === 'waiting') ||
      (activeFilter === 'In Room' && ds === 'in_room') ||
      (activeFilter === 'Done' && (ds === 'completed' || a.status === 'completed'));
    return matchSearch && matchFilter;
  });

  const counts = {
    All: appointments.length,
    Waiting: appointments.filter((a) => getDisplayStatus(a) === 'waiting').length,
    'In Room': appointments.filter((a) => getDisplayStatus(a) === 'in_room').length,
    Done: appointments.filter((a) => getDisplayStatus(a) === 'completed' || a.status === 'completed').length,
  };

  const FILTER_TABS: FilterTab[] = ['All', 'Waiting', 'In Room', 'Done'];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today's Appointments</Text>
        <Text style={styles.headerSubtitle}>{today} · {appointments.length} Total</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchEmoji}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by patient name or token..."
          placeholderTextColor={Colors.muted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
        style={styles.filterScroll}
      >
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, activeFilter === tab && styles.filterTabTextActive]}>
              {tab} ({counts[tab]})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={REC_BLUE} style={styles.loader} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyText}>No appointments found</Text>
            </View>
          ) : (
            filtered.map((appt) => {
              const ds = getDisplayStatus(appt);
              const conf = STATUS_CONF[ds] ?? STATUS_CONF.pending;
              const isExpanded = expandedId === appt.id;
              return (
                <TouchableOpacity
                  key={appt.id}
                  style={[styles.apptCard, isExpanded && styles.apptCardExpanded]}
                  onPress={() => setExpandedId(isExpanded ? null : appt.id)}
                  activeOpacity={0.85}
                >
                  {/* Row */}
                  <View style={styles.apptRow}>
                    <View style={[styles.tokenBadge, { backgroundColor: conf.bg }]}>
                      <Text style={[styles.tokenBadgeText, { color: conf.color }]}>
                        {appt.token_number != null ? `#${appt.token_number}` : '—'}
                      </Text>
                    </View>
                    <View style={styles.apptInfo}>
                      <Text style={styles.patientName}>{appt.patient_name}</Text>
                      <Text style={styles.apptMeta}>
                        {appt.doctor_name} · {appt.reason} · {appt.start_time}
                      </Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: conf.bg }]}>
                      <Text style={[styles.statusPillText, { color: conf.color }]}>{conf.label}</Text>
                    </View>
                  </View>

                  {/* Expanded */}
                  {isExpanded && (
                    <View style={styles.expandedSection}>
                      <View style={styles.detailGrid}>
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Age</Text>
                          <Text style={styles.detailValue}>{appt.patient_age ?? '—'}</Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Gender</Text>
                          <Text style={styles.detailValue}>{appt.patient_gender ?? '—'}</Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Phone</Text>
                          <Text style={styles.detailValue}>{appt.patient_phone ?? '—'}</Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Time</Text>
                          <Text style={styles.detailValue}>{appt.start_time}</Text>
                        </View>
                      </View>
                      <View style={styles.actionRow}>
                        {appt.status !== 'completed' && ds !== 'completed' && (
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.actionBtnGreen]}
                            onPress={() => handleAction(appt.id, 'confirmed')}
                            disabled={actioning === appt.id}
                          >
                            {actioning === appt.id ? (
                              <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                              <Text style={styles.actionBtnTextWhite}>Check In ✓</Text>
                            )}
                          </TouchableOpacity>
                        )}
                        {appt.status !== 'completed' && (
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.actionBtnBlue]}
                            onPress={() => handleAction(appt.id, 'completed')}
                            disabled={actioning === appt.id}
                          >
                            <Text style={styles.actionBtnTextWhite}>Mark Done</Text>
                          </TouchableOpacity>
                        )}
                        {appt.status !== 'no_show' && appt.status !== 'completed' && (
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.actionBtnGray]}
                            onPress={() => handleAction(appt.id, 'no_show')}
                            disabled={actioning === appt.id}
                          >
                            <Text style={styles.actionBtnTextGray}>No Show</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: REC_DARK,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
  },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  headerSubtitle: { color: '#A8C4FF', fontSize: 13, marginTop: 3 },
  loader: { marginTop: 48 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  searchEmoji: { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text, paddingVertical: 12 },
  clearBtn: { padding: 6 },
  clearBtnText: { fontSize: 14, color: Colors.muted },
  filterScroll: { marginTop: 12, maxHeight: 46 },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  filterTab: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: Colors.card,
  },
  filterTabActive: { backgroundColor: REC_BLUE, borderColor: REC_BLUE },
  filterTabText: { fontSize: 13, fontWeight: '500', color: Colors.text },
  filterTabTextActive: { color: '#FFFFFF', fontWeight: '700' },
  listContent: { padding: 16, paddingBottom: 40 },
  emptyState: { alignItems: 'center', paddingTop: 48 },
  emptyEmoji: { fontSize: 36, marginBottom: 10 },
  emptyText: { fontSize: 15, color: Colors.sub },
  apptCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  apptCardExpanded: {
    borderColor: REC_BLUE,
  },
  apptRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenBadge: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 12,
    minWidth: 46,
    alignItems: 'center',
  },
  tokenBadgeText: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  apptInfo: { flex: 1 },
  patientName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  apptMeta: { fontSize: 12, color: Colors.sub, marginTop: 2 },
  statusPill: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 8,
  },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  expandedSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  detailItem: { minWidth: '45%' },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.sub,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  detailValue: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    minWidth: 80,
  },
  actionBtnGreen: { backgroundColor: Colors.green },
  actionBtnBlue: { backgroundColor: REC_BLUE },
  actionBtnGray: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: Colors.border },
  actionBtnTextWhite: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  actionBtnTextGray: { color: Colors.sub, fontSize: 13, fontWeight: '700' },
});
