import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NativeSlider from '@react-native-community/slider';
import { Colors, Spacing } from '../constants/theme';

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
  return (
    <View style={styles.container}>
      {(label || displayValue) && (
        <View style={styles.headerRow}>
          {label ? <Text style={styles.label}>{label}</Text> : null}
          {displayValue ? <Text style={styles.displayValue}>{displayValue}</Text> : null}
        </View>
      )}
      <NativeSlider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={(v) => onChange(+(v).toFixed(1))}
        minimumTrackTintColor={Colors.mint}
        maximumTrackTintColor={Colors.border}
        thumbTintColor={Colors.mint}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  displayValue: { fontSize: 18, fontWeight: '800', color: Colors.mint },
  slider: { width: '100%', height: 40 },
});
