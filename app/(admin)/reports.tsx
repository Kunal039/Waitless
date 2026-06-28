import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

const MONTHS = ['June 2026', 'May 2026', 'Apr 2026'];

interface ReportRow {
  label: string;
  value: string;
  valueColor?: string;
}

const PATIENT_ROWS: ReportRow[] = [
  { label: 'Total Patients', value: '246' },
  { label: 'New Patients', value: '89', valueColor: Colors.green },
  { label: 'Follow-ups', value: '157' },
  { label: 'Avg. Daily', value: '12.3' },
  { label: 'Avg. Wait Time', value: '28 min' },
];

const REVENUE_ROWS: ReportRow[] = [
  { label: 'Total Revenue', value: '₹1,23,000', valueColor: Colors.green },
  { label: 'Collected', value: '₹1,08,500', valueColor: Colors.green },
  { label: 'Pending', value: '₹14,500', valueColor: Colors.red },
  { label: 'UPI Payments', value: '62%' },
  { label: 'Cash Payments', value: '38%' },
];

function ReportCard({
  title,
  month,
  rows,
}: {
  title: string;
  month: string;
  rows: ReportRow[];
}) {
  return (
    <View style={styles.reportCard}>
      <View style={styles.reportCardHeader}>
        <Text style={styles.reportCardTitle}>{title}</Text>
        <Text style={styles.reportCardMonth}>{month}</Text>
      </View>
      <View style={styles.reportCardBody}>
        {rows.map((row, index) => (
          <View
            key={row.label}
            style={[
              styles.reportRow,
              index < rows.length - 1 && styles.reportRowBorder,
            ]}
          >
            <Text style={styles.reportRowLabel}>{row.label}</Text>
            <Text
              style={[
                styles.reportRowValue,
                row.valueColor ? { color: row.valueColor } : null,
              ]}
            >
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ReportsScreen() {
  const [selectedMonth, setSelectedMonth] = useState('June 2026');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reports & Analytics</Text>
          <Text style={styles.headerSubtitle}>June 2026</Text>
        </View>

        {/* Month Selector */}
        <View style={styles.monthSelector}>
          {MONTHS.map((month) => {
            const isActive = selectedMonth === month;
            return (
              <TouchableOpacity
                key={month}
                style={[
                  styles.monthPill,
                  isActive ? styles.monthPillActive : styles.monthPillInactive,
                ]}
                onPress={() => setSelectedMonth(month)}
              >
                <Text
                  style={[
                    styles.monthPillText,
                    isActive
                      ? styles.monthPillTextActive
                      : styles.monthPillTextInactive,
                  ]}
                >
                  {month}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Patient Summary */}
        <View style={styles.cardsContainer}>
          <ReportCard
            title="Patient Summary"
            month={selectedMonth}
            rows={PATIENT_ROWS}
          />

          {/* Revenue Summary */}
          <ReportCard
            title="Revenue Summary"
            month={selectedMonth}
            rows={REVENUE_ROWS}
          />
        </View>

        {/* Export Button */}
        <View style={styles.exportContainer}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => Alert.alert('Export PDF', 'Feature coming soon')}
          >
            <Text style={styles.exportButtonText}>📥 Export PDF Report</Text>
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
    backgroundColor: '#1e1b4b',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#a5b4fc',
  },
  monthSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  monthPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  monthPillActive: {
    backgroundColor: '#312e81',
  },
  monthPillInactive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#312e81',
  },
  monthPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  monthPillTextActive: {
    color: '#ffffff',
  },
  monthPillTextInactive: {
    color: '#312e81',
  },
  cardsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reportCardHeader: {
    backgroundColor: '#1e1b4b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  reportCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  reportCardMonth: {
    fontSize: 13,
    color: '#a5b4fc',
  },
  reportCardBody: {
    paddingHorizontal: 16,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  reportRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  reportRowLabel: {
    fontSize: 14,
    color: Colors.sub,
  },
  reportRowValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  exportContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  exportButton: {
    backgroundColor: '#312e81',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
