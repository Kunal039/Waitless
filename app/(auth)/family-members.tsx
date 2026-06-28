import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/colors';
import { FamilyMember, UserProfile } from '../../types';

type Gender = 'Male' | 'Female' | 'Other';
type Relationship = 'Spouse' | 'Parent' | 'Child' | 'Sibling' | 'Other';

const GENDERS: Gender[] = ['Male', 'Female', 'Other'];
const RELATIONSHIPS: Relationship[] = ['Spouse', 'Parent', 'Child', 'Sibling', 'Other'];

interface MemberFormState {
  fullName: string;
  age: string;
  gender: Gender | null;
  relationship: Relationship | null;
  phone: string;
}

const emptyForm: MemberFormState = {
  fullName: '',
  age: '',
  gender: null,
  relationship: null,
  phone: '',
};

export default function FamilyMembersScreen() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<MemberFormState>(emptyForm);
  const [savingMember, setSavingMember] = useState(false);
  const [loadingContinue, setLoadingContinue] = useState(false);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) setCurrentUser(data as UserProfile);
  }

  function openAddModal() {
    setForm(emptyForm);
    setModalVisible(true);
  }

  async function handleSaveMember() {
    if (!form.fullName.trim()) return Alert.alert('Required', 'Please enter full name.');
    if (!form.age || isNaN(Number(form.age))) return Alert.alert('Required', 'Please enter a valid age.');
    if (!form.gender) return Alert.alert('Required', 'Please select gender.');
    if (!form.relationship) return Alert.alert('Required', 'Please select relationship.');

    setSavingMember(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSavingMember(false);
      return Alert.alert('Session Expired', 'Please login again.');
    }

    const { data, error } = await supabase
      .from('family_members')
      .insert({
        user_id: user.id,
        full_name: form.fullName.trim(),
        age: Number(form.age),
        gender: form.gender,
        relationship: form.relationship,
        phone: form.phone.trim() || null,
      })
      .select()
      .single();

    setSavingMember(false);
    if (error) return Alert.alert('Error', error.message);
    setMembers((prev) => [...prev, data as FamilyMember]);
    setModalVisible(false);
  }

  async function handleContinue() {
    setLoadingContinue(true);
    router.replace('/(patient)/home');
  }

  const userInitial = currentUser?.full_name
    ? currentUser.full_name[0].toUpperCase()
    : '?';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add Family Members</Text>
          <Text style={styles.headerSubtitle}>You can add multiple members</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Current user card */}
          <View style={styles.memberCard}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>{userInitial}</Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>
                {currentUser?.full_name ?? 'You'}
              </Text>
              <Text style={styles.memberDetail}>
                {currentUser?.gender ?? ''}{currentUser?.age ? ` · ${currentUser.age} yrs` : ''}
              </Text>
            </View>
            <View style={styles.meBadge}>
              <Text style={styles.meBadgeText}>Me</Text>
            </View>
          </View>

          {/* Added members */}
          {members.map((member) => {
            const init = member.full_name ? member.full_name[0].toUpperCase() : '?';
            return (
              <View key={member.id} style={styles.memberCard}>
                <View style={[styles.memberAvatar, styles.memberAvatarSecondary]}>
                  <Text style={styles.memberAvatarText}>{init}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.full_name}</Text>
                  <Text style={styles.memberDetail}>
                    {member.relationship} · {member.age} yrs · {member.gender}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Add member button */}
          <TouchableOpacity
            style={styles.addMemberBtn}
            onPress={openAddModal}
            activeOpacity={0.7}
          >
            <View style={styles.addMemberIcon}>
              <Text style={styles.addMemberIconText}>+</Text>
            </View>
            <Text style={styles.addMemberText}>Add New Member</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.continueButton, loadingContinue && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={loadingContinue}
            activeOpacity={0.85}
          >
            {loadingContinue ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.continueButtonText}>Continue →</Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Add Member Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setModalVisible(false)}
            />
            <View style={styles.modalCard}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Family Member</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Member's full name"
                  placeholderTextColor={Colors.muted}
                  value={form.fullName}
                  onChangeText={(v) => setForm((f) => ({ ...f, fullName: v }))}
                  autoCapitalize="words"
                />

                <Text style={styles.fieldLabel}>Age</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Age"
                  placeholderTextColor={Colors.muted}
                  value={form.age}
                  onChangeText={(v) => setForm((f) => ({ ...f, age: v.replace(/[^0-9]/g, '') }))}
                  keyboardType="number-pad"
                  maxLength={3}
                />

                <Text style={styles.fieldLabel}>Gender</Text>
                <View style={styles.chipRow}>
                  {GENDERS.map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.chip, form.gender === g && styles.chipActive]}
                      onPress={() => setForm((f) => ({ ...f, gender: g }))}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, form.gender === g && styles.chipTextActive]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Relationship</Text>
                <View style={styles.chipRow}>
                  {RELATIONSHIPS.map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.chip, form.relationship === r && styles.chipActive]}
                      onPress={() => setForm((f) => ({ ...f, relationship: r }))}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, form.relationship === r && styles.chipTextActive]}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Phone (Optional)</Text>
                <TextInput
                  style={[styles.input, { marginBottom: 24 }]}
                  placeholder="Mobile number"
                  placeholderTextColor={Colors.muted}
                  value={form.phone}
                  onChangeText={(v) => setForm((f) => ({ ...f, phone: v.replace(/[^0-9]/g, '') }))}
                  keyboardType="phone-pad"
                  maxLength={10}
                />

                <TouchableOpacity
                  style={[styles.saveButton, savingMember && styles.saveButtonDisabled]}
                  onPress={handleSaveMember}
                  disabled={savingMember}
                  activeOpacity={0.85}
                >
                  {savingMember ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Member</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
  },
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  scrollContent: {
    padding: 20,
    gap: 12,
    paddingBottom: 32,
  },
  memberCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  memberAvatarSecondary: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  memberInfo: {
    flex: 1,
    gap: 3,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  memberDetail: {
    fontSize: 13,
    color: Colors.sub,
  },
  meBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  meBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: Colors.green,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#F0FDF4',
  },
  addMemberIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMemberIconText: {
    fontSize: 22,
    color: Colors.white,
    fontWeight: '600',
    lineHeight: 26,
  },
  addMemberText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.green,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  continueButtonDisabled: {
    opacity: 0.65,
  },
  continueButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  modalClose: {
    fontSize: 16,
    color: Colors.muted,
    padding: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.sub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.background,
    marginBottom: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  chipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.sub,
  },
  chipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
