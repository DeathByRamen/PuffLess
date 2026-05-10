import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadows, Type } from '../constants/theme';
import { upsertTodayLog } from '../services/storage';

const MOODS = [
  { label: 'Awful', value: 1, icon: 'sad' as const, color: Colors.danger },
  { label: 'Rough', value: 2, icon: 'sad-outline' as const, color: Colors.coral },
  { label: 'OK', value: 3, icon: 'remove-circle-outline' as const, color: Colors.amber },
  { label: 'Good', value: 4, icon: 'happy-outline' as const, color: Colors.sky },
  { label: 'Great', value: 5, icon: 'happy' as const, color: Colors.mint },
];

interface Props { currentCount: number; goal: number; onDismiss: () => void; }

export default function QuickLogModal({ currentCount, goal, onDismiss }: Props) {
  const [mood, setMood] = useState<typeof MOODS[number] | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!mood) return;
    await upsertTodayLog({ puffCount: 0, mood: mood.value });
    setSaved(true);
    setTimeout(onDismiss, 400);
  };

  return (
    <SafeAreaView style={st.safe}>
      <View style={st.header}>
        <TouchableOpacity onPress={onDismiss}><Ionicons name="close" size={28} color={Colors.textMuted} /></TouchableOpacity>
        <Text style={st.title}>How are you feeling?</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={st.body}>
        <Text style={st.sub}>Your mood helps track how quitting affects you</Text>

        <View style={st.todaySummary}>
          <Text style={st.summaryText}>{currentCount} puffs today</Text>
          <Text style={st.summaryGoal}>Goal: {goal}</Text>
        </View>

        <View style={st.moodGrid}>
          {MOODS.map((m) => {
            const active = mood?.value === m.value;
            return (
              <TouchableOpacity key={m.value} style={[st.moodBtn, active && { backgroundColor: m.color + '22', borderColor: m.color }]} onPress={() => setMood(m)} activeOpacity={0.8}>
                <Ionicons name={m.icon} size={32} color={active ? m.color : Colors.textDim} />
                <Text style={[st.moodLabel, active && { color: m.color }]}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {mood && (
          <View style={st.selectedRow}>
            <Ionicons name={mood.icon} size={20} color={mood.color} />
            <Text style={[st.selectedText, { color: mood.color }]}>Feeling {mood.label.toLowerCase()}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[st.saveBtn, !mood && st.saveBtnDisabled, mood && Shadows.glow]}
          onPress={handleSave}
          disabled={!mood || saved}
          activeOpacity={0.85}
        >
          <Text style={st.saveText}>{saved ? 'Saved!' : 'Save Mood'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  title: { ...Type.h3 },
  body: { flex: 1, padding: Spacing['2xl'], alignItems: 'center' },
  sub: { ...Type.bodySm, textAlign: 'center', marginBottom: Spacing['2xl'] },
  todaySummary: { flexDirection: 'row', gap: Spacing.xl, backgroundColor: Colors.bgCard, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, borderRadius: Radius.full, marginBottom: Spacing['3xl'] },
  summaryText: { ...Type.bodyMedium },
  summaryGoal: { ...Type.bodySm },
  moodGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing['2xl'] },
  moodBtn: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.md, borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bgCard, flex: 1 },
  moodLabel: { ...Type.caption, fontWeight: '600' },
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
  selectedText: { fontSize: 16, fontWeight: '600' },
  saveBtn: { backgroundColor: Colors.mint, width: '100%', paddingVertical: 16, borderRadius: Radius.xl, alignItems: 'center' },
  saveBtnDisabled: { backgroundColor: Colors.bgElevated },
  saveText: { fontSize: 16, fontWeight: '700', color: Colors.textInverse },
});
