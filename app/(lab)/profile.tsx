import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { useAuth } from '../../lib/context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Input } from '../../components/ui/Input'
import { Lab } from '../../types/lab'

interface InfoRowProps {
  label: string
  value: string
  emoji: string
}

function InfoRow({ label, value, emoji }: InfoRowProps) {
  return (
    <View style={infoRowStyles.row}>
      <View style={infoRowStyles.iconBox}>
        <Text style={infoRowStyles.emoji}>{emoji}</Text>
      </View>
      <View style={infoRowStyles.content}>
        <Text style={infoRowStyles.label}>{label}</Text>
        <Text style={infoRowStyles.value}>{value || '—'}</Text>
      </View>
    </View>
  )
}

const infoRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 14,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EDE9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 18 },
  content: { flex: 1 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  value: { fontSize: 15, fontWeight: '600', color: Colors.text },
})

interface EditForm {
  name: string
  address: string
  city: string
  phone: string
  email: string
  opening_time: string
  closing_time: string
}

export default function LabProfileScreen() {
  const router = useRouter()
  const { profile } = useAuth()

  const [lab, setLab] = useState<Lab | null>(null)
  const [loading, setLoading] = useState(true)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    opening_time: '',
    closing_time: '',
  })
  const [saving, setSaving] = useState(false)

  const loadLab = useCallback(async () => {
    if (!profile?.id) return
    try {
      const { data, error } = await supabase
        .from('labs')
        .select('*')
        .eq('user_id', profile.id)
        .single()
      if (error) throw error
      setLab(data)
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load lab profile')
    } finally {
      setLoading(false)
    }
  }, [profile?.id])

  useEffect(() => { loadLab() }, [loadLab])

  function openEditModal() {
    if (!lab) return
    setEditForm({
      name: lab.name,
      address: lab.address,
      city: lab.city,
      phone: lab.phone,
      email: lab.email ?? '',
      opening_time: lab.opening_time,
      closing_time: lab.closing_time,
    })
    setEditModalVisible(true)
  }

  async function handleSave() {
    if (!lab) return
    if (!editForm.name.trim()) {
      Alert.alert('Validation', 'Lab name is required')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('labs')
        .update({
          name: editForm.name.trim(),
          address: editForm.address.trim(),
          city: editForm.city.trim(),
          phone: editForm.phone.trim(),
          email: editForm.email.trim() || null,
          opening_time: editForm.opening_time.trim(),
          closing_time: editForm.closing_time.trim(),
        })
        .eq('id', lab.id)
      if (error) throw error
      await loadLab()
      setEditModalVisible(false)
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          router.replace('/(auth)/welcome')
        },
      },
    ])
  }

  function formatTime(t: string): string {
    if (!t) return ''
    const [h, m] = t.split(':')
    const hour = parseInt(h, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${m} ${ampm}`
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.purple} />
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Purple gradient header */}
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>🧪</Text>
          </View>
          <Text style={styles.labName}>{lab?.name ?? 'Your Lab'}</Text>
          <Text style={styles.labCity}>{lab?.city ?? ''}</Text>
          <View style={styles.activeBadge}>
            <View style={[styles.activeDot, { backgroundColor: lab?.is_active ? Colors.green : Colors.muted }]} />
            <Text style={styles.activeBadgeText}>
              {lab?.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Lab Information</Text>
          <InfoRow label="Address" value={lab?.address ?? ''} emoji="📍" />
          <InfoRow label="City" value={lab?.city ?? ''} emoji="🏙️" />
          <InfoRow label="Phone" value={lab?.phone ?? ''} emoji="📞" />
          <InfoRow label="Email" value={lab?.email ?? ''} emoji="✉️" />
          <InfoRow
            label="Opening Time"
            value={formatTime(lab?.opening_time ?? '')}
            emoji="🌅"
          />
          <InfoRow
            label="Closing Time"
            value={formatTime(lab?.closing_time ?? '')}
            emoji="🌇"
          />
        </View>

        {/* Edit Button */}
        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={openEditModal}
          activeOpacity={0.8}
        >
          <Text style={styles.editProfileBtnText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Account section */}
        <View style={styles.accountCard}>
          <Text style={styles.cardTitle}>Account</Text>
          <View style={infoRowStyles.row}>
            <View style={infoRowStyles.iconBox}>
              <Text style={infoRowStyles.emoji}>👤</Text>
            </View>
            <View style={infoRowStyles.content}>
              <Text style={infoRowStyles.label}>Admin Name</Text>
              <Text style={infoRowStyles.value}>{profile?.full_name ?? '—'}</Text>
            </View>
          </View>
          <View style={[infoRowStyles.row, { borderBottomWidth: 0 }]}>
            <View style={infoRowStyles.iconBox}>
              <Text style={infoRowStyles.emoji}>📧</Text>
            </View>
            <View style={infoRowStyles.content}>
              <Text style={infoRowStyles.label}>Email</Text>
              <Text style={infoRowStyles.value}>{profile?.email ?? '—'}</Text>
            </View>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={styles.signOutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Edit Lab Profile</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Lab Name *</Text>
                <Input
                  placeholder="Lab name"
                  value={editForm.name}
                  onChangeText={(v) => setEditForm((f) => ({ ...f, name: v }))}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Address</Text>
                <Input
                  placeholder="Street address"
                  value={editForm.address}
                  onChangeText={(v) => setEditForm((f) => ({ ...f, address: v }))}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>City</Text>
                <Input
                  placeholder="City"
                  value={editForm.city}
                  onChangeText={(v) => setEditForm((f) => ({ ...f, city: v }))}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Phone</Text>
                <Input
                  placeholder="Phone number"
                  value={editForm.phone}
                  onChangeText={(v) => setEditForm((f) => ({ ...f, phone: v }))}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Email</Text>
                <Input
                  placeholder="Email address"
                  value={editForm.email}
                  onChangeText={(v) => setEditForm((f) => ({ ...f, email: v }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.fieldLabel}>Opening Time</Text>
                  <Input
                    placeholder="HH:MM (e.g. 08:00)"
                    value={editForm.opening_time}
                    onChangeText={(v) => setEditForm((f) => ({ ...f, opening_time: v }))}
                  />
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.fieldLabel}>Closing Time</Text>
                  <Input
                    placeholder="HH:MM (e.g. 20:00)"
                    value={editForm.closing_time}
                    onChangeText={(v) => setEditForm((f) => ({ ...f, closing_time: v }))}
                  />
                </View>
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.card} />
                ) : (
                  <Text style={styles.modalSaveText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: Colors.muted },
  header: {
    backgroundColor: '#4C3BA0',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 8,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarEmoji: { fontSize: 40 },
  labName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  labCity: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
    marginTop: 4,
  },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  activeBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.sub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  accountCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
  },
  editProfileBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.purple,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  editProfileBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  signOutBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  signOutBtnText: { color: Colors.red, fontWeight: '700', fontSize: 16 },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 20 },
  modalScroll: { flexGrow: 0 },
  formGroup: { marginBottom: 16, gap: 6 },
  formRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  formGroupHalf: { flex: 1, gap: 6 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.sub,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  modalCancelText: { color: Colors.sub, fontWeight: '700', fontSize: 15 },
  modalSaveBtn: {
    flex: 2,
    backgroundColor: Colors.purple,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
})
