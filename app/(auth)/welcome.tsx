import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

export default function WelcomeScreen() {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Top section: logo + tagline */}
        <View style={styles.topSection}>
          <View style={styles.logoBox}>
            <Text style={styles.logoLetter}>W</Text>
          </View>
          <Text style={styles.appName}>Waitless</Text>
          <Text style={styles.tagline}>{'Skip the Waiting,\nNot the Appointment'}</Text>
        </View>

        {/* Bottom section: buttons */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineButton}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.outlineButtonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.createAccountText}>Create Account</Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingBottom: 8,
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    marginBottom: 8,
  },
  logoLetter: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -1,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 4,
  },
  bottomSection: {
    gap: 14,
    paddingBottom: 12,
  },
  primaryButton: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  outlineButton: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  outlineButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  createAccountText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    textDecorationLine: 'underline',
    paddingVertical: 6,
  },
});
