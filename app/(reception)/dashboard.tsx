import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/context/AuthContext';
import Colors from '../../constants/colors';

export default function ReceptionDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const userName = user?.user_metadata?.full_name ?? user?.email ?? 'Staff';

  function handleCallNext() {
    Alert.alert('Token called!');
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Good Morning, {userName} 👋</Text>
          <Text style={styles.subtitle}>Reception · Front Desk</Text>
          <View style={styles.dateRow}>
            <Text style={styles.dateText}>{today}</Text>
            <View style={styles.opdChip}>
              <Text style={styles.opdChipText}>OPD Open</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Appointments Today</Text>
            <Text style={[styles.statValue, { color: Colors.primary }]}>42</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Current Token</Text>
            <Text style={[styles.statValue, { color: Colors.primary }]}>15</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>In Waiting</Text>
            <Text style={[styles.statValue, { color: Colors.orange }]}>7</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={[styles.statValue, { color: Colors.green }]}>18</Text>
          </View>
        </View>

        {/* Now Serving */}
        <View style={styles.servingCard}>
          <Text style={styles.servingLabel}>Now Serving</Text>
          <Text style={styles.servingToken}>Token #15</Text>
          <Text style={styles.servingDoctor}>Dr. Priya Sharma · Room 3</Text>
          <TouchableOpacity style={styles.callNextButton} onPress={handleCallNext}>
            <Text style={styles.callNextText}>Call Next Token →</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, styles.actionGreen]}
            onPress={() => router.push('/(reception)/register')}
          >
            <Text style={styles.actionTextGreen}>Register Patient</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, styles.actionBlue]}
            onPress={() => router.push('/(reception)/appointments')}
          >
            <Text style={styles.actionTextBlue}>Appointments</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, styles.actionOrange, styles.actionFullRow]}
            onPress={() => router.push('/(reception)/queue')}
          >
            <Text style={styles.actionTextOrange}>Queue Manager</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    backgroundColor: '#003380',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#A8C4FF',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateText: {
    fontSize: 13,
    color: '#C8D8FF',
  },
  opdChip: {
    backgroundColor: Colors.green,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  opdChipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.sub,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  servingCard: {
    backgroundColor: '#003380',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 20,
  },
  servingLabel: {
    fontSize: 12,
    color: '#A8C4FF',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  servingToken: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  servingDoctor: {
    fontSize: 14,
    color: '#C8D8FF',
    marginBottom: 16,
  },
  callNextButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  callNextText: {
    color: '#003380',
    fontWeight: '700',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionFullRow: {
    minWidth: '100%',
    flex: 0,
  },
  actionGreen: {
    backgroundColor: '#dcfce7',
  },
  actionBlue: {
    backgroundColor: '#dbeafe',
  },
  actionOrange: {
    backgroundColor: '#fff3e0',
  },
  actionTextGreen: {
    color: Colors.green,
    fontWeight: '700',
    fontSize: 15,
  },
  actionTextBlue: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  actionTextOrange: {
    color: Colors.orange,
    fontWeight: '700',
    fontSize: 15,
  },
});
