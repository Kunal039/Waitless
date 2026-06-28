import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants/colors'

type Status = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'waiting' | 'in_room'

const CONFIG: Record<Status, { bg: string; color: string; label: string }> = {
  pending:   { bg: '#FFF3CD', color: '#856404', label: 'Pending' },
  confirmed: { bg: Colors.primaryLight, color: Colors.primary, label: 'Confirmed' },
  cancelled: { bg: '#fee2e2', color: Colors.red, label: 'Cancelled' },
  completed: { bg: '#dcfce7', color: Colors.green, label: 'Completed' },
  no_show:   { bg: '#f3f4f6', color: Colors.muted, label: 'No Show' },
  waiting:   { bg: '#FFF3CD', color: '#856404', label: 'Waiting' },
  in_room:   { bg: '#dcfce7', color: Colors.green, label: 'In Room' },
}

export function StatusBadge({ status }: { status: Status }) {
  const cfg = CONFIG[status] ?? CONFIG.pending
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
})
