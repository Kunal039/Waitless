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
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/colors';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendOtp() {
    const trimmed = phone.trim();
    if (!trimmed || trimmed.length < 10) {
      return Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: '+91' + trimmed });
    setLoading(false);
    if (error) {
      return Alert.alert('Error', error.message);
    }
    router.push({ pathname: '/(auth)/verify-otp', params: { phone: trimmed } });
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
            {/* Header gradient area */}
            <View style={styles.header}>
              <View style={styles.logoBox}>
                <Text style={styles.logoLetter}>W</Text>
              </View>
              <Text style={styles.headerTitle}>WaitLess</Text>
            </View>

            {/* Card body */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Enter Mobile Number</Text>
              <Text style={styles.cardSubtitle}>We'll send a one-time code to verify your number</Text>

              <Text style={styles.fieldLabel}>Mobile Number</Text>
              <View style={styles.phoneRow}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+91 🇮🇳</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="9876543210"
                  placeholderTextColor={Colors.muted}
                  value={phone}
                  onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, ''))}
                  keyboardType="phone-pad"
                  maxLength={10}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSendOtp}
                />
              </View>

              <TouchableOpacity
                style={[styles.sendButton, loading && styles.sendButtonDisabled]}
                onPress={handleSendOtp}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.sendButtonText}>
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.termsText}>
                By continuing, you agree to our{' '}
                <Text style={styles.termsLink}>Terms &amp; Conditions</Text>
                {' '}and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
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
    paddingTop: 32,
    paddingBottom: 36,
    gap: 12,
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  logoLetter: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: -0.3,
  },
  card: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.sub,
    marginBottom: 28,
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
  phoneRow: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: Colors.card,
  },
  countryCode: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: Colors.background,
    borderRightWidth: 1.5,
    borderRightColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  sendButtonDisabled: {
    opacity: 0.65,
  },
  sendButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  termsText: {
    fontSize: 12,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
