import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadows, Type } from '../constants/theme';
import { MOOD_EMOJIS } from '../constants/data';
import { upsertTodayLog } from '../services/storage';

interface Props {
  currentCount: number;
  goal: number;
  onDismiss: () => void;
}

export default function QuickLogModal({ currentCount, goal, onDismiss }: Props) {
  const [puffsToAdd, setPuffsToAdd] = useState(1);
  const [mood, setMood] = useState(3);
  const [notes, setNotes] = useState('');

  const handleLog = async () => {
    await upsertTodayLog({ puffCount: puffsToAdd, mood, notes, dailyGoal: goal });
    onDismiss();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onDismiss} hitSlop={12}>
          <Ionicons name="close" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Log Puffs</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.label}>Today so far</Text>
        <Text style={styles.currentCount}>{currentCount}</Text>
        <View style={styles.goalBadge}>
          <Ionicons name="flag-outline" size={14} color={Colors.teal} />
          <Text style={styles.goalText}>Goal: {goal} puffs</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Puffs to add</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => setPuffsToAdd(Math.max(1, puffsToAdd - 1))} activeOpacity={0.7}>
              <Ionicons name="remove" size={24} color={Colors.teal} />
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{puffsToAdd}</Text>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => setPuffsToAdd(puffsToAdd + 1)} activeOpacity={0.7}>
              <Ionicons name="add" size={24} color={Colors.teal} />
            </TouchableOpacity>
          </View>

          <View style={styles.quickRow}>
            {[1, 5, 10, 20].map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.quickChip, puffsToAdd === n && styles.quickChipActive]}
                onPress={() => setPuffsToAdd(n)}
              >
                <Text style={[styles.quickChipText, puffsToAdd === n && styles.quickChipTextActive]}>+{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>How are you feeling?</Text>
          <View style={styles.moodRow}>
            {MOOD_EMOJIS.map((emoji, i) => (
              <TouchableOpacity key={i} onPress={() => setMood(i + 1)} activeOpacity={0.7}>
                <View style={[styles.moodCircle, mood === i + 1 && styles.moodCircleActive]}>
                  <Text style={{ fontSize: mood === i + 1 ? 32 : 24 }}>{emoji}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Notes (optional)"
          placeholderTextColor={Colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logButton} onPress={handleLog} activeOpacity={0.85}>
          <Ionicons name="add-circle" size={20} color={Colors.white} />
          <Text style={styles.logButtonText}>Log {puffsToAdd} Puff{puffsToAdd === 1 ? '' : 's'}</Text>
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
  body: { flex: 1, padding: Spacing['2xl'], alignItems: 'center' },
  label: { ...Type.caption, textTransform: 'uppercase', letterSpacing: 1 },
  currentCount: { ...Type.numberLg, marginTop: Spacing.xs },
  goalBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.tealMuted, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, marginTop: Spacing.sm,
  },
  goalText: { ...Type.caption, color: Colors.teal, fontWeight: '600' },
  section: { width: '100%', marginTop: Spacing['3xl'], alignItems: 'center' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing['3xl'], marginTop: Spacing.md },
  stepperBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.tealMuted, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.tealLight,
  },
  stepperValue: { ...Type.number, minWidth: 70, textAlign: 'center' },
  quickRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  quickChip: {
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full, backgroundColor: Colors.bgInput,
  },
  quickChipActive: { backgroundColor: Colors.teal },
  quickChipText: { ...Type.label, color: Colors.textSecondary },
  quickChipTextActive: { color: Colors.white },
  moodRow: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.md },
  moodCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  moodCircleActive: { backgroundColor: Colors.tealMuted, ...Shadows.sm },
  input: {
    width: '100%', backgroundColor: Colors.bgInput,
    borderRadius: Radius.lg, padding: Spacing.lg, marginTop: Spacing['2xl'],
    fontSize: 15, color: Colors.text, minHeight: 60, textAlignVertical: 'top',
  },
  footer: { padding: Spacing.xl },
  logButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.teal, paddingVertical: 16, borderRadius: Radius.xl, ...Shadows.md,
  },
  logButtonText: { fontSize: 17, fontWeight: '700', color: Colors.white },
});
