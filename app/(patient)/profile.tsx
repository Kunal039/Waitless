import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { useAuth } from '../../lib/context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Input } from '../../components/ui/Input'
import { FamilyMember, UserProfile } from '../../types'

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('')
}

function InfoRow({
  label,
  value,
  editMode,
  field,
  onChangeField,
  placeholder,
}: {
  label: string
  value: string
  editMode: boolean
  field: string
  onChangeField: (field: string, value: string) => void
  placeholder?: string
}) {
  return (
    <View style={infoRowStyles.row}>
      <Text style={infoRowStyles.label}>{label}</Text>
      {editMode ? (
        <Input
          value={value}
          onChangeText={(v) => onChangeField(field, v)}
          placeholder={placeholder ?? label}
        />
      ) : (
        <Text style={infoRowStyles.value}>{value || '—'}</Text>
      )}
    </View>
  )
}

const infoRowStyles = StyleSheet.create({
  row: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.sub,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
})

export default function PatientProfileScreen() {
  const router = useRouter()
  const { profile, refreshProfile } = useAuth()

  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editFields, setEditFields] = useState({
    full_name: '',
    phone: '',
    age: '',
    gender: '',
    city: '',
  })

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [familyLoading, setFamilyLoading] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (profile) {
      setEditFields({
        full_name: profile.full_name ?? '',
        phone: profile.phone ?? '',
        age: profile.age != null ? String(profile.age) : '',
        gender: profile.gender ?? '',
        city: profile.city ?? '',
      })
    }
  }, [profile])

  const loadFamilyMembers = useCallback(async () => {
    if (!profile?.id) return
    try {
      setFamilyLoading(true)
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: true })
      if (error) throw error
      setFamilyMembers(data ?? [])
    } catch {
      // silently fail
    } finally {
      setFamilyLoading(false)
    }
  }, [profile?.id])

  useEffect(() => {
    loadFamilyMembers()
  }, [loadFamilyMembers])

  function handleChangeField(field: string, value: string) {
    setEditFields(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!profile?.id) return
    try {
      setSaving(true)
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editFields.full_name,
          phone: editFields.phone,
          age: editFields.age ? Number(editFields.age) : null,
          gender: editFields.gender,
          city: editFields.city,
        })
        .eq('id', profile.id)
      if (error) throw error
      await refreshProfile()
      setEditMode(false)
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  function handleCancelEdit() {
    if (profile) {
      setEditFields({
        full_name: profile.full_name ?? '',
        phone: profile.phone ?? '',
        age: profile.age != null ? String(profile.age) : '',
        gender: profile.gender ?? '',
        city: profile.city ?? '',
      })
    }
    setEditMode(false)
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            setSigningOut(true)
            await supabase.auth.signOut()
            router.replace('/(auth)/welcome')
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Failed to sign out')
            setSigningOut(false)
          }
        },
      },
    ])
  }

  async function handleDeleteFamilyMember(memberId: string) {
    Alert.alert('Remove Member', 'Remove this family member?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('family_members')
              .delete()
              .eq('id', memberId)
            if (error) throw error
            await loadFamilyMembers()
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Failed to remove member')
          }
        },
      },
    ])
  }

  const displayName = editMode ? editFields.full_name : (profile?.full_name ?? '')
  const initials = displayName ? getInitials(displayName) : '?'

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Blue gradient header */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
        <Text style={styles.headerName} numberOfLines={1}>
          {profile?.full_name ?? 'Patient'}
        </Text>
        <Text style={styles.headerPhone}>
          {profile?.phone ?? profile?.email ?? ''}
        </Text>
        {!editMode && (
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => setEditMode(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Personal info section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PERSONAL INFORMATION</Text>
          <View style={styles.sectionCard}>
            <InfoRow
              label="Full Name"
              value={editMode ? editFields.full_name : (profile?.full_name ?? '')}
              editMode={editMode}
              field="full_name"
              onChangeField={handleChangeField}
            />
            <InfoRow
              label="Phone"
              value={editMode ? editFields.phone : (profile?.phone ?? '')}
              editMode={editMode}
              field="phone"
              onChangeField={handleChangeField}
              placeholder="Phone number"
            />
            <InfoRow
              label="Email"
              value={profile?.email ?? ''}
              editMode={false}
              field="email"
              onChangeField={handleChangeField}
            />
            <InfoRow
              label="Age"
              value={editMode ? editFields.age : (profile?.age != null ? String(profile.age) : '')}
              editMode={editMode}
              field="age"
              onChangeField={handleChangeField}
              placeholder="Your age"
            />
            <InfoRow
              label="Gender"
              value={editMode ? editFields.gender : (profile?.gender ?? '')}
              editMode={editMode}
              field="gender"
              onChangeField={handleChangeField}
              placeholder="e.g. Male / Female / Other"
            />
            <View style={[infoRowStyles.row, { borderBottomWidth: 0 }]}>
              <Text style={infoRowStyles.label}>City</Text>
              {editMode ? (
                <Input
                  value={editFields.city}
                  onChangeText={(v) => handleChangeField('city', v)}
                  placeholder="Your city"
                />
              ) : (
                <Text style={infoRowStyles.value}>{profile?.city || '—'}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Edit mode save/cancel buttons */}
        {editMode && (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelEditBtn}
              onPress={handleCancelEdit}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelEditBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Family members section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>FAMILY MEMBERS</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.addLink}>+ Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sectionCard}>
            {familyLoading ? (
              <View style={styles.familyLoading}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : familyMembers.length === 0 ? (
              <View style={styles.familyEmpty}>
                <Text style={styles.familyEmptyEmoji}>👨‍👩‍👧‍👦</Text>
                <Text style={styles.familyEmptyText}>No family members added</Text>
                <Text style={styles.familyEmptySub}>
                  Add members to book appointments on their behalf
                </Text>
              </View>
            ) : (
              familyMembers.map((member, idx) => (
                <View
                  key={member.id}
                  style={[
                    styles.familyRow,
                    idx === familyMembers.length - 1 && styles.familyRowLast,
                  ]}
                >
                  <View style={styles.familyAvatar}>
                    <Text style={styles.familyAvatarText}>
                      {getInitials(member.full_name)}
                    </Text>
                  </View>
                  <View style={styles.familyInfo}>
                    <Text style={styles.familyName}>{member.full_name}</Text>
                    <Text style={styles.familyMeta}>
                      {member.relationship} · {member.age} yrs · {member.gender}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.familyDeleteBtn}
                    onPress={() => handleDeleteFamilyMember(member.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.familyDeleteText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Notification settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
          <View style={styles.sectionCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Appointment Notifications</Text>
                <Text style={styles.settingSub}>Get alerts for queue updates</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          disabled={signingOut}
          activeOpacity={0.85}
        >
          {signingOut ? (
            <ActivityIndicator size="small" color={Colors.red} />
          ) : (
            <Text style={styles.signOutText}>Sign Out</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.versionText}>WaitLess v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primaryDark,
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.white,
  },
  headerName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
  },
  headerPhone: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 14,
  },
  editProfileBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  editProfileBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.sub,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addLink: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  editActions: {
    gap: 10,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  cancelEditBtn: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cancelEditBtnText: {
    color: Colors.sub,
    fontWeight: '700',
    fontSize: 15,
  },
  // Family
  familyLoading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  familyEmpty: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  familyEmptyEmoji: {
    fontSize: 36,
  },
  familyEmptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  familyEmptySub: {
    fontSize: 12,
    color: Colors.muted,
    textAlign: 'center',
  },
  familyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  familyRowLast: {
    borderBottomWidth: 0,
  },
  familyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  familyAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  familyInfo: {
    flex: 1,
  },
  familyName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  familyMeta: {
    fontSize: 12,
    color: Colors.muted,
    textTransform: 'capitalize',
  },
  familyDeleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  familyDeleteText: {
    fontSize: 12,
    color: Colors.red,
    fontWeight: '700',
  },
  // Settings
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  settingLeft: {
    flex: 1,
    paddingRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  settingSub: {
    fontSize: 12,
    color: Colors.muted,
  },
  // Sign out
  signOutBtn: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  signOutText: {
    color: Colors.red,
    fontWeight: '700',
    fontSize: 15,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.muted,
  },
})
