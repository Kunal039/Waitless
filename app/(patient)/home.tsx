import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { useAuth } from '../../lib/context/AuthContext'
import { getHospitals } from '../../lib/api/hospitals'
import { Hospital } from '../../types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_WIDTH = SCREEN_WIDTH * 0.72

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

function SkeletonBox({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width: number | string
  height: number
  borderRadius?: number
  style?: object
}) {
  return (
    <View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: '#D0D5E8',
          opacity: 0.55,
        },
        style,
      ]}
    />
  )
}

function HospitalCardSkeleton() {
  return (
    <View style={styles.hospitalCard}>
      <SkeletonBox width={52} height={52} borderRadius={14} />
      <View style={{ marginTop: 10, gap: 6 }}>
        <SkeletonBox width={120} height={14} />
        <SkeletonBox width={90} height={11} />
        <SkeletonBox width={70} height={11} />
      </View>
    </View>
  )
}

function HospitalCard({
  hospital,
  onPress,
}: {
  hospital: Hospital
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.hospitalCard} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.hospitalIconWrap}>
        <Text style={styles.hospitalIcon}>{hospital.image_emoji ?? '🏥'}</Text>
      </View>
      <Text style={styles.hospitalName} numberOfLines={1}>
        {hospital.name}
      </Text>
      <Text style={styles.hospitalAddress} numberOfLines={2}>
        {hospital.address}
      </Text>
      <View style={styles.hospitalMeta}>
        <View style={styles.ratingChip}>
          <Text style={styles.ratingText}>⭐ {hospital.rating?.toFixed(1) ?? '—'}</Text>
        </View>
        <View style={styles.distanceChip}>
          <Text style={styles.distanceText}>{hospital.city}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function PatientHome() {
  const router = useRouter()
  const { profile } = useAuth()

  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchHospitals = useCallback(async () => {
    try {
      setError(null)
      const data = await getHospitals(profile?.city ?? undefined)
      setHospitals(data)
    } catch {
      setError('Could not load hospitals. Pull to retry.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [profile?.city])

  useEffect(() => {
    fetchHospitals()
  }, [fetchHospitals])

  const onRefresh = () => {
    setRefreshing(true)
    fetchHospitals()
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.card}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Blue Header */}
        <View style={styles.header}>
          <View style={styles.locationRow}>
            <TouchableOpacity style={styles.locationPill} activeOpacity={0.8}>
              <Text style={styles.locationPin}>📍</Text>
              <Text style={styles.locationCity} numberOfLines={1}>
                {profile?.city ?? 'Nearby'}
              </Text>
              <Text style={styles.locationChevron}>▾</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.locationSub}>Showing hospitals near you</Text>
          <Text style={styles.greeting}>
            {getGreeting()}, {firstName} 👋
          </Text>
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => router.push('/(patient)/search')}
            activeOpacity={0.9}
          >
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchPlaceholder}>Search hospitals, doctors…</Text>
          </TouchableOpacity>
        </View>

        {/* Nearby Hospitals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>NEARBY HOSPITALS</Text>
            {!loading && hospitals.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(patient)/search')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hospitalScroll}
            >
              {[1, 2, 3].map((k) => (
                <HospitalCardSkeleton key={k} />
              ))}
            </ScrollView>
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : hospitals.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No hospitals found nearby.</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hospitalScroll}
            >
              {hospitals.map((h) => (
                <HospitalCard
                  key={h.id}
                  hospital={h}
                  onPress={() => router.push(`/(patient)/hospitals/${h.id}` as any)}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Book Appointment */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BOOK APPOINTMENT</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardBlue]}
              onPress={() => router.push('/(patient)/search')}
              activeOpacity={0.85}
            >
              <Text style={styles.actionEmoji}>👨‍⚕️</Text>
              <Text style={[styles.actionTitle, { color: Colors.primary }]}>Find Doctor</Text>
              <Text style={[styles.actionSub, { color: Colors.sub }]}>
                Book a specialist appointment
              </Text>
              <View style={styles.actionArrow}>
                <Text style={styles.actionArrowText}>→</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardPurple]}
              onPress={() => router.push('/(patient)/search')}
              activeOpacity={0.85}
            >
              <Text style={styles.actionEmoji}>🧪</Text>
              <Text style={[styles.actionTitle, { color: Colors.purple }]}>Lab Tests</Text>
              <Text style={[styles.actionSub, { color: Colors.sub }]}>
                Diagnostics & reports
              </Text>
              <View style={[styles.actionArrow, styles.actionArrowPurple]}>
                <Text style={[styles.actionArrowText, { color: Colors.purple }]}>→</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },

  // Header
  header: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  locationPin: {
    fontSize: 13,
  },
  locationCity: {
    color: Colors.card,
    fontSize: 13,
    fontWeight: '700',
    maxWidth: 120,
  },
  locationChevron: {
    color: Colors.card,
    fontSize: 12,
    opacity: 0.8,
  },
  locationSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    marginTop: 4,
    marginBottom: 14,
    marginLeft: 2,
  },
  greeting: {
    color: Colors.card,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchPlaceholder: {
    color: Colors.muted,
    fontSize: 14,
    fontWeight: '500',
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.sub,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 14,
  },

  // Hospital scroll
  hospitalScroll: {
    gap: 14,
    paddingRight: 20,
  },
  hospitalCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
  },
  hospitalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  hospitalIcon: {
    fontSize: 28,
  },
  hospitalName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  hospitalAddress: {
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 17,
    marginBottom: 10,
  },
  hospitalMeta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  ratingChip: {
    backgroundColor: '#FFF8E1',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.yellow,
  },
  distanceChip: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Error / empty
  errorBox: {
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    color: Colors.red,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyBox: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    color: Colors.muted,
    fontSize: 14,
  },

  // Action cards
  actionGrid: {
    flexDirection: 'row',
    gap: 14,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: 148,
    position: 'relative',
  },
  actionCardBlue: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.border,
  },
  actionCardPurple: {
    backgroundColor: '#F3F0FF',
    borderColor: '#C4B8FF',
  },
  actionEmoji: {
    fontSize: 30,
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  actionSub: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
  },
  actionArrow: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(26,53,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionArrowPurple: {
    backgroundColor: 'rgba(101,84,192,0.12)',
  },
  actionArrowText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
})
