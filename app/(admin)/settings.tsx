import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

interface HospitalProfile {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  opening_time: string;
  closing_time: string;
}

interface SettingsItem {
  iconBg: string;
  emoji: string;
  title: string;
  subtitle: string;
  action: () => void;
}

export default function SettingsScreen() {
  const { profile } = useAuth();
  const [hospitalProfile, setHospitalProfile] = useState<HospitalProfile | null>(null);
  const [loadingHospital, setLoadingHospital] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    phone: '',
    opening_time: '',
    closing_time: '',
  });

  const fetchHospital = useCallback(async () => {
    try {
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('hospital_id')
        .eq('id', profile?.id ?? '')
        .maybeSingle();

      if (!adminProfile?.hospital_id) return;

      const { data } = await supabase
        .from('hospitals')
        .select('id, name, address, city, phone, opening_time, closing_time')
        .eq('id', adminProfile.hospital_id)
        .maybeSingle();

      if (data) setHospitalProfile(data as HospitalProfile);
    } catch (_e) {
      // Non-fatal
    } finally {
      setLoadingHospital(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchHospital();
  }, [fetchHospital]);

  const openEditModal = () => {
    if (!hospitalProfile) {
      Alert.alert('Not loaded', 'Hospital profile is still loading');
      return;
    }
    setForm({
      name: hospitalProfile.name ?? '',
      address: hospitalProfile.address ?? '',
      city: hospitalProfile.city ?? '',
      phone: hospitalProfile.phone ?? '',
      opening_time: hospitalProfile.opening_time ?? '',
      closing_time: hospitalProfile.closing_time ?? '',
    });
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!form.name.trim()) {
      Alert.alert('Validation', 'Hospital name is required');
      return;
    }
    if (!hospitalProfile?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('hospitals')
        .update({
          name: form.name.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          phone: form.phone.trim(),
          opening_time: form.opening_time.trim(),
          closing_time: form.closing_time.trim(),
        })
        .eq('id', hospitalProfile.id);
      if (error) throw error;
      await fetchHospital();
      setEditModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const settingsItems: SettingsItem[] = [
    {
      iconBg: '#dbeafe',
      emoji: '🏥',
      title: 'Hospital Profile',
      subtitle: hospitalProfile?.name ?? 'Name, address, contact',
      action: openEditModal,
    },
    {
      iconBg: '#ede9fe',
      emoji: '🕐',
      title: 'OPD Timings',
      subtitle: hospitalProfile?.opening_time && hospitalProfile?.closing_time
        ? `${hospitalProfile.opening_time} – ${hospitalProfile.closing_time}`
        : 'Mon–Sat · 9:00 AM – 6:00 PM',
      action: () => Alert.alert('OPD Timings', 'Edit timings via Hospital Profile'),
    },
    {
      iconBg: '#dcfce7',
      emoji: '💰',
      title: 'Consultation Fees',
      subtitle: 'General: ₹300 · Specialist: ₹500',
      action: () => Alert.alert('Consultation Fees', 'Fee configuration coming soon'),
    },
    {
      iconBg: '#fef9c3',
      emoji: '🔔',
      title: 'Notifications',
      subtitle: 'SMS, push alerts to patients',
      action: () => Alert.alert('Notifications', 'Notification settings coming soon'),
    },
    {
      iconBg: '#fce7f3',
      emoji: '👥',
      title: 'Staff Accounts',
      subtitle: '3 reception staff accounts',
      action: () => Alert.alert('Staff Accounts', 'Staff management coming soon'),
    },
    {
      iconBg: '#fff3e0',
      emoji: '🎫',
      title: 'Token System',
      subtitle: 'Auto-reset daily at midnight',
      action: () => Alert.alert('Token System', 'Token configuration coming soon'),
    },
    {
      iconBg: '#f1f5f9',
      emoji: '📱',
      title: 'App Appearance',
      subtitle: 'Theme, logo, colours',
      action: () => Alert.alert('App Appearance', 'Appearance settings coming soon'),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hospital Settings</Text>
          <Text style={styles.headerSubtitle}>
            {loadingHospital ? 'Loading…' : hospitalProfile?.name ?? 'Configuration'}
          </Text>
        </View>

        {/* Hospital info summary card */}
        {!loadingHospital && hospitalProfile && (
          <View style={styles.infoCard}>
            <View style={styles.infoCardLeft}>
              <Text style={styles.infoCardEmoji}>🏥</Text>
            </View>
            <View style={styles.infoCardRight}>
              <Text style={styles.infoCardName}>{hospitalProfile.name}</Text>
              <Text style={styles.infoCardAddress}>
                {hospitalProfile.address}, {hospitalProfile.city}
              </Text>
              {hospitalProfile.phone ? (
                <Text style={styles.infoCardPhone}>{hospitalProfile.phone}</Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={openEditModal} style={styles.editChip}>
              <Text style={styles.editChipText}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
        {loadingHospital && (
          <ActivityIndicator color={ADMIN_MID} style={{ marginVertical: 16 }} />
        )}

        {/* Settings List */}
        <Text style={styles.sectionLabel}>CONFIGURATION</Text>
        <View style={styles.settingsCard}>
          {settingsItems.map((item, index) => (
            <TouchableOpacity
              key={item.title}
              style={[
                styles.settingsItem,
                index < settingsItems.length - 1 && styles.settingsItemBorder,
              ]}
              onPress={item.action}
              activeOpacity={0.75}
            >
              <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
                <Text style={styles.iconEmoji}>{item.emoji}</Text>
              </View>
              <View style={styles.itemTextContainer}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSubtitle} numberOfLines={1}>{item.subtitle}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Edit Hospital Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Hospital Profile</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <FormField
                label="Hospital Name *"
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="ABC Hospital"
              />
              <FormField
                label="Address"
                value={form.address}
                onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
                placeholder="123 Main Street"
              />
              <FormField
                label="City"
                value={form.city}
                onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
                placeholder="Mumbai"
              />
              <FormField
                label="Phone"
                value={form.phone}
                onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
                placeholder="+91 98765 43210"
                keyboardType="phone-pad"
              />
              <View style={styles.rowFields}>
                <View style={styles.halfField}>
                  <FormField
                    label="Opening Time"
                    value={form.opening_time}
                    onChangeText={(v) => setForm((f) => ({ ...f, opening_time: v }))}
                    placeholder="09:00"
                  />
                </View>
                <View style={styles.halfField}>
                  <FormField
                    label="Closing Time"
                    value={form.closing_time}
                    onChangeText={(v) => setForm((f) => ({ ...f, closing_time: v }))}
                    placeholder="18:00"
                  />
                </View>
              </View>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSaveProfile}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
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
  keyboardType?: 'default' | 'phone-pad' | 'numeric';
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

  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoCardLeft: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoCardEmoji: { fontSize: 24 },
  infoCardRight: { flex: 1 },
  infoCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  infoCardAddress: {
    fontSize: 12,
    color: Colors.sub,
    marginBottom: 1,
  },
  infoCardPhone: {
    fontSize: 12,
    color: Colors.muted,
  },
  editChip: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  editChipText: {
    color: ADMIN_MID,
    fontSize: 13,
    fontWeight: '700',
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.sub,
    letterSpacing: 0.8,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 10,
  },

  settingsCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginHorizontal: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconEmoji: { fontSize: 20 },
  itemTextContainer: { flex: 1 },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 12,
    color: Colors.sub,
  },
  chevron: {
    fontSize: 22,
    color: '#9ca3af',
    fontWeight: '300',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: 14,
    color: Colors.sub,
    fontWeight: '600',
  },
  modalScroll: { flex: 1 },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 40,
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
