import React, { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  FlatList,
  Keyboard,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { searchHospitals } from '../../lib/api/hospitals'
import { searchDoctors } from '../../lib/api/doctors'
import { Hospital, Doctor } from '../../types'

type FilterTab = 'All' | 'Hospitals' | 'Doctors' | 'Labs'

const FILTER_TABS: FilterTab[] = ['All', 'Hospitals', 'Doctors', 'Labs']

type SearchResults = {
  hospitals: Hospital[]
  doctors: Doctor[]
}

function HospitalResultCard({
  hospital,
  onPress,
}: {
  hospital: Hospital
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.resultCard} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.resultIconWrap}>
        <Text style={styles.resultIcon}>{hospital.image_emoji ?? '🏥'}</Text>
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={1}>
          {hospital.name}
        </Text>
        <Text style={styles.resultSub} numberOfLines={1}>
          {hospital.address}
        </Text>
        <View style={styles.resultMetaRow}>
          <View style={styles.ratingChip}>
            <Text style={styles.ratingText}>⭐ {hospital.rating?.toFixed(1) ?? '—'}</Text>
          </View>
          <View style={styles.cityChip}>
            <Text style={styles.cityText}>{hospital.city}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.resultArrow}>›</Text>
    </TouchableOpacity>
  )
}

function DoctorResultCard({
  doctor,
  onPress,
}: {
  doctor: Doctor
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.resultCard} onPress={onPress} activeOpacity={0.82}>
      <View style={[styles.resultIconWrap, styles.doctorIconWrap]}>
        <Text style={styles.resultIcon}>{doctor.avatar_emoji ?? '👨‍⚕️'}</Text>
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={1}>
          {doctor.full_name}
        </Text>
        <Text style={styles.resultSub} numberOfLines={1}>
          {doctor.specialization}
        </Text>
        <View style={styles.resultMetaRow}>
          <View style={styles.expChip}>
            <Text style={styles.expText}>{doctor.experience_years}y exp</Text>
          </View>
          <View style={styles.feeChip}>
            <Text style={styles.feeText}>₹{doctor.consultation_fee}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.resultArrow}>›</Text>
    </TouchableOpacity>
  )
}

export default function SearchScreen() {
  const router = useRouter()
  const inputRef = useRef<TextInput>(null)

  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('All')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResults>({ hospitals: [], doctors: [] })
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSearch = useCallback(async (q: string, tab: FilterTab) => {
    if (!q.trim()) {
      setResults({ hospitals: [], doctors: [] })
      setHasSearched(false)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const shouldFetchHospitals = tab === 'All' || tab === 'Hospitals' || tab === 'Labs'
      const shouldFetchDoctors = tab === 'All' || tab === 'Doctors'

      const [hospitals, doctors] = await Promise.all([
        shouldFetchHospitals ? searchHospitals(q) : Promise.resolve([]),
        shouldFetchDoctors ? searchDoctors(q) : Promise.resolve([]),
      ])

      setResults({ hospitals, doctors })
    } catch {
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleQueryChange = (text: string) => {
    setQuery(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      runSearch(text, activeTab)
    }, 350)
  }

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab)
    if (query.trim()) {
      runSearch(query, tab)
    }
  }

  const handleClear = () => {
    setQuery('')
    setResults({ hospitals: [], doctors: [] })
    setHasSearched(false)
    setError(null)
    inputRef.current?.focus()
  }

  const totalResults = results.hospitals.length + results.doctors.length

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Blue Header with search bar */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              Keyboard.dismiss()
              router.back()
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={styles.searchInputWrap}>
            <Text style={styles.searchInputIcon}>🔍</Text>
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search hospitals, doctors…"
              placeholderTextColor={Colors.muted}
              value={query}
              onChangeText={handleQueryChange}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={() => runSearch(query, activeTab)}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={handleClear} style={styles.clearBtn} activeOpacity={0.7}>
                <Text style={styles.clearBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, activeTab === tab && styles.filterTabActive]}
              onPress={() => handleTabChange(tab)}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.filterTabText, activeTab === tab && styles.filterTabTextActive]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results */}
      <ScrollView
        style={styles.resultScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Loading */}
        {loading && (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Searching…</Text>
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Empty state — no query yet */}
        {!loading && !error && !hasSearched && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>Find hospitals or doctors</Text>
            <Text style={styles.emptySub}>
              Search by name, specialization, or city to get started.
            </Text>
          </View>
        )}

        {/* No results after search */}
        {!loading && !error && hasSearched && totalResults === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>😕</Text>
            <Text style={styles.emptyTitle}>No results for "{query}"</Text>
            <Text style={styles.emptySub}>Try a different search term or filter.</Text>
          </View>
        )}

        {/* Hospitals section */}
        {!loading && !error && results.hospitals.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsSectionLabel}>
              HOSPITALS ({results.hospitals.length})
            </Text>
            {results.hospitals.map((h) => (
              <HospitalResultCard
                key={h.id}
                hospital={h}
                onPress={() => router.push(`/(patient)/hospitals/${h.id}` as any)}
              />
            ))}
          </View>
        )}

        {/* Doctors section */}
        {!loading && !error && results.doctors.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsSectionLabel}>
              DOCTORS ({results.doctors.length})
            </Text>
            {results.doctors.map((d) => (
              <DoctorResultCard
                key={d.id}
                doctor={d}
                onPress={() => router.push(`/(patient)/doctors/${d.id}` as any)}
              />
            ))}
          </View>
        )}

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

  // Header
  header: {
    backgroundColor: Colors.primaryDark,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: Colors.card,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInputIcon: {
    fontSize: 15,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    padding: 0,
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    color: Colors.card,
    fontSize: 10,
    fontWeight: '700',
  },

  // Filter tabs
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  filterTabActive: {
    backgroundColor: Colors.card,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  filterTabTextActive: {
    color: Colors.primary,
  },

  // Results
  resultScroll: {
    flex: 1,
  },
  resultsSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  resultsSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.sub,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // Result card
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  resultIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  doctorIconWrap: {
    backgroundColor: '#E8F5E9',
  },
  resultIcon: {
    fontSize: 24,
  },
  resultInfo: {
    flex: 1,
    gap: 3,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  resultSub: {
    fontSize: 12,
    color: Colors.muted,
  },
  resultMetaRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  resultArrow: {
    fontSize: 22,
    color: Colors.muted,
    fontWeight: '300',
    flexShrink: 0,
  },

  // Chips
  ratingChip: {
    backgroundColor: '#FFF8E1',
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.yellow,
  },
  cityChip: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  cityText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  expChip: {
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  expText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.green,
  },
  feeChip: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  feeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Empty / loading / error
  centerBox: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  loadingText: {
    color: Colors.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 72,
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 19,
  },
  errorBox: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  errorEmoji: {
    fontSize: 36,
  },
  errorText: {
    color: Colors.red,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
})
