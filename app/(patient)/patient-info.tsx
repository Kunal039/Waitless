import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { useAuth } from '../../lib/context/AuthContext'
import { useBooking } from '../../lib/context/BookingContext'
import { supabase } from '../../lib/supabase'
import { FamilyMember } from '../../types'

const REASON_OPTIONS = [
  'General Checkup',
  'Fever / Flu',
  'Back / Joint Pain',
  'Heart / Chest Pain',
  'Digestive Issues',
  'Skin Problem',
  'Eye / Ear Concern',
  'Mental Health',
  'Other',
]

const ILLNESS_OPTIONS = [
  'None',
  'Diabetes',
  'Hypertension',
  'Heart Disease',
  'Asthma',
  'Thyroid Disorder',
  'Kidney Disease',
  'Other',
]

const GENDER_OPTIONS = ['Male', 'Female', 'Other']

export default function PatientInfoScreen() {
  const router = useRouter()
  const { profile } = useAuth()
  const { setPatientInfo } = useBooking()

  const [isSelf, setIsSelf] = useState(true)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null)
  const [loadingFamily, setLoadingFamily] = useState(false)
  const [showFamilyPicker, setShowFamilyPicker] = useState(false)
  const [showReasonPicker, setShowReasonPicker] = useState(false)
  const [showIllnessPicker, setShowIllnessPicker] = useState(false)
  const [showGenderPicker, setShowGenderPicker] = useState(false)

  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [phone, setPhone] = useState('')
  const [reason, setReason] = useState('')
  const [illness, setIllness] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load family members
  useEffect(() => {
    async function loadFamily() {
      if (!profile) return
      try {
        setLoadingFamily(true)
        const { data, error } = await supabase
          .from('family_members')
          .select('*')
          .eq('user_id', profile.id)
          .order('full_name')
        if (!error && data) setFamilyMembers(data)
      } finally {
        setLoadingFamily(false)
      }
    }
    loadFamily()
  }, [profile])

  // Pre-fill when switching to self
  useEffect(() => {
    if (isSelf && profile) {
      setName(profile.full_name ?? '')
      setAge(profile.age ? String(profile.age) : '')
      setGender(profile.gender ?? '')
      setPhone(profile.phone ?? '')
      setSelectedFamilyId(null)
    } else if (!isSelf) {
      setName('')
      setAge('')
      setGender('')
      setPhone('')
    }
  }, [isSelf, profile])

  // Fill from selected family member
  useEffect(() => {
    if (!isSelf && selectedFamilyId) {
      const member = familyMembers.find(m => m.id === selectedFamilyId)
      if (member) {
        setName(member.full_name)
        setAge(String(member.age))
        setGender(member.gender)
        setPhone(member.phone ?? '')
      }
    }
  }, [selectedFamilyId, familyMembers, isSelf])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required'
    if (!age.trim() || isNaN(Number(age)) || Number(age) <= 0) e.age = 'Valid age required'
    if (!gender) e.gender = 'Gender is required'
    if (!phone.trim() || phone.length < 10) e.phone = 'Valid phone number required'
    if (!reason) e.reason = 'Reason for visit is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleContinue() {
    if (!validate()) return
    setPatientInfo({
      name: name.trim(),
      age: age.trim(),
      gender,
      phone: phone.trim(),
      reason,
      isSelf,
      familyMemberId: selectedFamilyId ?? undefined,
    })
    router.push('/(patient)/appointment-summary')
  }

  const selectedFamily = familyMembers.find(m => m.id === selectedFamilyId)

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Patient Information</Text>
          <Text style={styles.headerSub}>Who is this appointment for?</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Who is this for */}
        <Text style={styles.sectionLabel}>APPOINTMENT FOR</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={[styles.radioOption, isSelf && styles.radioOptionSelected]}
            onPress={() => setIsSelf(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.radioCircle, isSelf && styles.radioCircleSelected]}>
              {isSelf && <View style={styles.radioInner} />}
            </View>
            <View style={styles.radioTextGroup}>
              <Text style={[styles.radioTitle, isSelf && styles.radioTitleSelected]}>
                Myself
              </Text>
              <Text style={styles.radioSub}>{profile?.full_name ?? 'You'}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.radioOption, !isSelf && styles.radioOptionSelected]}
            onPress={() => setIsSelf(false)}
            activeOpacity={0.8}
          >
            <View style={[styles.radioCircle, !isSelf && styles.radioCircleSelected]}>
              {!isSelf && <View style={styles.radioInner} />}
            </View>
            <View style={styles.radioTextGroup}>
              <Text style={[styles.radioTitle, !isSelf && styles.radioTitleSelected]}>
                Someone Else
              </Text>
              <Text style={styles.radioSub}>Family member or other</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Family member picker */}
        {!isSelf && (
          <View style={styles.familyPickerSection}>
            <Text style={styles.sectionLabel}>SELECT FAMILY MEMBER</Text>
            {loadingFamily ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: 12 }} />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => setShowFamilyPicker(!showFamilyPicker)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dropdownText, !selectedFamily && styles.dropdownPlaceholder]}>
                    {selectedFamily ? `${selectedFamily.full_name} (${selectedFamily.relationship})` : 'Select family member'}
                  </Text>
                  <Text style={styles.dropdownChevron}>{showFamilyPicker ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {showFamilyPicker && (
                  <View style={styles.dropdownList}>
                    {familyMembers.map(member => (
                      <TouchableOpacity
                        key={member.id}
                        style={[styles.dropdownItem, selectedFamilyId === member.id && styles.dropdownItemSelected]}
                        onPress={() => {
                          setSelectedFamilyId(member.id)
                          setShowFamilyPicker(false)
                        }}
                      >
                        <Text style={[styles.dropdownItemText, selectedFamilyId === member.id && styles.dropdownItemTextSelected]}>
                          {member.full_name}
                        </Text>
                        <Text style={styles.dropdownItemSub}>{member.relationship} · {member.age}y · {member.gender}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={styles.addNewItem}
                      onPress={() => {
                        setShowFamilyPicker(false)
                        setSelectedFamilyId(null)
                      }}
                    >
                      <Text style={styles.addNewText}>+ Enter details manually</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Form fields */}
        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>PATIENT DETAILS</Text>

        {/* Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Full Name *</Text>
          <TextInput
            style={[styles.textInput, errors.name ? styles.textInputError : null]}
            value={name}
            onChangeText={v => { setName(v); if (errors.name) setErrors(e => ({ ...e, name: '' })) }}
            placeholder="Enter full name"
            placeholderTextColor={Colors.muted}
          />
          {errors.name ? <Text style={styles.errorMsg}>{errors.name}</Text> : null}
        </View>

        {/* Age & Gender row */}
        <View style={styles.rowFields}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Age *</Text>
            <TextInput
              style={[styles.textInput, errors.age ? styles.textInputError : null]}
              value={age}
              onChangeText={v => { setAge(v); if (errors.age) setErrors(e => ({ ...e, age: '' })) }}
              placeholder="Age"
              placeholderTextColor={Colors.muted}
              keyboardType="numeric"
              maxLength={3}
            />
            {errors.age ? <Text style={styles.errorMsg}>{errors.age}</Text> : null}
          </View>

          <View style={[styles.fieldGroup, { flex: 1.6 }]}>
            <Text style={styles.fieldLabel}>Gender *</Text>
            <TouchableOpacity
              style={[styles.dropdownBtn, errors.gender ? styles.textInputError : null]}
              onPress={() => setShowGenderPicker(!showGenderPicker)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dropdownText, !gender && styles.dropdownPlaceholder]}>
                {gender || 'Select gender'}
              </Text>
              <Text style={styles.dropdownChevron}>{showGenderPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showGenderPicker && (
              <View style={styles.dropdownList}>
                {GENDER_OPTIONS.map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.dropdownItem, gender === g && styles.dropdownItemSelected]}
                    onPress={() => { setGender(g); setShowGenderPicker(false); if (errors.gender) setErrors(e => ({ ...e, gender: '' })) }}
                  >
                    <Text style={[styles.dropdownItemText, gender === g && styles.dropdownItemTextSelected]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {errors.gender ? <Text style={styles.errorMsg}>{errors.gender}</Text> : null}
          </View>
        </View>

        {/* Phone */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Mobile Number *</Text>
          <TextInput
            style={[styles.textInput, errors.phone ? styles.textInputError : null]}
            value={phone}
            onChangeText={v => { setPhone(v); if (errors.phone) setErrors(e => ({ ...e, phone: '' })) }}
            placeholder="10-digit mobile number"
            placeholderTextColor={Colors.muted}
            keyboardType="phone-pad"
            maxLength={13}
          />
          {errors.phone ? <Text style={styles.errorMsg}>{errors.phone}</Text> : null}
        </View>

        {/* Reason */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Reason for Visit *</Text>
          <TouchableOpacity
            style={[styles.dropdownBtn, errors.reason ? styles.textInputError : null]}
            onPress={() => setShowReasonPicker(!showReasonPicker)}
            activeOpacity={0.8}
          >
            <Text style={[styles.dropdownText, !reason && styles.dropdownPlaceholder]}>
              {reason || 'Select reason'}
            </Text>
            <Text style={styles.dropdownChevron}>{showReasonPicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showReasonPicker && (
            <View style={styles.dropdownList}>
              {REASON_OPTIONS.map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.dropdownItem, reason === r && styles.dropdownItemSelected]}
                  onPress={() => { setReason(r); setShowReasonPicker(false); if (errors.reason) setErrors(e => ({ ...e, reason: '' })) }}
                >
                  <Text style={[styles.dropdownItemText, reason === r && styles.dropdownItemTextSelected]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {errors.reason ? <Text style={styles.errorMsg}>{errors.reason}</Text> : null}
        </View>

        {/* Previous illness */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Any Previous Illness</Text>
          <TouchableOpacity
            style={styles.dropdownBtn}
            onPress={() => setShowIllnessPicker(!showIllnessPicker)}
            activeOpacity={0.8}
          >
            <Text style={[styles.dropdownText, !illness && styles.dropdownPlaceholder]}>
              {illness || 'None / Select if applicable'}
            </Text>
            <Text style={styles.dropdownChevron}>{showIllnessPicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showIllnessPicker && (
            <View style={styles.dropdownList}>
              {ILLNESS_OPTIONS.map(il => (
                <TouchableOpacity
                  key={il}
                  style={[styles.dropdownItem, illness === il && styles.dropdownItemSelected]}
                  onPress={() => { setIllness(il); setShowIllnessPicker(false) }}
                >
                  <Text style={[styles.dropdownItemText, illness === il && styles.dropdownItemTextSelected]}>{il}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>Save & Continue →</Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  backBtnText: {
    color: Colors.white,
    fontSize: 18,
    lineHeight: 22,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.sub,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  radioGroup: {
    gap: 10,
    marginBottom: 20,
  },
  radioOption: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  radioTextGroup: {
    flex: 1,
  },
  radioTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  radioTitleSelected: {
    color: Colors.primary,
  },
  radioSub: {
    fontSize: 12,
    color: Colors.muted,
  },
  familyPickerSection: {
    marginBottom: 8,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.sub,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.text,
  },
  textInputError: {
    borderColor: Colors.red,
  },
  errorMsg: {
    fontSize: 12,
    color: Colors.red,
    marginTop: 4,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  dropdownBtn: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  dropdownPlaceholder: {
    color: Colors.muted,
  },
  dropdownChevron: {
    fontSize: 10,
    color: Colors.muted,
    marginLeft: 8,
  },
  dropdownList: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  dropdownItemSelected: {
    backgroundColor: Colors.primaryLight,
  },
  dropdownItemText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  dropdownItemTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  dropdownItemSub: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  addNewItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  addNewText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 16,
  },
  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  continueBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
})
