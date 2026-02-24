import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Colors, Spacing, Radius } from '../constants/theme';
import { QUIT_METHODS, NRT_TYPES } from '../constants/data';
import { useAppData } from '../hooks/useAppData';
import { getCurrentWeek, getPlanProgress, getDaysRemaining } from '../services/planGenerator';
import { NRTType } from '../models/types';
import { addNRTEntry } from '../services/storage';

export default function PlanScreen() {
  const { plan, profile, nrtEntries, reload } = useAppData();
  const [showNRTModal, setShowNRTModal] = useState(false);

  if (!plan || !profile) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📋</Text>
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Overview */}
      <View style={styles.card}>
        <View style={styles.overviewRow}>
          <View>
            <Text style={styles.weekText}>Week {week + 1} of {totalWeeks}</Text>
            <Text style={styles.remainingText}>{remaining} days remaining</Text>
          </View>
          <View style={styles.progressCircle}>
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
            <View style={styles.goalRight}>
              <Text style={styles.goalLabel}>Nicotine target</Text>
              <Text style={styles.goalValue}>{Math.round(plan.nicotineStepDown[Math.min(week, plan.nicotineStepDown.length - 1)])}mg</Text>
            </View>
          )}
        </View>
        <Text style={styles.targetDate}>🏁 Target: {new Date(plan.targetEndDate).toLocaleDateString()}</Text>
      </View>

      {/* Active Methods */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Active Methods</Text>
        {profile.selectedMethods.map((method) => {
          const info = QUIT_METHODS.find((m) => m.method === method);
          return (
            <View key={method} style={styles.methodItem}>
              <Text style={styles.methodIcon}>{info?.icon ?? '✅'}</Text>
              <View style={styles.methodText}>
                <Text style={styles.methodName}>{method}</Text>
                <Text style={styles.methodDesc}>{info?.description}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Step-Down Schedule */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Step-Down Schedule</Text>
        <View style={styles.scheduleChart}>
          {plan.weeklyTargets.map((target, i) => (
            <View key={i} style={styles.scheduleBar}>
              <View style={[styles.scheduleBarFill, {
                height: `${(target / maxTarget) * 100}%`,
                backgroundColor: i === week ? Colors.teal : Colors.tealLight,
              }]} />
              <Text style={styles.scheduleLabel}>{i + 1}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.scheduleNote}>Week numbers</Text>
      </View>

      {/* NRT Section */}
      {profile.selectedMethods.includes('NRT Tracking') && (
        <View style={styles.card}>
          <View style={styles.nrtHeader}>
            <Text style={styles.cardTitle}>NRT Log</Text>
            <TouchableOpacity onPress={() => setShowNRTModal(true)}>
              <Text style={styles.addButton}>+ Add</Text>
            </TouchableOpacity>
          </View>
          {nrtEntries.length === 0 ? (
            <Text style={styles.emptySmall}>No NRT entries yet</Text>
          ) : (
            nrtEntries.slice(0, 5).map((entry) => (
              <View key={entry.id} style={styles.nrtRow}>
                <Text>{NRT_TYPES.find((t) => t.type === entry.type)?.icon} {entry.type}</Text>
                <Text style={styles.nrtDosage}>{entry.dosageMg}mg</Text>
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
    await addNRTEntry({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type,
      dosageMg: dosage,
      notes,
    });
    onDismiss();
  };

  return (
    <View style={nrtStyles.container}>
      <View style={nrtStyles.header}>
        <TouchableOpacity onPress={onDismiss}><Text style={nrtStyles.cancel}>Cancel</Text></TouchableOpacity>
        <Text style={nrtStyles.title}>Log NRT</Text>
        <TouchableOpacity onPress={handleSave}><Text style={nrtStyles.save}>Save</Text></TouchableOpacity>
      </View>
      <View style={nrtStyles.body}>
        <Text style={nrtStyles.label}>Type</Text>
        <View style={nrtStyles.typeRow}>
          {NRT_TYPES.map(({ type: t, icon }) => (
            <TouchableOpacity
              key={t}
              style={[nrtStyles.typeChip, type === t && nrtStyles.typeChipActive]}
              onPress={() => setType(t)}
            >
              <Text>{icon} {t}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={nrtStyles.label}>Dosage: {dosage}mg</Text>
        <View style={nrtStyles.dosageRow}>
          <TouchableOpacity style={nrtStyles.dosageBtn} onPress={() => setDosage(Math.max(1, dosage - 1))}>
            <Text style={nrtStyles.dosageBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={nrtStyles.dosageValue}>{dosage}mg</Text>
          <TouchableOpacity style={nrtStyles.dosageBtn} onPress={() => setDosage(dosage + 1)}>
            <Text style={nrtStyles.dosageBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={nrtStyles.input}
          placeholder="Notes (optional)"
          placeholderTextColor={Colors.textMuted}
          value={notes}
          onChangeText={setNotes}
        />
      </View>
    </View>
  );
}

const nrtStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderColor: Colors.border },
  cancel: { fontSize: 16, color: Colors.textSecondary },
  title: { fontSize: 17, fontWeight: '600' },
  save: { fontSize: 16, color: Colors.teal, fontWeight: '600' },
  body: { padding: Spacing.xl },
  label: { fontSize: 15, fontWeight: '600', color: Colors.text, marginTop: Spacing.xl, marginBottom: Spacing.md },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  typeChip: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: Radius.md, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: 'transparent' },
  typeChipActive: { borderColor: Colors.teal, backgroundColor: Colors.tealLight },
  dosageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xxl },
  dosageBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.tealLight, justifyContent: 'center', alignItems: 'center' },
  dosageBtnText: { fontSize: 24, fontWeight: '700', color: Colors.teal },
  dosageValue: { fontSize: 32, fontWeight: '800', color: Colors.text },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.xl, fontSize: 14, color: Colors.text },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 100 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
  card: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weekText: { fontSize: 18, fontWeight: '700', color: Colors.text },
  remainingText: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  progressCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.tealLight, justifyContent: 'center', alignItems: 'center' },
  progressText: { fontSize: 14, fontWeight: '700', color: Colors.teal },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  goalsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  goalRight: { alignItems: 'flex-end' },
  goalLabel: { fontSize: 12, color: Colors.textSecondary },
  goalValue: { fontSize: 17, fontWeight: '700', color: Colors.text },
  targetDate: { fontSize: 14, color: Colors.textSecondary, marginTop: Spacing.md },
  methodItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.cardAlt, borderRadius: Radius.md, marginBottom: Spacing.sm },
  methodIcon: { fontSize: 24, marginRight: Spacing.md },
  methodText: { flex: 1 },
  methodName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  methodDesc: { fontSize: 12, color: Colors.textSecondary },
  scheduleChart: { flexDirection: 'row', height: 120, gap: 2, alignItems: 'flex-end', marginTop: Spacing.sm },
  scheduleBar: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  scheduleBarFill: { width: '80%', borderRadius: 3, minHeight: 2 },
  scheduleLabel: { fontSize: 8, color: Colors.textSecondary, marginTop: 2 },
  scheduleNote: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
  nrtHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  addButton: { fontSize: 14, color: Colors.teal, fontWeight: '600' },
  emptySmall: { fontSize: 13, color: Colors.textSecondary },
  nrtRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  nrtDosage: { fontWeight: '700' },
  nrtDate: { fontSize: 12, color: Colors.textSecondary },
});
