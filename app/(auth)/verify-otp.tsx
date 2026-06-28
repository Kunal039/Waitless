import { useState, useEffect, useRef } from 'react';
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
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { getUserProfile } from '../../lib/auth';
import { Colors } from '../../constants/colors';

const OTP_LENGTH = 4;

export default function VerifyOtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  function handleDigitChange(text: string, index: number) {
    const cleaned = text.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);
    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const otp = digits.join('');
    if (otp.length < OTP_LENGTH) {
      return Alert.alert('Invalid OTP', `Please enter the ${OTP_LENGTH}-digit code.`);
    }
    setLoading(true);
    const fullPhone = '+91' + phone;
    const { data, error } = await supabase.auth.verifyOtp({
      phone: fullPhone,
      token: otp,
      type: 'sms',
    });
    if (error) {
      setLoading(false);
      return Alert.alert('Verification Failed', error.message);
    }
    const { data: profile } = await getUserProfile(data.user!.id);
    setLoading(false);
    if (!profile) {
      router.replace({ pathname: '/(auth)/register', params: { phone } });
    } else {
      router.replace('/(patient)/home');
    }
  }

  async function handleResend() {
    if (!canResend) return;
    setCanResend(false);
    setCountdown(30);
    setDigits(Array(OTP_LENGTH).fill(''));
    await supabase.auth.signInWithOtp({ phone: '+91' + phone });
  }

  const maskedPhone = phone
    ? phone.slice(0, 2) + 'XXXXXX' + phone.slice(-2)
    : '';

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
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Text style={styles.backArrow}>←</Text>
              </TouchableOpacity>
            </View>

            {/* Card */}
            <View style={styles.card}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconEmoji}>💬</Text>
              </View>
              <Text style={styles.cardTitle}>Verify OTP</Text>
              <Text style={styles.cardSubtitle}>
                We have sent a {OTP_LENGTH} digit code to{' '}
                <Text style={styles.phoneHighlight}>+91 {maskedPhone}</Text>
              </Text>

              {/* OTP boxes */}
              <View style={styles.otpRow}>
                {digits.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                    value={digit}
                    onChangeText={(text) => handleDigitChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    autoFocus={index === 0}
                    selectTextOnFocus
                  />
                ))}
              </View>

              {/* Resend */}
              <TouchableOpacity
                onPress={handleResend}
                disabled={!canResend}
                activeOpacity={0.7}
                style={styles.resendRow}
              >
                {canResend ? (
                  <Text style={styles.resendActive}>Resend OTP</Text>
                ) : (
                  <Text style={styles.resendCountdown}>
                    Resend OTP in{' '}
                    <Text style={styles.resendTimer}>
                      00:{countdown.toString().padStart(2, '0')}
                    </Text>
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
                onPress={handleVerify}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.verifyButtonText}>
                  {loading ? 'Verifying...' : 'Verify & Continue →'}
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 18,
    color: Colors.white,
    lineHeight: 22,
  },
  card: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconEmoji: {
    fontSize: 26,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.sub,
    lineHeight: 20,
    marginBottom: 28,
  },
  phoneHighlight: {
    color: Colors.text,
    fontWeight: '600',
  },
  otpRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 20,
  },
  otpBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  resendRow: {
    alignItems: 'center',
    marginBottom: 28,
  },
  resendCountdown: {
    fontSize: 13,
    color: Colors.muted,
  },
  resendTimer: {
    color: Colors.text,
    fontWeight: '600',
  },
  resendActive: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  verifyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  verifyButtonDisabled: {
    opacity: 0.65,
  },
  verifyButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
