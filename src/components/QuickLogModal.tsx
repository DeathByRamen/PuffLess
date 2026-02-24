import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Colors, Spacing, Radius } from '../constants/theme';
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
        <TouchableOpacity onPress={onDismiss}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Log Puffs</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.subLabel}>Today so far</Text>
        <Text style={styles.currentCount}>{currentCount}</Text>
        <Text style={styles.goalText}>Goal: {goal} puffs</Text>

        <Text style={[styles.subLabel, { marginTop: Spacing.xxl }]}>Puffs to add</Text>
        <View style={styles.stepperRow}>
          <TouchableOpacity style={styles.stepperBtn} onPress={() => setPuffsToAdd(Math.max(1, puffsToAdd - 1))}>
            <Text style={styles.stepperText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.stepperValue}>{puffsToAdd}</Text>
          <TouchableOpacity style={styles.stepperBtn} onPress={() => setPuffsToAdd(puffsToAdd + 1)}>
            <Text style={styles.stepperText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickButtons}>
          {[1, 5, 10, 20].map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.quickBtn, puffsToAdd === n && styles.quickBtnActive]}
              onPress={() => setPuffsToAdd(n)}
            >
              <Text style={[styles.quickBtnText, puffsToAdd === n && styles.quickBtnTextActive]}>+{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.subLabel, { marginTop: Spacing.xxl }]}>How are you feeling?</Text>
        <View style={styles.moodRow}>
          {MOOD_EMOJIS.map((emoji, i) => (
            <TouchableOpacity key={i} onPress={() => setMood(i + 1)}>
              <Text style={[styles.moodEmoji, { opacity: mood === i + 1 ? 1 : 0.3, fontSize: mood === i + 1 ? 36 : 28 }]}>{emoji}</Text>
            </TouchableOpacity>
          ))}
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

      <TouchableOpacity style={styles.logButton} onPress={handleLog}>
        <Text style={styles.logButtonText}>Log {puffsToAdd} Puff{puffsToAdd === 1 ? '' : 's'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderColor: Colors.border },
  cancel: { fontSize: 16, color: Colors.teal },
  title: { fontSize: 17, fontWeight: '600', color: Colors.text },
  body: { flex: 1, padding: Spacing.xl, alignItems: 'center' },
  subLabel: { fontSize: 14, color: Colors.textSecondary },
  currentCount: { fontSize: 56, fontWeight: '800', color: Colors.text },
  goalText: { fontSize: 13, color: Colors.textSecondary },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xxl, marginTop: Spacing.md },
  stepperBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.tealLight, justifyContent: 'center', alignItems: 'center' },
  stepperText: { fontSize: 28, fontWeight: '700', color: Colors.teal },
  stepperValue: { fontSize: 48, fontWeight: '800', color: Colors.text, minWidth: 60, textAlign: 'center' },
  quickButtons: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  quickBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  quickBtnActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  quickBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  quickBtnTextActive: { color: Colors.white },
  moodRow: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.md },
  moodEmoji: {},
  input: { width: '100%', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.xl, fontSize: 14, color: Colors.text, minHeight: 60, textAlignVertical: 'top' },
  logButton: { backgroundColor: Colors.teal, margin: Spacing.xl, paddingVertical: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center' },
  logButtonText: { fontSize: 17, fontWeight: '700', color: Colors.white },
});
