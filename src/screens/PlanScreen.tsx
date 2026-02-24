import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadows, Type } from '../constants/theme';
import { QUIT_METHODS, NRT_TYPES } from '../constants/data';
import { useAppData } from '../hooks/useAppData';
import { getCurrentWeek, getPlanProgress, getDaysRemaining } from '../services/planGenerator';
import { NRTType } from '../models/types';
import { addNRTEntry } from '../services/storage';

const METHOD_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Gradual Reduction': 'trending-down-outline', 'Trigger Tracking': 'bulb-outline',
  'Cold Turkey': 'hand-left-outline', 'NRT Tracking': 'medkit-outline', 'Gamification': 'trophy-outline',
};

export default function PlanScreen() {
  const { plan, profile, nrtEntries, reload } = useAppData();
  const [showNRTModal, setShowNRTModal] = useState(false);

  if (!plan || !profile) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="clipboard-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>No Plan Yet</Text>
        <Text style={styles.emptyText}>Complete onboarding to create your quit plan</Text>
      </View>
    );
  }

  const week = getCurrentWeek(plan);
  const progress = getPlanProgress(plan);
  const remaining = getDaysRemaining(plan);
  const totalWeeks = Math.max(1, plan.weeklyTargets.length - 1);
  const maxTarget = Math.max(1, ...plan.weeklyTargets);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Overview */}
      <View style={[styles.card, Shadows.md]}>
        <View style={styles.overviewRow}>
          <View>
            <Text style={styles.weekText}>Week {week + 1} of {totalWeeks}</Text>
            <Text style={styles.remainingText}>{remaining} days remaining</Text>
          </View>
          <View style={styles.progressRing}>
            <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.goalsRow}>
          <View>
            <Text style={styles.goalLabel}>This week's goal</Text>
            <Text style={styles.goalValue}>{plan.weeklyTargets[Math.min(week, plan.weeklyTargets.length - 1)]} puffs/day</Text>
          </View>
          {plan.nicotineStepDown.length > 0 && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.goalLabel}>Nicotine</Text>
              <Text style={styles.goalValue}>{Math.round(plan.nicotineStepDown[Math.min(week, plan.nicotineStepDown.length - 1)])}mg</Text>
            </View>
          )}
        </View>
        <View style={styles.targetRow}>
          <Ionicons name="flag" size={16} color={Colors.teal} />
          <Text style={styles.targetText}>
            Target: {new Date(plan.targetEndDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>
      </View>

      {/* Methods */}
      <View style={[styles.card, Shadows.sm]}>
        <Text style={styles.cardTitle}>Active Methods</Text>
        {profile.selectedMethods.map((method) => {
          const info = QUIT_METHODS.find((m) => m.method === method);
          return (
            <View key={method} style={styles.methodItem}>
              <View style={styles.methodIconWrap}>
                <Ionicons name={METHOD_ICONS[method]} size={20} color={Colors.teal} />
              </View>
              <View style={styles.methodTextWrap}>
                <Text style={styles.methodName}>{method}</Text>
                <Text style={styles.methodDesc}>{info?.description}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Step-Down */}
      <View style={[styles.card, Shadows.sm]}>
        <Text style={styles.cardTitle}>Step-Down Schedule</Text>
        <View style={styles.scheduleChart}>
          {plan.weeklyTargets.map((target, i) => (
            <View key={i} style={styles.scheduleCol}>
              <View style={[styles.scheduleBar, {
                height: `${Math.max(2, (target / maxTarget) * 100)}%`,
                backgroundColor: i === week ? Colors.teal : Colors.tealLight,
                borderRadius: 3,
              }]} />
            </View>
          ))}
        </View>
      </View>

      {/* NRT */}
      {profile.selectedMethods.includes('NRT Tracking') && (
        <View style={[styles.card, Shadows.sm]}>
          <View style={styles.nrtHeader}>
            <Text style={styles.cardTitle}>NRT Log</Text>
            <TouchableOpacity onPress={() => setShowNRTModal(true)} style={styles.addBtn}>
              <Ionicons name="add" size={18} color={Colors.teal} />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          {nrtEntries.length === 0 ? (
            <Text style={styles.emptySmall}>No entries yet</Text>
          ) : (
            nrtEntries.slice(0, 5).map((entry) => (
              <View key={entry.id} style={styles.nrtRow}>
                <Ionicons name="medkit-outline" size={18} color={Colors.textSecondary} />
                <Text style={styles.nrtType}>{entry.type}</Text>
                <Text style={styles.nrtDose}>{entry.dosageMg}mg</Text>
                <Text style={styles.nrtDate}>{new Date(entry.date).toLocaleDateString()}</Text>
              </View>
            ))
          )}
        </View>
      )}

      <Modal visible={showNRTModal} animationType="slide" presentationStyle="pageSheet">
        <NRTModal onDismiss={() => { setShowNRTModal(false); reload(); }} />
      </Modal>
    </ScrollView>
  );
}

function NRTModal({ onDismiss }: { onDismiss: () => void }) {
  const [type, setType] = useState<NRTType>('Patch');
  const [dosage, setDosage] = useState(21);
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    await addNRTEntry({ id: Date.now().toString(), date: new Date().toISOString(), type, dosageMg: dosage, notes });
    onDismiss();
  };

  return (
    <View style={nrt.container}>
      <View style={nrt.header}>
        <TouchableOpacity onPress={onDismiss}><Ionicons name="close" size={24} color={Colors.textSecondary} /></TouchableOpacity>
        <Text style={nrt.title}>Log NRT</Text>
        <TouchableOpacity onPress={handleSave}><Text style={nrt.save}>Save</Text></TouchableOpacity>
      </View>
      <View style={nrt.body}>
        <Text style={nrt.label}>TYPE</Text>
        <View style={nrt.typeRow}>
          {NRT_TYPES.map(({ type: t, icon }) => (
            <TouchableOpacity key={t} style={[nrt.typeChip, type === t && nrt.typeActive]} onPress={() => setType(t)}>
              <Text>{icon} {t}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={nrt.label}>DOSAGE</Text>
        <View style={nrt.doseRow}>
          <TouchableOpacity style={nrt.doseBtn} onPress={() => setDosage(Math.max(1, dosage - 1))}>
            <Ionicons name="remove" size={22} color={Colors.teal} />
          </TouchableOpacity>
          <Text style={nrt.doseVal}>{dosage}mg</Text>
          <TouchableOpacity style={nrt.doseBtn} onPress={() => setDosage(dosage + 1)}>
            <Ionicons name="add" size={22} color={Colors.teal} />
          </TouchableOpacity>
        </View>
        <TextInput style={nrt.input} placeholder="Notes (optional)" placeholderTextColor={Colors.textMuted} value={notes} onChangeText={setNotes} />
      </View>
    </View>
  );
}

const nrt = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl, borderBottomWidth: 1, borderColor: Colors.divider },
  title: { ...Type.h3 },
  save: { fontSize: 16, color: Colors.teal, fontWeight: '700' },
  body: { padding: Spacing['2xl'] },
  label: { ...Type.caption, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: Spacing['3xl'], marginBottom: Spacing.md },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  typeChip: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: Radius.full, backgroundColor: Colors.bgCard, borderWidth: 1.5, borderColor: Colors.border },
  typeActive: { borderColor: Colors.teal, backgroundColor: Colors.tealMuted },
  doseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing['3xl'] },
  doseBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.tealMuted, justifyContent: 'center', alignItems: 'center' },
  doseVal: { ...Type.number, fontSize: 36 },
  input: { backgroundColor: Colors.bgInput, borderRadius: Radius.lg, padding: Spacing.lg, marginTop: Spacing['2xl'], fontSize: 15, color: Colors.text },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 100 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg, gap: Spacing.md },
  emptyTitle: { ...Type.h3 },
  emptyText: { ...Type.bodySm },
  card: { backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.xl },
  cardTitle: { ...Type.label, marginBottom: Spacing.lg },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weekText: { ...Type.h3 },
  remainingText: { ...Type.bodySm, marginTop: 2 },
  progressRing: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.tealMuted, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: Colors.teal },
  progressText: { ...Type.label, color: Colors.teal, fontSize: 14 },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.lg },
  goalsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  goalLabel: { ...Type.caption },
  goalValue: { ...Type.h3, fontSize: 18, marginTop: 2 },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg },
  targetText: { ...Type.bodySm, color: Colors.teal },
  methodItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.bgInput, borderRadius: Radius.lg, marginBottom: Spacing.sm },
  methodIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.tealMuted, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  methodTextWrap: { flex: 1 },
  methodName: { ...Type.label, fontSize: 14 },
  methodDesc: { ...Type.caption, marginTop: 2 },
  scheduleChart: { flexDirection: 'row', height: 120, gap: 2, alignItems: 'flex-end' },
  scheduleCol: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  scheduleBar: { width: '80%', alignSelf: 'center', minHeight: 2 },
  nrtHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { ...Type.label, color: Colors.teal, fontSize: 14 },
  emptySmall: { ...Type.bodySm },
  nrtRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  nrtType: { ...Type.bodyMedium, flex: 1 },
  nrtDose: { ...Type.label },
  nrtDate: { ...Type.caption },
});
