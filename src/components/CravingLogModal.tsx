import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Colors, Spacing, Radius } from '../constants/theme';
import { CRAVING_TRIGGERS, CRAVING_ACTIONS } from '../constants/data';
import { CravingTrigger, CravingAction } from '../models/types';
import { addCraving } from '../services/storage';

interface Props {
  onDismiss: () => void;
}

export default function CravingLogModal({ onDismiss }: Props) {
  const [intensity, setIntensity] = useState(3);
  const [trigger, setTrigger] = useState<CravingTrigger>('Habit');
  const [action, setAction] = useState<CravingAction>('Resisted');
  const [notes, setNotes] = useState('');

  const intensityLabels = ['Mild', 'Moderate', 'Strong', 'Intense', 'Overwhelming'];
  const intensityColors = [Colors.green, Colors.teal, Colors.yellow, Colors.orange, Colors.red];
  const suggestion = CRAVING_TRIGGERS.find((t) => t.trigger === trigger)?.suggestion ?? '';

  const handleSave = async () => {
    await addCraving({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      intensity,
      trigger,
      action,
      notes,
    });
    onDismiss();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onDismiss}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Log Craving</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Intensity */}
        <Text style={styles.sectionTitle}>How strong is this craving?</Text>
        <Text style={[styles.intensityLabel, { color: intensityColors[intensity - 1] }]}>
          {intensityLabels[intensity - 1]}
        </Text>
        <View style={styles.intensityRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.intensityDot, {
                backgroundColor: n <= intensity ? intensityColors[intensity - 1] : Colors.border,
                transform: [{ scale: n === intensity ? 1.3 : 1 }],
              }]}
              onPress={() => setIntensity(n)}
            />
          ))}
        </View>

        {/* Trigger */}
        <Text style={styles.sectionTitle}>What triggered it?</Text>
        <View style={styles.triggerGrid}>
          {CRAVING_TRIGGERS.map(({ trigger: t, icon }) => (
            <TouchableOpacity
              key={t}
              style={[styles.triggerChip, trigger === t && styles.triggerChipActive]}
              onPress={() => setTrigger(t)}
            >
              <Text style={styles.triggerIcon}>{icon}</Text>
              <Text style={[styles.triggerText, trigger === t && styles.triggerTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Suggestion */}
        {suggestion ? (
          <View style={styles.suggestionCard}>
            <Text style={styles.suggestionIcon}>💡</Text>
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </View>
        ) : null}

        {/* Action */}
        <Text style={styles.sectionTitle}>What did you do?</Text>
        {CRAVING_ACTIONS.map(({ action: a, icon }) => (
          <TouchableOpacity
            key={a}
            style={[styles.actionRow, action === a && styles.actionRowActive]}
            onPress={() => setAction(a)}
          >
            <Text style={styles.actionIcon}>{icon}</Text>
            <Text style={styles.actionText}>{a}</Text>
            {action === a && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}

        <TextInput
          style={styles.input}
          placeholder="Notes (optional)"
          placeholderTextColor={Colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </ScrollView>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Log Craving</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderColor: Colors.border },
  cancel: { fontSize: 16, color: Colors.teal },
  title: { fontSize: 17, fontWeight: '600', color: Colors.text },
  body: { flex: 1, padding: Spacing.xl },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md, marginTop: Spacing.xl },
  intensityLabel: { fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: Spacing.md },
  intensityRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.lg },
  intensityDot: { width: 24, height: 24, borderRadius: 12 },
  triggerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  triggerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  triggerChipActive: { borderColor: Colors.teal, backgroundColor: Colors.tealLight },
  triggerIcon: { fontSize: 16, marginRight: Spacing.xs },
  triggerText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  triggerTextActive: { color: Colors.teal },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.yellowLight,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  suggestionIcon: { fontSize: 18, marginRight: Spacing.sm },
  suggestionText: { fontSize: 14, color: Colors.text, flex: 1 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  actionRowActive: { borderColor: Colors.teal, backgroundColor: Colors.tealLight },
  actionIcon: { fontSize: 18, marginRight: Spacing.md },
  actionText: { fontSize: 15, color: Colors.text, flex: 1 },
  checkmark: { fontSize: 16, color: Colors.teal, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.lg, fontSize: 14, color: Colors.text, minHeight: 60, textAlignVertical: 'top' },
  saveButton: { backgroundColor: Colors.teal, margin: Spacing.xl, paddingVertical: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center' },
  saveButtonText: { fontSize: 17, fontWeight: '700', color: Colors.white },
});
