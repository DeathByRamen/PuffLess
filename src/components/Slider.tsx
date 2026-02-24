import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';

interface Props {
  label: string;
  displayValue?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

export default function Slider({ label, displayValue, value, min, max, step, onChange }: Props) {
  const percent = Math.min(100, ((value - min) / (max - min)) * 100);

  return (
    <View style={styles.container}>
      {(label || displayValue) && (
        <View style={styles.headerRow}>
          {label ? <Text style={styles.label}>{label}</Text> : null}
          {displayValue ? <Text style={styles.displayValue}>{displayValue}</Text> : null}
        </View>
      )}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
        <View style={[styles.knob, { left: `${percent}%` }]} />
      </View>
      <View style={styles.controlRow}>
        <TouchableOpacity
          onPress={() => onChange(Math.max(min, +(value - step).toFixed(1)))}
          style={styles.btn}
          activeOpacity={0.7}
        >
          <Ionicons name="remove" size={20} color={Colors.teal} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onChange(Math.min(max, +(value + step).toFixed(1)))}
          style={styles.btn}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={20} color={Colors.teal} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text },
  displayValue: { fontSize: 16, fontWeight: '800', color: Colors.teal },
  track: {
    height: 6, backgroundColor: Colors.borderLight,
    borderRadius: 3, overflow: 'visible', position: 'relative',
  },
  fill: { height: 6, backgroundColor: Colors.teal, borderRadius: 3 },
  knob: {
    position: 'absolute', top: -7, width: 20, height: 20,
    borderRadius: 10, backgroundColor: Colors.white,
    borderWidth: 3, borderColor: Colors.teal,
    marginLeft: -10,
  },
  controlRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md },
  btn: {
    width: 40, height: 40, borderRadius: Radius.full,
    backgroundColor: Colors.tealMuted,
    justifyContent: 'center', alignItems: 'center',
  },
});
