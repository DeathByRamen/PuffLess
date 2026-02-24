import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadows, Type } from '../constants/theme';
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

  const labels = ['Mild', 'Moderate', 'Strong', 'Intense', 'Overwhelming'];
  const colors = [Colors.success, Colors.teal, Colors.amber, Colors.coral, Colors.danger];
  const suggestion = CRAVING_TRIGGERS.find((t) => t.trigger === trigger)?.suggestion ?? '';

  const TRIGGER_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    'Stress': 'thunderstorm-outline', 'Boredom': 'time-outline', 'Social': 'people-outline',
    'Habit': 'repeat-outline', 'After Meal': 'restaurant-outline', 'Anxiety': 'alert-circle-outline',
    'Celebration': 'sparkles-outline', 'Other': 'ellipsis-horizontal-circle-outline',
  };

  const ACTION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    'Vaped': 'cloud-outline', 'Resisted': 'shield-checkmark-outline',
    'Used NRT': 'medkit-outline', 'Breathing Exercise': 'leaf-outline', 'Other': 'ellipsis-horizontal-outline',
  };

  const handleSave = async () => {
    await addCraving({
      id: Date.now().toString(), timestamp: new Date().toISOString(),
      intensity, trigger, action, notes,
    });
    onDismiss();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onDismiss} hitSlop={12}>
          <Ionicons name="close" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Log Craving</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={styles.sectionLabel}>INTENSITY</Text>
        <Text style={[styles.intensityText, { color: colors[intensity - 1] }]}>{labels[intensity - 1]}</Text>
        <View style={styles.dotsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity key={n} onPress={() => setIntensity(n)} activeOpacity={0.7}>
              <View style={[styles.intensityDot, {
                backgroundColor: n <= intensity ? colors[intensity - 1] : Colors.borderLight,
                width: n === intensity ? 32 : 24,
                height: n === intensity ? 32 : 24,
                borderRadius: n === intensity ? 16 : 12,
              }]} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>WHAT TRIGGERED IT?</Text>
        <View style={styles.chipGrid}>
          {CRAVING_TRIGGERS.map(({ trigger: t }) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, trigger === t && styles.chipActive]}
              onPress={() => setTrigger(t)}
              activeOpacity={0.7}
            >
              <Ionicons name={TRIGGER_ICONS[t]} size={18} color={trigger === t ? Colors.teal : Colors.textMuted} />
              <Text style={[styles.chipText, trigger === t && styles.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {suggestion ? (
          <View style={styles.tipCard}>
            <Ionicons name="bulb-outline" size={20} color={Colors.amber} />
            <Text style={styles.tipText}>{suggestion}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>WHAT DID YOU DO?</Text>
        {CRAVING_ACTIONS.map(({ action: a }) => {
          const active = action === a;
          return (
            <TouchableOpacity key={a} style={[styles.actionRow, active && styles.actionRowActive]} onPress={() => setAction(a)} activeOpacity={0.7}>
              <View style={[styles.actionIconWrap, active && styles.actionIconWrapActive]}>
                <Ionicons name={ACTION_ICONS[a]} size={20} color={active ? Colors.white : Colors.textMuted} />
              </View>
              <Text style={[styles.actionText, active && { color: Colors.teal, fontWeight: '600' }]}>{a}</Text>
              {active && <Ionicons name="checkmark" size={20} color={Colors.teal} />}
            </TouchableOpacity>
          );
        })}

        <TextInput
          style={styles.input}
          placeholder="Notes (optional)"
          placeholderTextColor={Colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
          <Ionicons name="flash" size={20} color={Colors.white} />
          <Text style={styles.saveButtonText}>Log Craving</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.xl, borderBottomWidth: 1, borderColor: Colors.divider,
  },
  title: { ...Type.h3 },
  body: { flex: 1, padding: Spacing['2xl'] },
  sectionLabel: { ...Type.caption, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: Spacing['3xl'], marginBottom: Spacing.md },
  intensityText: { fontSize: 36, fontWeight: '800', textAlign: 'center', marginBottom: Spacing.lg },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.lg },
  intensityDot: {},
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    borderRadius: Radius.full, backgroundColor: Colors.bgCard,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  chipActive: { borderColor: Colors.teal, backgroundColor: Colors.tealMuted },
  chipText: { ...Type.caption, color: Colors.textSecondary },
  chipTextActive: { color: Colors.teal, fontWeight: '600' },
  tipCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.lg, backgroundColor: Colors.warningLight,
    borderRadius: Radius.lg, marginTop: Spacing.lg,
  },
  tipText: { ...Type.bodySm, color: Colors.text, flex: 1 },
  actionRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg, marginBottom: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  actionRowActive: { borderColor: Colors.teal, backgroundColor: Colors.tealMuted },
  actionIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bgInput, justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  actionIconWrapActive: { backgroundColor: Colors.teal },
  actionText: { ...Type.bodyMedium, flex: 1 },
  input: {
    backgroundColor: Colors.bgInput, borderRadius: Radius.lg,
    padding: Spacing.lg, marginTop: Spacing['2xl'],
    fontSize: 15, color: Colors.text, minHeight: 60, textAlignVertical: 'top',
  },
  footer: { padding: Spacing.xl },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.teal, paddingVertical: 16, borderRadius: Radius.xl, ...Shadows.md,
  },
  saveButtonText: { fontSize: 17, fontWeight: '700', color: Colors.white },
});
