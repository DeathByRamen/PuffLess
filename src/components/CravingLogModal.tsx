import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadows, Type } from '../constants/theme';
import { CRAVING_TRIGGERS, CRAVING_ACTIONS } from '../constants/data';
import { CravingTrigger, CravingAction } from '../models/types';
import { addCraving } from '../services/storage';

const INTENSITIES = [1, 2, 3, 4, 5];

export default function CravingLogModal({ onDismiss }: { onDismiss: () => void }) {
  const [intensity, setIntensity] = useState(3);
  const [trigger, setTrigger] = useState<CravingTrigger | null>(null);
  const [action, setAction] = useState<CravingAction | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!trigger || !action) return;
    await addCraving({ id: Date.now().toString(), timestamp: new Date().toISOString(), intensity, trigger, action, notes: '' });
    setSaved(true);
    setTimeout(onDismiss, 400);
  };

  const complete = trigger && action;
  const triggerData = trigger ? CRAVING_TRIGGERS.find(t => t.trigger === trigger) : null;

  return (
    <SafeAreaView style={st.safe}>
      <View style={st.header}>
        <TouchableOpacity onPress={onDismiss}><Ionicons name="close" size={28} color={Colors.textMuted} /></TouchableOpacity>
        <Text style={st.title}>Log Craving</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView style={st.scroll} contentContainerStyle={st.body} showsVerticalScrollIndicator={false}>
        {/* Intensity */}
        <Text style={st.sectionTitle}>How strong?</Text>
        <View style={st.intensityRow}>
          {INTENSITIES.map((i) => (
            <TouchableOpacity key={i} style={[st.intensityBtn, intensity >= i && st.intensityActive]} onPress={() => setIntensity(i)} activeOpacity={0.8}>
              <Text style={[st.intensityText, intensity >= i && { color: Colors.textInverse }]}>{i}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={st.intensityLabel}>
          <Text style={st.rangeText}>Mild</Text>
          <Text style={[st.levelText, { color: intensity <= 2 ? Colors.mint : intensity <= 3 ? Colors.amber : Colors.danger }]}>
            {intensity <= 2 ? 'Manageable' : intensity <= 3 ? 'Moderate' : 'Intense'}
          </Text>
          <Text style={st.rangeText}>Extreme</Text>
        </View>

        {/* Trigger */}
        <Text style={st.sectionTitle}>What triggered it?</Text>
        <View style={st.chipWrap}>
          {CRAVING_TRIGGERS.map(({ trigger: t, icon }) => {
            const active = trigger === t;
            return (
              <TouchableOpacity key={t} style={[st.chip, active && st.chipActive]} onPress={() => setTrigger(t)} activeOpacity={0.8}>
                <Ionicons name={icon as any} size={16} color={active ? Colors.textInverse : Colors.textMuted} />
                <Text style={[st.chipText, active && { color: Colors.textInverse }]}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Trigger-specific suggestion */}
        {triggerData && !action && (
          <View style={st.suggestionCard}>
            <Ionicons name="bulb" size={18} color={Colors.amber} />
            <View style={{ flex: 1 }}>
              <Text style={st.suggestionTitle}>Try this instead</Text>
              <Text style={st.suggestionText}>{triggerData.suggestion}</Text>
            </View>
          </View>
        )}

        {/* Action */}
        <Text style={st.sectionTitle}>What did you do?</Text>
        <View style={st.chipWrap}>
          {CRAVING_ACTIONS.map(({ action: a, icon }) => {
            const active = action === a;
            return (
              <TouchableOpacity key={a} style={[st.chip, active && st.chipActive]} onPress={() => setAction(a)} activeOpacity={0.8}>
                <Ionicons name={icon as any} size={16} color={active ? Colors.textInverse : Colors.textMuted} />
                <Text style={[st.chipText, active && { color: Colors.textInverse }]}>{a}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Contextual feedback */}
        {trigger && action && action !== 'Vaped' && (
          <View style={st.feedbackCard}>
            <Ionicons name="sparkles" size={20} color={Colors.mint} />
            <View style={{ flex: 1 }}>
              <Text style={st.feedbackTitle}>Nice work!</Text>
              <Text style={st.feedbackSub}>Every craving resisted weakens the habit. You're building real strength.</Text>
            </View>
          </View>
        )}
        {trigger && action === 'Vaped' && (
          <View style={[st.feedbackCard, { backgroundColor: Colors.warningDim }]}>
            <Ionicons name="heart" size={20} color={Colors.amber} />
            <View style={{ flex: 1 }}>
              <Text style={[st.feedbackTitle, { color: Colors.amber }]}>That's okay</Text>
              <Text style={st.feedbackSub}>Slipping doesn't erase your progress. Logging it is a sign of strength. Tomorrow is a fresh start.</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={[st.saveBtn, !complete && st.saveBtnDisabled, complete && Shadows.glow]} onPress={handleSave} disabled={!complete || saved} activeOpacity={0.85}>
          <Text style={st.saveText}>{saved ? 'Saved!' : 'Save Craving'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  title: { ...Type.h3 },
  scroll: { flex: 1 },
  body: { padding: Spacing['2xl'], paddingBottom: 100 },
  sectionTitle: { ...Type.label, marginBottom: Spacing.md, marginTop: Spacing.xl },
  intensityRow: { flexDirection: 'row', gap: Spacing.sm },
  intensityBtn: { flex: 1, height: 48, borderRadius: Radius.md, backgroundColor: Colors.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  intensityActive: { backgroundColor: Colors.mint, borderColor: Colors.mint },
  intensityText: { fontSize: 16, fontWeight: '700', color: Colors.textMuted },
  intensityLabel: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
  rangeText: { ...Type.caption },
  levelText: { fontSize: 13, fontWeight: '700' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.full, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.mint, borderColor: Colors.mint },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  suggestionCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, backgroundColor: Colors.warningDim, borderRadius: Radius.xl, padding: Spacing.lg, marginTop: Spacing.lg },
  suggestionTitle: { ...Type.label, color: Colors.amber, marginBottom: 2 },
  suggestionText: { ...Type.bodySm },
  feedbackCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, backgroundColor: Colors.mintMuted, borderRadius: Radius.xl, padding: Spacing.lg, marginTop: Spacing.xl },
  feedbackTitle: { ...Type.label, color: Colors.mint, marginBottom: 2 },
  feedbackSub: { ...Type.bodySm, lineHeight: 20 },
  saveBtn: { backgroundColor: Colors.mint, paddingVertical: 16, borderRadius: Radius.xl, alignItems: 'center', marginTop: Spacing['3xl'] },
  saveBtnDisabled: { backgroundColor: Colors.bgElevated },
  saveText: { fontSize: 16, fontWeight: '700', color: Colors.textInverse },
});
