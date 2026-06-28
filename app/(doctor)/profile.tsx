import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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
import { getDoctorByUserId } from '../../lib/api/doctors'
import { supabase } from '../../lib/supabase'
import { Input } from '../../components/ui/Input'
import { Doctor } from '../../types'

function InfoRow({
  label,
  value,
  editMode,
  field,
  onChange,
  placeholder,
  last,
}: {
  label: string
  value: string
  editMode: boolean
  field: string
  onChange: (field: string, val: string) => void
  placeholder?: string
  last?: boolean
}) {
  return (
    <View style={[rowStyles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={rowStyles.label}>{label}</Text>
      {editMode ? (
        <Input
          value={value}
          onChangeText={v => onChange(field, v)}
          placeholder={placeholder ?? label}
        />
      ) : (
        <Text style={rowStyles.value}>{value || '—'}</Text>
      )}
    </View>
  )
}

const rowStyles = StyleSheet.create({
  row: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
})

export default function DoctorProfileScreen() {
  const router = useRouter()
  const { profile, refreshProfile } = useAuth()

  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [loadingDoctor, setLoadingDoctor] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const [editFields, setEditFields] = useState({
    full_name: '',
    specialization: '',
    qualification: '',
    experience_years: '',
    consultation_fee: '',
    room_number: '',
  })

  useEffect(() => {
    const init = async () => {
      if (!profile?.id) return
      try {
        setLoadingDoctor(true)
        const doc = await getDoctorByUserId(profile.id)
        setDoctor(doc)
        if (doc) {
          setEditFields({
            full_name: doc.full_name ?? '',
            specialization: doc.specialization ?? '',
            qualification: doc.qualification ?? '',
            experience_years: doc.experience_years != null ? String(doc.experience_years) : '',
            consultation_fee: doc.consultation_fee != null ? String(doc.consultation_fee) : '',
            room_number: (doc as any).room_number ?? '',
          })
        }
      } finally {
        setLoadingDoctor(false)
      }
    }
    init()
  }, [profile?.id])

  function handleChange(field: string, val: string) {
    setEditFields(prev => ({ ...prev, [field]: val }))
  }

  function handleCancelEdit() {
    if (doctor) {
      setEditFields({
        full_name: doctor.full_name ?? '',
        specialization: doctor.specialization ?? '',
        qualification: doctor.qualification ?? '',
        experience_years: doctor.experience_years != null ? String(doctor.experience_years) : '',
        consultation_fee: doctor.consultation_fee != null ? String(doctor.consultation_fee) : '',
        room_number: (doctor as any).room_number ?? '',
      })
    }
    setEditMode(false)
  }

  async function handleSave() {
    if (!doctor) return
    try {
      setSaving(true)
      const { error } = await supabase
        .from('doctors')
        .update({
          full_name: editFields.full_name,
          specialization: editFields.specialization,
          qualification: editFields.qualification,
          experience_years: editFields.experience_years
            ? Number(editFields.experience_years)
            : null,
          consultation_fee: editFields.consultation_fee
            ? Number(editFields.consultation_fee)
            : null,
          room_number: editFields.room_number || null,
        })
        .eq('id', doctor.id)
      if (error) throw error

      // Also update profile full_name
      await supabase
        .from('profiles')
        .update({ full_name: editFields.full_name })
        .eq('id', profile!.id)

      await refreshProfile()
      const updated = await getDoctorByUserId(profile!.id)
      setDoctor(updated)
      setEditMode(false)
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save profile')
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

  const displayName = editMode ? editFields.full_name : (doctor?.full_name ?? profile?.full_name ?? 'Doctor')
  const avatarEmoji = (doctor as any)?.avatar_emoji ?? '👨‍⚕️'
  const specialization = editMode ? editFields.specialization : (doctor?.specialization ?? '')
  const qualification = editMode ? editFields.qualification : (doctor?.qualification ?? '')
  const experience = editMode
    ? editFields.experience_years
    : doctor?.experience_years != null ? String(doctor.experience_years) : ''
  const fee = editMode
    ? editFields.consultation_fee
    : doctor?.consultation_fee != null ? `₹${doctor.consultation_fee}` : ''
  const roomNumber = editMode
    ? editFields.room_number
    : (doctor as any)?.room_number ?? ''

  if (loadingDoctor) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.teal} />
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Teal gradient header */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
        </View>
        <Text style={styles.headerName}>{displayName}</Text>
        <Text style={styles.headerSpec}>{specialization || 'Doctor'}</Text>
        {!editMode && (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setEditMode(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Professional Info */}
        <Text style={styles.sectionTitle}>PROFESSIONAL INFORMATION</Text>
        <View style={styles.sectionCard}>
          {editMode ? (
            <>
              <InfoRow
                label="Full Name"
                value={editFields.full_name}
                editMode
                field="full_name"
                onChange={handleChange}
              />
              <InfoRow
                label="Specialization"
                value={editFields.specialization}
                editMode
                field="specialization"
                onChange={handleChange}
                placeholder="e.g. Cardiology"
              />
              <InfoRow
                label="Qualification"
                value={editFields.qualification}
                editMode
                field="qualification"
                onChange={handleChange}
                placeholder="e.g. MBBS, MD"
              />
              <InfoRow
                label="Experience (years)"
                value={editFields.experience_years}
                editMode
                field="experience_years"
                onChange={handleChange}
                placeholder="Years of experience"
              />
              <InfoRow
                label="Consultation Fee (₹)"
                value={editFields.consultation_fee}
                editMode
                field="consultation_fee"
                onChange={handleChange}
                placeholder="Fee in rupees"
              />
              <InfoRow
                label="Room Number"
                value={editFields.room_number}
                editMode
                field="room_number"
                onChange={handleChange}
                placeholder="e.g. 3A"
                last
              />
            </>
          ) : (
            <>
              <InfoRow
                label="Qualification"
                value={qualification}
                editMode={false}
                field=""
                onChange={() => {}}
              />
              <InfoRow
                label="Experience"
                value={experience ? `${experience} years` : '—'}
                editMode={false}
                field=""
                onChange={() => {}}
              />
              <InfoRow
                label="Consultation Fee"
                value={fee || '—'}
                editMode={false}
                field=""
                onChange={() => {}}
              />
              <InfoRow
                label="Room Number"
                value={roomNumber || '—'}
                editMode={false}
                field=""
                onChange={() => {}}
                last
              />
            </>
          )}
        </View>

        {/* Account info */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>ACCOUNT</Text>
        <View style={styles.sectionCard}>
          <InfoRow
            label="Email"
            value={profile?.email ?? '—'}
            editMode={false}
            field=""
            onChange={() => {}}
          />
          <InfoRow
            label="Phone"
            value={profile?.phone ?? '—'}
            editMode={false}
            field=""
            onChange={() => {}}
            last
          />
        </View>

        {/* Save / cancel */}
        {editMode && (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancelEdit}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

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
            <Text style={styles.signOutBtnText}>Sign Out</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.versionText}>WaitLess v1.0 · Doctor</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.muted,
  },
  header: {
    backgroundColor: '#0E8070',
    paddingTop: 16,
    paddingBottom: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarEmoji: {
    fontSize: 38,
  },
  headerName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSpec: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 14,
  },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  editBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.sub,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
    marginTop: 8,
  },
  saveBtn: {
    backgroundColor: '#0E8070',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  cancelBtn: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    color: Colors.sub,
    fontWeight: '700',
    fontSize: 15,
  },
  signOutBtn: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    marginTop: 8,
  },
  signOutBtnText: {
    color: Colors.red,
    fontWeight: '700',
    fontSize: 15,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.muted,
    marginTop: 4,
  },
})
