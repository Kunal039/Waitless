import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from '../../constants/colors'
import { useAuth } from '../../lib/context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { LabTest } from '../../types/lab'

interface TestForm {
  name: string
  description: string
  price: string
  result_time_hours: string
  preparation_info: string
}

const EMPTY_FORM: TestForm = {
  name: '',
  description: '',
  price: '',
  result_time_hours: '',
  preparation_info: '',
}

export default function LabTestsScreen() {
  const { profile } = useAuth()

  const [labId, setLabId] = useState<string | null>(null)
  const [tests, setTests] = useState<LabTest[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingTest, setEditingTest] = useState<LabTest | null>(null)
  const [form, setForm] = useState<TestForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const loadLabId = useCallback(async () => {
    if (!profile?.id) return
    const { data } = await supabase
      .from('labs')
      .select('id')
      .eq('user_id', profile.id)
      .single()
    if (data) setLabId(data.id)
  }, [profile?.id])

  useEffect(() => { loadLabId() }, [loadLabId])

  const loadTests = useCallback(async () => {
    if (!labId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('lab_tests')
        .select('*')
        .eq('lab_id', labId)
        .order('name', { ascending: true })
      if (error) throw error
      setTests(data ?? [])
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load tests')
    } finally {
      setLoading(false)
    }
  }, [labId])

  useEffect(() => { loadTests() }, [loadTests])

  function openAddModal() {
    setEditingTest(null)
    setForm(EMPTY_FORM)
    setModalVisible(true)
  }

  function openEditModal(test: LabTest) {
    setEditingTest(test)
    setForm({
      name: test.name,
      description: test.description ?? '',
      price: String(test.price),
      result_time_hours: String(test.result_time_hours),
      preparation_info: test.preparation_info ?? '',
    })
    setModalVisible(true)
  }

  function closeModal() {
    setModalVisible(false)
    setEditingTest(null)
    setForm(EMPTY_FORM)
  }

  async function handleSave() {
    if (!labId) return
    if (!form.name.trim()) {
      Alert.alert('Validation', 'Test name is required')
      return
    }
    const price = parseFloat(form.price)
    const resultHours = parseFloat(form.result_time_hours)
    if (isNaN(price) || price <= 0) {
      Alert.alert('Validation', 'Enter a valid price')
      return
    }
    if (isNaN(resultHours) || resultHours <= 0) {
      Alert.alert('Validation', 'Enter valid result time in hours')
      return
    }

    setSaving(true)
    try {
      const payload = {
        lab_id: labId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        price,
        result_time_hours: resultHours,
        preparation_info: form.preparation_info.trim() || null,
        is_available: editingTest ? editingTest.is_available : true,
      }

      if (editingTest) {
        const { error } = await supabase
          .from('lab_tests')
          .update(payload)
          .eq('id', editingTest.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('lab_tests').insert(payload)
        if (error) throw error
      }

      await loadTests()
      closeModal()
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save test')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(test: LabTest) {
    setTogglingId(test.id)
    try {
      const { error } = await supabase
        .from('lab_tests')
        .update({ is_available: !test.is_available })
        .eq('id', test.id)
      if (error) throw error
      setTests((prev) =>
        prev.map((t) => (t.id === test.id ? { ...t, is_available: !t.is_available } : t))
      )
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to update availability')
    } finally {
      setTogglingId(null)
    }
  }

  function confirmDelete(test: LabTest) {
    Alert.alert(
      'Delete Test',
      `Delete "${test.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('lab_tests').delete().eq('id', test.id)
              if (error) throw error
              setTests((prev) => prev.filter((t) => t.id !== test.id))
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Failed to delete test')
            }
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Manage Tests</Text>
            <Text style={styles.headerSub}>{tests.length} tests configured</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={openAddModal} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+ Add Test</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.purple} />
          <Text style={styles.loadingText}>Loading tests…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {tests.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🔬</Text>
              <Text style={styles.emptyText}>No tests added yet</Text>
              <Text style={styles.emptySubText}>Tap "+ Add Test" to add your first test</Text>
            </View>
          ) : (
            tests.map((test) => (
              <View key={test.id} style={[styles.testCard, !test.is_available && styles.testCardDisabled]}>
                <View style={styles.testHeader}>
                  <View style={styles.testHeaderLeft}>
                    <Text style={[styles.testName, !test.is_available && styles.testNameMuted]}>
                      {test.name}
                    </Text>
                    {test.description ? (
                      <Text style={styles.testDesc} numberOfLines={2}>{test.description}</Text>
                    ) : null}
                  </View>
                  <View style={styles.availabilityToggle}>
                    {togglingId === test.id ? (
                      <ActivityIndicator size="small" color={Colors.purple} />
                    ) : (
                      <Switch
                        value={test.is_available}
                        onValueChange={() => handleToggle(test)}
                        trackColor={{ false: Colors.border, true: '#C4B5FD' }}
                        thumbColor={test.is_available ? Colors.purple : Colors.muted}
                        ios_backgroundColor={Colors.border}
                      />
                    )}
                  </View>
                </View>

                <View style={styles.testMeta}>
                  <View style={styles.metaChip}>
                    <Text style={styles.metaChipLabel}>Price</Text>
                    <Text style={styles.metaChipValue}>₹{test.price.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Text style={styles.metaChipLabel}>Result In</Text>
                    <Text style={styles.metaChipValue}>
                      {test.result_time_hours}h
                    </Text>
                  </View>
                  <View style={[styles.metaChip, { backgroundColor: test.is_available ? '#EDE9FF' : Colors.background }]}>
                    <Text style={[styles.metaChipValue, { color: test.is_available ? Colors.purple : Colors.muted }]}>
                      {test.is_available ? 'Available' : 'Unavailable'}
                    </Text>
                  </View>
                </View>

                {test.preparation_info ? (
                  <View style={styles.prepInfo}>
                    <Text style={styles.prepLabel}>Preparation</Text>
                    <Text style={styles.prepText}>{test.preparation_info}</Text>
                  </View>
                ) : null}

                <View style={styles.testActions}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => openEditModal(test)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => confirmDelete(test)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Add / Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {editingTest ? 'Edit Test' : 'Add New Test'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Test Name *</Text>
                <Input
                  placeholder="e.g. Complete Blood Count"
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Description</Text>
                <Input
                  placeholder="Brief description of the test"
                  value={form.description}
                  onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                  multiline
                />
              </View>
              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.fieldLabel}>Price (₹) *</Text>
                  <Input
                    placeholder="e.g. 500"
                    value={form.price}
                    onChangeText={(v) => setForm((f) => ({ ...f, price: v }))}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.fieldLabel}>Result Time (hours) *</Text>
                  <Input
                    placeholder="e.g. 24"
                    value={form.result_time_hours}
                    onChangeText={(v) => setForm((f) => ({ ...f, result_time_hours: v }))}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Preparation Info</Text>
                <Input
                  placeholder="e.g. Fast for 8 hours before the test"
                  value={form.preparation_info}
                  onChangeText={(v) => setForm((f) => ({ ...f, preparation_info: v }))}
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={closeModal} activeOpacity={0.8}>
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
                  <Text style={styles.modalSaveText}>{editingTest ? 'Save Changes' : 'Add Test'}</Text>
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
  header: {
    backgroundColor: '#4C3BA0',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 2 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  addBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: Colors.muted },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 28 },
  testCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    gap: 12,
  },
  testCardDisabled: { opacity: 0.65 },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  testHeaderLeft: { flex: 1, gap: 4 },
  testName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  testNameMuted: { color: Colors.muted },
  testDesc: { fontSize: 13, color: Colors.sub, lineHeight: 18 },
  availabilityToggle: { paddingTop: 2 },
  testMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metaChip: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 1,
  },
  metaChipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metaChipValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  prepInfo: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  prepLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  prepText: { fontSize: 13, color: Colors.sub, lineHeight: 18 },
  testActions: { flexDirection: 'row', gap: 10 },
  editBtn: {
    flex: 1,
    backgroundColor: '#EDE9FF',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  editBtnText: { color: Colors.purple, fontWeight: '700', fontSize: 13 },
  deleteBtn: {
    paddingHorizontal: 16,
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  deleteBtnText: { color: Colors.red, fontWeight: '700', fontSize: 13 },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 40,
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  emptyEmoji: { fontSize: 36 },
  emptyText: { fontSize: 16, fontWeight: '700', color: Colors.text },
  emptySubText: { fontSize: 13, color: Colors.muted, textAlign: 'center' },
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 20,
  },
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
