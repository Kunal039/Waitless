import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Colors from '../../constants/colors';

const DOCTORS = [
  { label: 'Dr. Priya Sharma', sub: 'General' },
  { label: 'Dr. Amit Patel', sub: 'Cardiology' },
  { label: 'Dr. Sunita Roy', sub: 'Dermatology' },
];

const REASONS = ['Fever', 'Checkup', 'Follow-up', 'Emergency'];
const PAYMENTS = ['Cash', 'UPI', 'Card'];

type Gender = 'Male' | 'Female' | 'Other' | '';

export default function RegisterPatientScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender>('');
  const [mobile, setMobile] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');
  const [showDoctorPicker, setShowDoctorPicker] = useState(false);
  const [showReasonPicker, setShowReasonPicker] = useState(false);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter patient name.');
      return;
    }
    if (!mobile.trim()) {
      Alert.alert('Validation Error', 'Please enter mobile number.');
      return;
    }
    const token = Math.floor(Math.random() * (25 - 16 + 1)) + 16;
    Alert.alert('Patient Registered!', `Token #${token} issued for ${name}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{'← Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register New Patient</Text>
        <Text style={styles.headerSubtitle}>Walk-in Registration</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>Full Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter full name"
            placeholderTextColor={Colors.sub}
            value={name}
            onChangeText={setName}
          />

          <View style={styles.rowContainer}>
            <View style={styles.ageContainer}>
              <Text style={styles.fieldLabel}>Age</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Age"
                placeholderTextColor={Colors.sub}
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
              />
            </View>
            <View style={styles.genderContainer}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <View style={styles.genderRow}>
                {(['Male', 'Female', 'Other'] as Gender[]).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderButton,
                      gender === g && styles.genderButtonSelected,
                    ]}
                    onPress={() => setGender(g)}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        gender === g && styles.genderButtonTextSelected,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <Text style={styles.fieldLabel}>Mobile Number</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter mobile number"
            placeholderTextColor={Colors.sub}
            keyboardType="phone-pad"
            value={mobile}
            onChangeText={setMobile}
          />

          <Text style={styles.fieldLabel}>Select Doctor</Text>
          <TouchableOpacity
            style={styles.pickerToggle}
            onPress={() => {
              setShowDoctorPicker((prev) => !prev);
              setShowReasonPicker(false);
              setShowPaymentPicker(false);
            }}
          >
            <Text style={selectedDoctor ? styles.pickerValue : styles.pickerPlaceholder}>
              {selectedDoctor || 'Tap to select doctor'}
            </Text>
            <Text style={styles.pickerArrow}>{showDoctorPicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showDoctorPicker && (
            <View style={styles.pickerList}>
              {DOCTORS.map((doc) => (
                <TouchableOpacity
                  key={doc.label}
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedDoctor(`${doc.label} · ${doc.sub}`);
                    setShowDoctorPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{doc.label}</Text>
                  <Text style={styles.pickerItemSub}>{doc.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.fieldLabel}>Reason for Visit</Text>
          <TouchableOpacity
            style={styles.pickerToggle}
            onPress={() => {
              setShowReasonPicker((prev) => !prev);
              setShowDoctorPicker(false);
              setShowPaymentPicker(false);
            }}
          >
            <Text style={selectedReason ? styles.pickerValue : styles.pickerPlaceholder}>
              {selectedReason || 'Tap to select reason'}
            </Text>
            <Text style={styles.pickerArrow}>{showReasonPicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showReasonPicker && (
            <View style={styles.pickerList}>
              {REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedReason(reason);
                    setShowReasonPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{reason}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.fieldLabel}>Payment Mode</Text>
          <TouchableOpacity
            style={styles.pickerToggle}
            onPress={() => {
              setShowPaymentPicker((prev) => !prev);
              setShowDoctorPicker(false);
              setShowReasonPicker(false);
            }}
          >
            <Text style={selectedPayment ? styles.pickerValue : styles.pickerPlaceholder}>
              {selectedPayment || 'Tap to select payment mode'}
            </Text>
            <Text style={styles.pickerArrow}>{showPaymentPicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showPaymentPicker && (
            <View style={styles.pickerList}>
              {PAYMENTS.map((payment) => (
                <TouchableOpacity
                  key={payment}
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedPayment(payment);
                    setShowPaymentPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{payment}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.feeCard}>
            <Text style={styles.feeText}>Consultation Fee ₹500</Text>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>✅ Register & Issue Token</Text>
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
    backgroundColor: '#003380',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  backButton: {
    marginBottom: 8,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.85,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
    marginTop: 14,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  ageContainer: {
    flex: 1,
  },
  genderContainer: {
    flex: 2,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 6,
  },
  genderButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  genderButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderButtonText: {
    fontSize: 13,
    color: Colors.sub,
    fontWeight: '500',
  },
  genderButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pickerToggle: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerValue: {
    fontSize: 15,
    color: Colors.text,
  },
  pickerPlaceholder: {
    fontSize: 15,
    color: Colors.sub,
  },
  pickerArrow: {
    fontSize: 12,
    color: Colors.sub,
  },
  pickerList: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
    overflow: 'hidden',
  },
  pickerItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pickerItemText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  pickerItemSub: {
    fontSize: 12,
    color: Colors.sub,
    marginTop: 2,
  },
  feeCard: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  feeText: {
    color: '#16a34a',
    fontSize: 16,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
