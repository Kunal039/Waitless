import React from 'react'
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native'
import { Colors } from '../../constants/colors'

interface InputProps extends TextInputProps {
  label?: string
  containerStyle?: ViewStyle
}

export function Input({ label, containerStyle, ...props }: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={styles.input}
        placeholderTextColor={Colors.muted}
        {...props}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    color: Colors.sub,
    fontWeight: '500',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: '#fff',
  },
})
