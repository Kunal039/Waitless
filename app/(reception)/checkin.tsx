import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';

const REC_DARK = '#003380';
const REC_BLUE = '#0052CC';

interface SearchResult {
  appointment_id: string;
  patient_name: string;
  patient_phone: string | null;
  token_number: number | null;
  queue_token_id: string | null;
  doctor_name: string;
  start_time: string;
  appt_status: string;
  queue_status: string | null;
  already_checked_in: boolean;
}

export default function CheckinScreen() {
  const todayISO = new Date().toISOString().split('T')[0];
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const doSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setSearching(true);
    setHasSearched(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_name,
          patient_phone,
          start_time,
          status,
          doctors!doctor_id (full_name),
          queue_tokens (id, token_number, status)
        `)
        .eq('date', todayISO)
        .or(`patient_name.ilike.%${query.trim()}%,patient_phone.ilike.%${query.trim()}%`)
        .neq('status', 'cancelled')
        .order('start_time');

      if (error) throw error;

      const rows: SearchResult[] = (data ?? []).map((a: any) => {
        const qt = a.queue_tokens?.[0];
        const alreadyIn = a.status === 'confirmed' || qt?.status === 'waiting' || qt?.status === 'in_room';
        return {
          appointment_id: a.id,
          patient_name: a.patient_name ?? '—',
          patient_phone: a.patient_phone ?? null,
          token_number: qt?.token_number ?? null,
          queue_token_id: qt?.id ?? null,
          doctor_name: a.doctors?.full_name ?? '—',
          start_time: a.start_time ?? '—',
          appt_status: a.status,
          queue_status: qt?.status ?? null,
          already_checked_in: !!alreadyIn,
        };
      });

      setResults(rows);
    } catch (e: any) {
      Alert.alert('Search Error', e?.message ?? 'Search failed');
    } finally {
      setSearching(false);
    }
  }, [todayISO]);

  const handleCheckIn = async (result: SearchResult) => {
    if (result.already_checked_in) {
      Alert.alert('Already Checked In', `${result.patient_name} is already checked in.`);
      return;
    }
    setCheckingIn(result.appointment_id);
    try {
      // Update appointment to confirmed
      await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', result.appointment_id);

      // Update queue token to waiting if exists
      if (result.queue_token_id) {
        await supabase
          .from('queue_tokens')
          .update({ status: 'waiting' })
          .eq('id', result.queue_token_id);
      }

      // Refresh search
      await doSearch(search);
      Alert.alert(
        'Checked In!',
        `${result.patient_name} has been checked in.\nToken #${result.token_number ?? '—'}`,
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Check-in failed');
    } finally {
      setCheckingIn(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Patient Check-in</Text>
        <Text style={styles.headerSubtitle}>Scan or search to check in</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* QR Box */}
        <View style={styles.qrBox}>
          <Text style={styles.qrEmoji}>📱</Text>
          <Text style={styles.qrTitle}>Scan Patient QR Code</Text>
          <Text style={styles.qrSubtitle}>Hold camera over patient's appointment QR</Text>
          <View style={styles.qrScanBtn}>
            <Text style={styles.qrScanBtnText}>Open Scanner</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or search manually</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.searchWrap}>
          <Text style={styles.searchEmoji}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Name or mobile number..."
            placeholderTextColor={Colors.muted}
            value={search}
            onChangeText={(t) => {
              setSearch(t);
              doSearch(t);
            }}
            returnKeyType="search"
            onSubmitEditing={() => doSearch(search)}
          />
          {searching && <ActivityIndicator color={REC_BLUE} size="small" style={{ marginLeft: 8 }} />}
          {!searching && search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setResults([]); setHasSearched(false); }}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Results */}
        {hasSearched && (
          <>
            <Text style={styles.sectionTitle}>
              {results.length === 0 ? 'No results found' : `${results.length} Result${results.length !== 1 ? 's' : ''}`}
            </Text>
            {results.map((patient) => {
              const isCheckedIn = patient.already_checked_in;
              const isLoading = checkingIn === patient.appointment_id;
              return (
                <View
                  key={patient.appointment_id}
                  style={[styles.patientCard, isCheckedIn && styles.patientCardChecked]}
                >
                  <View style={styles.cardTop}>
                    <View style={[styles.avatar, isCheckedIn && styles.avatarChecked]}>
                      <Text style={styles.avatarText}>
                        {patient.patient_name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.patientInfo}>
                      <Text style={styles.patientName}>{patient.patient_name}</Text>
                      <Text style={styles.patientMeta}>
                        Token #{patient.token_number ?? '—'} · {patient.doctor_name}
                      </Text>
                      <Text style={styles.patientTime}>{patient.start_time}</Text>
                    </View>
                    {isCheckedIn && (
                      <View style={styles.checkedBadge}>
                        <Text style={styles.checkedBadgeText}>✓ In</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.checkInBtn,
                      isCheckedIn ? styles.checkInBtnDone : styles.checkInBtnActive,
                    ]}
                    onPress={() => handleCheckIn(patient)}
                    disabled={isLoading || isCheckedIn}
                    activeOpacity={0.85}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text
                        style={[
                          styles.checkInBtnText,
                          isCheckedIn && styles.checkInBtnTextDone,
                        ]}
                      >
                        {isCheckedIn ? 'Already Checked In' : 'Check In ✓'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}

        {!hasSearched && (
          <View style={styles.emptyPrompt}>
            <Text style={styles.emptyPromptEmoji}>🔎</Text>
            <Text style={styles.emptyPromptText}>
              Enter a patient name or mobile number to search today's appointments
            </Text>
          </View>
        )}
      </ScrollView>
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
  headerSubtitle: { color: '#A8C4FF', fontSize: 14, marginTop: 3 },
  scrollContent: { padding: 16, paddingBottom: 48 },
  qrBox: {
    borderWidth: 2,
    borderColor: REC_BLUE,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    backgroundColor: '#EAF2FF',
    marginBottom: 22,
  },
  qrEmoji: { fontSize: 44, marginBottom: 10 },
  qrTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 6, textAlign: 'center' },
  qrSubtitle: { fontSize: 13, color: Colors.sub, textAlign: 'center', marginBottom: 18 },
  qrScanBtn: {
    backgroundColor: REC_BLUE,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  qrScanBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  searchDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 12, color: Colors.muted, fontWeight: '600' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  searchEmoji: { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text, paddingVertical: 13 },
  clearText: { fontSize: 14, color: Colors.muted, padding: 4 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.sub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  patientCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  patientCardChecked: {
    borderColor: Colors.green,
    backgroundColor: '#F0FDF4',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarChecked: { backgroundColor: '#DCFCE7' },
  avatarText: { fontSize: 20, fontWeight: '700', color: REC_BLUE },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  patientMeta: { fontSize: 13, color: Colors.sub, marginTop: 2 },
  patientTime: { fontSize: 12, color: Colors.muted, marginTop: 1 },
  checkedBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  checkedBadgeText: { color: Colors.green, fontSize: 12, fontWeight: '700' },
  checkInBtn: {
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  checkInBtnActive: { backgroundColor: REC_BLUE },
  checkInBtnDone: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: Colors.border },
  checkInBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  checkInBtnTextDone: { color: Colors.sub },
  emptyPrompt: {
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 24,
  },
  emptyPromptEmoji: { fontSize: 36, marginBottom: 12 },
  emptyPromptText: { fontSize: 14, color: Colors.sub, textAlign: 'center', lineHeight: 22 },
});
