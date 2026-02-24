import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing } from '../constants/theme';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

export default function Slider({ label, value, min, max, step, onChange }: Props) {
  const percent = Math.min(100, ((value - min) / (max - min)) * 100);
  const display = value % 1 !== 0 ? value.toFixed(1) : String(value);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      <View style={styles.row}>
        <TouchableOpacity onPress={() => onChange(Math.max(min, +(value - step).toFixed(1)))} style={styles.btn}>
          <Text style={styles.btnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.value}>{display}</Text>
        <TouchableOpacity onPress={() => onChange(Math.min(max, +(value + step).toFixed(1)))} style={styles.btn}>
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.xl },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  track: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: Colors.teal, borderRadius: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  value: { fontSize: 16, fontWeight: '700', color: Colors.text },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.tealLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: { fontSize: 22, fontWeight: '700', color: Colors.teal },
});
