import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/colors';

type Gender = 'Male' | 'Female' | 'Other';

const GENDERS: Gender[] = ['Male', 'Female', 'Other'];
const STEPS = 3;

export default function RegisterScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);

  const initial = fullName.trim() ? fullName.trim()[0].toUpperCase() : '?';

  async function handleSave() {
    if (!fullName.trim()) return Alert.alert('Required', 'Please enter your full name.');
    if (!age || isNaN(Number(age))) return Alert.alert('Required', 'Please enter a valid age.');
    if (!gender) return Alert.alert('Required', 'Please select your gender.');
    if (!city.trim()) return Alert.alert('Required', 'Please enter your city.');

    setLoading(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setLoading(false);
      return Alert.alert('Session Expired', 'Please login again.');
    }

    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      full_name: fullName.trim(),
      role: 'patient',
      phone: phone ?? user.phone,
      email: user.email,
      age: Number(age),
      gender,
      city: city.trim(),
    });

    setLoading(false);
    if (error) return Alert.alert('Error', error.message);
    router.replace({ pathname: '/(auth)/family-members' });
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Gradient header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Complete Your Profile</Text>
              {/* Step dots */}
              <View style={styles.stepsRow}>
                {Array.from({ length: STEPS }).map((_, i) => (
                  <View key={i} style={[styles.stepDot, i === 0 && styles.stepDotActive]} />
                ))}
              </View>
            </View>

            {/* Card */}
            <View style={styles.card}>
              {/* Avatar */}
              <View style={styles.avatarArea}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>{initial}</Text>
                </View>
                <View style={styles.avatarBadge}>
                  <Text style={styles.avatarBadgeText}>+</Text>
                </View>
              </View>

              {/* Full Name */}
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={Colors.muted}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />

              {/* Age */}
              <Text style={styles.fieldLabel}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="Your age"
                placeholderTextColor={Colors.muted}
                value={age}
                onChangeText={(v) => setAge(v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={3}
              />

              {/* Gender */}
              <Text style={styles.fieldLabel}>Gender</Text>
              <View style={styles.genderRow}>
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                    onPress={() => setGender(g)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* City */}
              <Text style={styles.fieldLabel}>City</Text>
              <TextInput
                style={[styles.input, { marginBottom: 28 }]}
                placeholder="Your city"
                placeholderTextColor={Colors.muted}
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
              />

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save & Continue →'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 32,
    gap: 14,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: -0.3,
  },
  stepsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  stepDotActive: {
    backgroundColor: Colors.white,
    width: 24,
  },
  card: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },
  avatarArea: {
    alignSelf: 'center',
    marginBottom: 28,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.card,
  },
  avatarBadgeText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
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
  genderRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  genderBtnActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  genderBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.sub,
  },
  genderBtnTextActive: {
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
