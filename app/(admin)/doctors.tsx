import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/context/AuthContext';
import type { Doctor } from '../../types';

const ADMIN_DARK = '#1e1b4b';
const ADMIN_MID = '#312e81';
const ADMIN_LIGHT = '#a5b4fc';

interface DoctorRow extends Doctor {
  availableLocal: boolean;
}

interface EditForm {
  full_name: string;
  specialization: string;
  qualification: string;
  experience_years: string;
  consultation_fee: string;
  room_number: string;
  shift_start: string;
  shift_end: string;
  avatar_emoji: string;
}

const EMPTY_FORM: EditForm = {
  full_name: '',
  specialization: '',
  qualification: '',
  experience_years: '',
  consultation_fee: '',
  room_number: '',
  shift_start: '',
  shift_end: '',
  avatar_emoji: '👨‍⚕️',
};

export default function DoctorsScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorRow | null>(null);
  const [form, setForm] = useState<EditForm>(EMPTY_FORM);
  const slideAnim = useRef(new Animated.Value(600)).current;

  const fetchDoctors = useCallback(async () => {
    try {
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('hospital_id')
        .eq('id', profile?.id ?? '')
        .maybeSingle();

      const hId: string | null = adminProfile?.hospital_id ?? null;
      setHospitalId(hId);

      const query = supabase.from('doctors').select('*').order('full_name');
      if (hId) query.eq('hospital_id', hId);
      const { data, error } = await query;
      if (error) throw error;

      setDoctors(
        (data ?? []).map((d: Doctor) => ({ ...d, availableLocal: d.is_available }))
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const openSheet = (doctor: DoctorRow | null) => {
    setEditingDoctor(doctor);
    setForm(
      doctor
        ? {
            full_name: doctor.full_name ?? '',
            specialization: doctor.specialization ?? '',
            qualification: doctor.qualification ?? '',
            experience_years: String(doctor.experience_years ?? ''),
            consultation_fee: String(doctor.consultation_fee ?? ''),
            room_number: doctor.room_number ?? '',
            shift_start: doctor.shift_start ?? '',
            shift_end: doctor.shift_end ?? '',
            avatar_emoji: doctor.avatar_emoji ?? '👨‍⚕️',
          }
        : EMPTY_FORM
    );
    setSheetVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 180,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(slideAnim, {
      toValue: 600,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setSheetVisible(false));
  };

  const handleToggle = async (doctor: DoctorRow) => {
    const newVal = !doctor.availableLocal;
    setDoctors((prev) =>
      prev.map((d) => (d.id === doctor.id ? { ...d, availableLocal: newVal } : d))
    );
    const { error } = await supabase
      .from('doctors')
      .update({ is_available: newVal })
      .eq('id', doctor.id);
    if (error) {
      // Revert on failure
      setDoctors((prev) =>
        prev.map((d) => (d.id === doctor.id ? { ...d, availableLocal: !newVal } : d))
      );
      Alert.alert('Error', 'Could not update availability');
    }
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      Alert.alert('Validation', 'Doctor name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        specialization: form.specialization.trim(),
        qualification: form.qualification.trim(),
        experience_years: parseInt(form.experience_years) || 0,
        consultation_fee: parseFloat(form.consultation_fee) || 0,
        room_number: form.room_number.trim(),
        shift_start: form.shift_start.trim(),
        shift_end: form.shift_end.trim(),
        avatar_emoji: form.avatar_emoji.trim() || '👨‍⚕️',
      };

      if (editingDoctor) {
        const { error } = await supabase
          .from('doctors')
          .update(payload)
          .eq('id', editingDoctor.id);
        if (error) throw error;
      } else {
        if (!hospitalId) throw new Error('No hospital assigned to admin');
        const { error } = await supabase.from('doctors').insert({
          ...payload,
          hospital_id: hospitalId,
          is_available: true,
        });
        if (error) throw error;
      }

      closeSheet();
      await fetchDoctors();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save doctor');
    } finally {
      setSaving(false);
    }
  };

  const activeCount = doctors.filter((d) => d.availableLocal).length;
  const leaveCount = doctors.length - activeCount;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Doctor Management</Text>
          <Text style={styles.headerSubtitle}>
            {activeCount} Active · {leaveCount} On Leave
          </Text>
        </View>

        {/* Add Button */}
        <View style={styles.addBtnWrap}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => openSheet(null)}
            activeOpacity={0.85}
          >
            <Text style={styles.addBtnText}>+ Add New Doctor</Text>
          </TouchableOpacity>
        </View>

        {/* Section label */}
        <Text style={styles.sectionLabel}>ALL DOCTORS ({doctors.length})</Text>

        {loading ? (
          <ActivityIndicator color={ADMIN_MID} style={{ marginTop: 32 }} />
        ) : doctors.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👨‍⚕️</Text>
            <Text style={styles.emptyText}>No doctors found</Text>
            <Text style={styles.emptySubtext}>Tap "+ Add New Doctor" to get started</Text>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {doctors.map((doctor) => (
              <TouchableOpacity
                key={doctor.id}
                style={styles.doctorCard}
                onPress={() => openSheet(doctor)}
                activeOpacity={0.85}
              >
                <View style={styles.avatarWrap}>
                  <Text style={styles.avatarEmoji}>{doctor.avatar_emoji ?? '👨‍⚕️'}</Text>
                </View>
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>{doctor.full_name}</Text>
                  <Text style={styles.doctorSpec}>{doctor.specialization}</Text>
                  <Text style={styles.doctorMeta}>
                    {doctor.shift_start && doctor.shift_end
                      ? `${doctor.shift_start} – ${doctor.shift_end}`
                      : 'Shift not set'}
                    {doctor.room_number ? ` · Room ${doctor.room_number}` : ''}
                  </Text>
                </View>
                <Switch
                  value={doctor.availableLocal}
                  onValueChange={() => handleToggle(doctor)}
                  trackColor={{ false: '#d1d5db', true: Colors.green }}
                  thumbColor="#ffffff"
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Edit/Add Bottom Sheet Modal */}
      <Modal visible={sheetVisible} transparent animationType="none" onRequestClose={closeSheet}>
        <TouchableWithoutFeedback onPress={closeSheet}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView
          style={styles.sheetContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
          >
            {/* Sheet handle */}
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
              </Text>
              <TouchableOpacity onPress={closeSheet} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <FormField
                label="Full Name *"
                value={form.full_name}
                onChangeText={(v) => setForm((f) => ({ ...f, full_name: v }))}
                placeholder="Dr. Firstname Lastname"
              />
              <FormField
                label="Specialization"
                value={form.specialization}
                onChangeText={(v) => setForm((f) => ({ ...f, specialization: v }))}
                placeholder="e.g. Cardiology"
              />
              <FormField
                label="Qualification"
                value={form.qualification}
                onChangeText={(v) => setForm((f) => ({ ...f, qualification: v }))}
                placeholder="e.g. MBBS, MD"
              />
              <View style={styles.rowFields}>
                <View style={styles.halfField}>
                  <FormField
                    label="Experience (yrs)"
                    value={form.experience_years}
                    onChangeText={(v) => setForm((f) => ({ ...f, experience_years: v }))}
                    placeholder="5"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfField}>
                  <FormField
                    label="Fee (₹)"
                    value={form.consultation_fee}
                    onChangeText={(v) => setForm((f) => ({ ...f, consultation_fee: v }))}
                    placeholder="500"
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.rowFields}>
                <View style={styles.halfField}>
                  <FormField
                    label="Shift Start"
                    value={form.shift_start}
                    onChangeText={(v) => setForm((f) => ({ ...f, shift_start: v }))}
                    placeholder="09:00"
                  />
                </View>
                <View style={styles.halfField}>
                  <FormField
                    label="Shift End"
                    value={form.shift_end}
                    onChangeText={(v) => setForm((f) => ({ ...f, shift_end: v }))}
                    placeholder="14:00"
                  />
                </View>
              </View>
              <View style={styles.rowFields}>
                <View style={styles.halfField}>
                  <FormField
                    label="Room Number"
                    value={form.room_number}
                    onChangeText={(v) => setForm((f) => ({ ...f, room_number: v }))}
                    placeholder="Room 1"
                  />
                </View>
                <View style={styles.halfField}>
                  <FormField
                    label="Avatar Emoji"
                    value={form.avatar_emoji}
                    onChangeText={(v) => setForm((f) => ({ ...f, avatar_emoji: v }))}
                    placeholder="👨‍⚕️"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingDoctor ? 'Save Changes' : 'Add Doctor'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={fieldStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.muted}
        keyboardType={keyboardType ?? 'default'}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.sub,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.card,
  },
});

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
  doctorCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarEmoji: { fontSize: 24 },
  doctorInfo: { flex: 1 },
  doctorName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  doctorSpec: {
    fontSize: 13,
    color: ADMIN_MID,
    fontWeight: '500',
    marginBottom: 2,
  },
  doctorMeta: {
    fontSize: 12,
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

  // Bottom sheet
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: Colors.sub,
    fontWeight: '600',
  },
  sheetScroll: { flex: 1 },
  sheetScrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: { flex: 1 },
  saveBtn: {
    backgroundColor: ADMIN_MID,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
