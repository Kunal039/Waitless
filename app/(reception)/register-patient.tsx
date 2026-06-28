import React, { useEffect, useState, useCallback } from 'react';
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
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { createAppointment, createQueueToken } from '../../lib/api/appointments';
import type { Doctor } from '../../types';

const REC_DARK = '#003380';
const REC_BLUE = '#0052CC';

const REASONS = [
  'Fever',
  'Cough & Cold',
  'Headache',
  'Back Pain',
  'Checkup',
  'Follow-up',
  'Emergency',
  'Other',
];
const PAYMENTS: string[] = ['Cash', 'UPI', 'Card'];
type Gender = 'Male' | 'Female' | 'Other' | '';

interface PickerFieldProps {
  label: string;
  value: string;
  placeholder: string;
  open: boolean;
  onToggle: () => void;
  options: { label: string; sub?: string; value: string }[];
  onSelect: (val: string) => void;
}

function PickerField({ label, value, placeholder, open, onToggle, options, onSelect }: PickerFieldProps) {
  return (
    <View>
      <Text style={fieldStyles.label}>{label}</Text>
      <TouchableOpacity style={fieldStyles.toggle} onPress={onToggle} activeOpacity={0.8}>
        <Text style={value ? fieldStyles.value : fieldStyles.placeholder}>
          {value || placeholder}
        </Text>
        <Text style={fieldStyles.arrow}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={fieldStyles.list}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={fieldStyles.listItem}
              onPress={() => onSelect(opt.value)}
            >
              <Text style={fieldStyles.listItemText}>{opt.label}</Text>
              {opt.sub ? <Text style={fieldStyles.listItemSub}>{opt.sub}</Text> : null}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '700', color: Colors.sub, marginBottom: 6, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.4 },
  toggle: { backgroundColor: '#F4F5F7', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  value: { fontSize: 15, color: Colors.text },
  placeholder: { fontSize: 15, color: Colors.muted },
  arrow: { fontSize: 11, color: Colors.sub },
  list: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, backgroundColor: Colors.card, marginTop: 4, overflow: 'hidden' },
  listItem: { paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F0F2F8' },
  listItemText: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  listItemSub: { fontSize: 12, color: Colors.sub, marginTop: 2 },
});

export default function RegisterPatientScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender>('');
  const [mobile, setMobile] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDoctorLabel, setSelectedDoctorLabel] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');
  const [openPicker, setOpenPicker] = useState<'doctor' | 'reason' | 'payment' | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successToken, setSuccessToken] = useState<number | null>(null);

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
        if (hid) {
          const { data: docs } = await supabase
            .from('doctors')
            .select('*')
            .eq('hospital_id', hid)
            .eq('is_available', true)
            .order('full_name');
          setDoctors((docs ?? []) as Doctor[]);
        }
      } catch (e) {
        // non-fatal
      } finally {
        setLoadingDoctors(false);
      }
    })();
  }, []);

  const selectedDoctorObj = doctors.find((d) => d.id === selectedDoctorId);
  const consultationFee = selectedDoctorObj?.consultation_fee ?? null;
  const todayISO = new Date().toISOString().split('T')[0];

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert('Missing', 'Please enter patient name.'); return; }
    if (!age.trim() || isNaN(Number(age))) { Alert.alert('Missing', 'Please enter a valid age.'); return; }
    if (!gender) { Alert.alert('Missing', 'Please select gender.'); return; }
    if (!mobile.trim() || mobile.trim().length < 10) { Alert.alert('Missing', 'Please enter a valid 10-digit mobile number.'); return; }
    if (!selectedDoctorId) { Alert.alert('Missing', 'Please select a doctor.'); return; }
    if (!selectedReason) { Alert.alert('Missing', 'Please select a reason for visit.'); return; }
    if (!selectedPayment) { Alert.alert('Missing', 'Please select payment mode.'); return; }

    setSubmitting(true);
    try {
      // Upsert patient profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', mobile.trim())
        .eq('role', 'patient')
        .maybeSingle();

      let patientId: string;
      if (existingProfile) {
        patientId = existingProfile.id;
      } else {
        const { data: newUser, error: signUpErr } = await supabase.auth.admin
          ? // Admin not available on client; create anonymous patient profile instead
          { data: null, error: new Error('use_insert') }
          : { data: null, error: new Error('use_insert') };

        // Insert into profiles directly (walk-in patient without auth)
        const { data: inserted, error: insertErr } = await supabase
          .from('profiles')
          .insert({
            full_name: name.trim(),
            phone: mobile.trim(),
            age: Number(age),
            gender,
            role: 'patient',
            email: null,
          })
          .select('id')
          .single();
        if (insertErr) throw insertErr;
        patientId = inserted.id;
      }

      // Create appointment
      const doc = selectedDoctorObj!;
      const appointment = await createAppointment({
        patient_id: patientId,
        hospital_id: hospitalId!,
        doctor_id: selectedDoctorId,
        doctor_slot_id: '', // walk-in: no slot
        date: todayISO,
        start_time: new Date().toTimeString().slice(0, 5),
        end_time: new Date(Date.now() + 20 * 60000).toTimeString().slice(0, 5),
        patient_name: name.trim(),
        patient_age: Number(age),
        patient_gender: gender,
        patient_phone: mobile.trim(),
        reason: selectedReason,
      });

      // Create queue token
      const tokenNum = await createQueueToken({
        appointment_id: appointment.id,
        hospital_id: hospitalId!,
        doctor_id: selectedDoctorId,
        date: todayISO,
      });

      setSuccessToken(tokenNum);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successToken !== null) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.successScreen}>
          <View style={styles.successIconWrap}>
            <Text style={styles.successIcon}>✅</Text>
          </View>
          <Text style={styles.successTitle}>Patient Registered!</Text>
          <Text style={styles.successName}>{name}</Text>
          <View style={styles.successTokenCard}>
            <Text style={styles.successTokenLabel}>TOKEN NUMBER</Text>
            <Text style={styles.successTokenNum}>#{successToken}</Text>
            <Text style={styles.successTokenSub}>
              {selectedDoctorLabel}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.goToQueueBtn}
            onPress={() => router.replace('/(reception)/queue')}
            activeOpacity={0.85}
          >
            <Text style={styles.goToQueueBtnText}>Go to Queue Manager →</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.registerAnotherBtn}
            onPress={() => {
              setSuccessToken(null);
              setName(''); setAge(''); setGender(''); setMobile('');
              setSelectedDoctorId(''); setSelectedDoctorLabel('');
              setSelectedReason(''); setSelectedPayment('');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.registerAnotherBtnText}>Register Another Patient</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Register New Patient</Text>
        <Text style={styles.headerSubtitle}>Walk-in Registration</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          {/* Full Name */}
          <Text style={fieldStyles.label}>Full Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter full name"
            placeholderTextColor={Colors.muted}
            value={name}
            onChangeText={setName}
          />

          {/* Age + Gender */}
          <View style={styles.row}>
            <View style={styles.ageWrap}>
              <Text style={fieldStyles.label}>Age</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 35"
                placeholderTextColor={Colors.muted}
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
                maxLength={3}
              />
            </View>
            <View style={styles.genderWrap}>
              <Text style={fieldStyles.label}>Gender</Text>
              <View style={styles.genderRow}>
                {(['Male', 'Female', 'Other'] as Gender[]).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                    onPress={() => setGender(g)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Mobile */}
          <Text style={fieldStyles.label}>Mobile Number</Text>
          <TextInput
            style={styles.textInput}
            placeholder="10-digit mobile number"
            placeholderTextColor={Colors.muted}
            keyboardType="phone-pad"
            value={mobile}
            onChangeText={setMobile}
            maxLength={10}
          />

          {/* Doctor */}
          {loadingDoctors ? (
            <ActivityIndicator color={REC_BLUE} style={{ marginTop: 16 }} />
          ) : (
            <PickerField
              label="Select Doctor"
              value={selectedDoctorLabel}
              placeholder="Tap to select doctor"
              open={openPicker === 'doctor'}
              onToggle={() => setOpenPicker(openPicker === 'doctor' ? null : 'doctor')}
              options={doctors.map((d) => ({
                value: d.id,
                label: d.full_name,
                sub: `${d.specialization} · ₹${d.consultation_fee}`,
              }))}
              onSelect={(val) => {
                const doc = doctors.find((d) => d.id === val);
                setSelectedDoctorId(val);
                setSelectedDoctorLabel(doc ? `${doc.full_name} · ${doc.specialization}` : '');
                setOpenPicker(null);
              }}
            />
          )}

          {/* Reason */}
          <PickerField
            label="Reason for Visit"
            value={selectedReason}
            placeholder="Tap to select reason"
            open={openPicker === 'reason'}
            onToggle={() => setOpenPicker(openPicker === 'reason' ? null : 'reason')}
            options={REASONS.map((r) => ({ value: r, label: r }))}
            onSelect={(val) => { setSelectedReason(val); setOpenPicker(null); }}
          />

          {/* Payment */}
          <PickerField
            label="Payment Mode"
            value={selectedPayment}
            placeholder="Tap to select payment mode"
            open={openPicker === 'payment'}
            onToggle={() => setOpenPicker(openPicker === 'payment' ? null : 'payment')}
            options={PAYMENTS.map((p) => ({ value: p, label: p }))}
            onSelect={(val) => { setSelectedPayment(val); setOpenPicker(null); }}
          />

          {/* Fee display */}
          {consultationFee !== null && (
            <View style={styles.feeCard}>
              <Text style={styles.feeLabel}>Consultation Fee</Text>
              <Text style={styles.feeAmount}>₹{consultationFee}</Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Register & Issue Token</Text>
            )}
          </TouchableOpacity>
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
    backgroundColor: REC_DARK,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#A8C4FF',
    fontSize: 14,
    marginTop: 3,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  textInput: {
    backgroundColor: '#F4F5F7',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  ageWrap: {
    flex: 1,
  },
  genderWrap: {
    flex: 2,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 6,
  },
  genderBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.card,
  },
  genderBtnActive: {
    backgroundColor: REC_BLUE,
    borderColor: REC_BLUE,
  },
  genderBtnText: {
    fontSize: 12,
    color: Colors.sub,
    fontWeight: '600',
  },
  genderBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  feeCard: {
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  feeLabel: {
    color: Colors.green,
    fontSize: 14,
    fontWeight: '600',
  },
  feeAmount: {
    color: Colors.green,
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  submitBtn: {
    backgroundColor: REC_BLUE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Success screen
  successScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: Colors.background,
  },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  successIcon: { fontSize: 36 },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 6,
  },
  successName: {
    fontSize: 17,
    color: Colors.sub,
    marginBottom: 32,
  },
  successTokenCard: {
    backgroundColor: REC_DARK,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 48,
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  successTokenLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7EB3FF',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  successTokenNum: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    marginBottom: 8,
  },
  successTokenSub: {
    fontSize: 13,
    color: '#B8D0FF',
    textAlign: 'center',
  },
  goToQueueBtn: {
    backgroundColor: REC_BLUE,
    borderRadius: 14,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  goToQueueBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  registerAnotherBtn: {
    paddingVertical: 13,
    width: '100%',
    alignItems: 'center',
  },
  registerAnotherBtnText: {
    color: Colors.sub,
    fontSize: 15,
    fontWeight: '600',
  },
});
