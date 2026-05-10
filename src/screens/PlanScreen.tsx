import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, SafeAreaView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadows, Type } from '../constants/theme';
import { useAppData } from '../hooks/useAppData';
import { getCurrentWeek, getDaysRemaining, getPlanProgress, getTodaysGoal } from '../services/planGenerator';
import { addNRTEntry } from '../services/storage';
import { getLocalDateString } from '../utils/date';
import { NRTType } from '../models/types';

const METHOD_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Gradual Reduction': 'trending-down', 'Trigger Tracking': 'bulb', 'Cold Turkey': 'hand-left',
  'NRT Tracking': 'medkit',
};

const METHOD_COLORS: Record<string, string> = {
  'Gradual Reduction': Colors.mint, 'Trigger Tracking': Colors.amber, 'Cold Turkey': Colors.coral,
  'NRT Tracking': Colors.sky,
};

const NRT_TYPES: NRTType[] = ['Patch', 'Gum', 'Lozenge', 'Other'];

export default function PlanScreen() {
  const { plan, nrtEntries, reload } = useAppData();
  const [showNrt, setShowNrt] = useState(false);
  const [nrtType, setNrtType] = useState<NRTType>('Patch');
  const [nrtDose, setNrtDose] = useState('');

  if (!plan) return (
    <View style={[st.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <View style={st.emptyIcon}>
        <Ionicons name="clipboard-outline" size={40} color={Colors.textDim} />
      </View>
      <Text style={st.emptyTitle}>No plan yet</Text>
      <Text style={st.emptySub}>Complete onboarding to see your plan</Text>
    </View>
  );

  const week = getCurrentWeek(plan);
  const daysLeft = getDaysRemaining(plan);
  const progress = getPlanProgress(plan);
  const todayGoal = getTodaysGoal(plan);

  const saveNrt = async () => {
    await addNRTEntry({ id: Date.now().toString(), date: getLocalDateString(), type: nrtType, dosageMg: parseFloat(nrtDose) || 0, notes: '' });
    setShowNrt(false); setNrtDose('');
    reload();
  };

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      {/* Overview card */}
      <View style={[st.card, Shadows.md]}>
        <View style={st.overviewTop}>
          <View style={{ flex: 1 }}>
            <Text style={st.weekLabel}>Week {week}</Text>
            <View style={st.targetRow}>
              <Text style={st.targetNum}>{todayGoal}</Text>
              <Text style={st.targetUnit}>puffs today</Text>
            </View>
          </View>
          <View style={st.progressRing}>
            <Text style={st.progressPct}>{Math.round(progress * 100)}</Text>
            <Text style={st.progressSymbol}>%</Text>
          </View>
        </View>

        <View style={st.progressTrack}><View style={[st.progressFill, { width: `${progress * 100}%` }]} /></View>

        <View style={st.overviewBottom}>
          <View style={st.overviewStat}>
            <Ionicons name="flag" size={14} color={Colors.textMuted} />
            <Text style={st.overviewStatText}>{daysLeft}d remaining</Text>
          </View>
          <View style={st.overviewStat}>
            <Ionicons name="calendar" size={14} color={Colors.textMuted} />
            <Text style={st.overviewStatText}>{new Date(plan.targetEndDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
          </View>
        </View>
      </View>

      {/* Active methods */}
      <View style={[st.card, Shadows.sm]}>
        <Text style={st.sectionTitle}>Active Methods</Text>
        {plan.activeMethods.filter(m => (m as string) !== 'Gamification').map((method, i) => {
          const color = METHOD_COLORS[method] || Colors.mint;
          return (
            <View key={method}>
              {i > 0 && <View style={st.divider} />}
              <View style={st.methodRow}>
                <View style={[st.methodIcon, { backgroundColor: color + '22' }]}>
                  <Ionicons name={METHOD_ICONS[method] || 'help'} size={18} color={color} />
                </View>
                <Text style={st.methodName}>{method}</Text>
                <View style={[st.methodDot, { backgroundColor: color }]} />
              </View>
            </View>
          );
        })}
      </View>

      {/* Step-down schedule */}
      {plan.weeklyTargets.length > 0 && (
        <View style={[st.card, Shadows.sm]}>
          <Text style={st.sectionTitle}>Step-Down Schedule</Text>
          <View style={st.schedRow}>
            {plan.weeklyTargets.slice(0, 8).map((targetPuffs, i) => {
              const weekNum = i + 1;
              const isCurrent = weekNum === week;
              const isPast = weekNum < week;
              const h = Math.max(12, (targetPuffs / (plan.weeklyTargets[0] || 1)) * 80);
              return (
                <View key={i} style={st.schedCol}>
                  <Text style={[st.schedVal, isCurrent && { color: Colors.mint, fontWeight: '700' }]}>{targetPuffs}</Text>
                  <View style={[st.schedBar, { height: h }, isCurrent && st.schedBarCur, isPast && st.schedBarPast]} />
                  <Text style={[st.schedLabel, isCurrent && { color: Colors.mint, fontWeight: '700' }]}>W{weekNum}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* NRT log */}
      {plan.activeMethods.includes('NRT Tracking') && (
        <View style={[st.card, Shadows.sm]}>
          <View style={st.nrtHeader}>
            <Text style={st.sectionTitle}>NRT Log</Text>
            <TouchableOpacity onPress={() => setShowNrt(true)} style={st.addBtn} activeOpacity={0.7}>
              <Ionicons name="add-circle" size={20} color={Colors.mint} />
              <Text style={st.addText}>Add</Text>
            </TouchableOpacity>
          </View>
          {nrtEntries.length === 0 ? (
            <View style={st.nrtEmptyWrap}>
              <Ionicons name="medkit-outline" size={28} color={Colors.textDim} />
              <Text style={st.nrtEmpty}>No NRT entries yet</Text>
            </View>
          ) : (
            nrtEntries.slice(-5).reverse().map((e, i) => (
              <View key={e.id}>
                {i > 0 && <View style={st.divider} />}
                <View style={st.nrtRow}>
                  <View style={[st.nrtIcon, { backgroundColor: Colors.sky + '22' }]}>
                    <Ionicons name="medkit" size={14} color={Colors.sky} />
                  </View>
                  <Text style={st.nrtType}>{e.type}</Text>
                  <Text style={st.nrtDose}>{e.dosageMg}mg</Text>
                  <Text style={st.nrtDate}>{e.date}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* NRT modal */}
      <Modal visible={showNrt} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={st.modal}>
          <View style={st.modalHeader}>
            <TouchableOpacity onPress={() => setShowNrt(false)}><Ionicons name="close" size={28} color={Colors.textMuted} /></TouchableOpacity>
            <Text style={st.modalTitle}>Add NRT Entry</Text>
            <View style={{ width: 28 }} />
          </View>
          <View style={st.modalBody}>
            <Text style={st.fieldLabel}>Type</Text>
            <View style={st.nrtTypes}>
              {NRT_TYPES.map(t => (
                <TouchableOpacity key={t} style={[st.nrtChip, nrtType === t && st.nrtChipActive]} onPress={() => setNrtType(t)}>
                  <Text style={[st.nrtChipText, nrtType === t && { color: Colors.textInverse }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={st.fieldLabel}>Dose (mg)</Text>
            <TextInput style={st.input} value={nrtDose} onChangeText={setNrtDose} keyboardType="numeric" placeholder="e.g. 21" placeholderTextColor={Colors.textDim} />
            <TouchableOpacity style={[st.saveBtn, Shadows.glow]} onPress={saveNrt} activeOpacity={0.85}>
              <Text style={st.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 100 },
  card: { backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.lg },
  divider: { height: 1, backgroundColor: Colors.divider },

  overviewTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.lg },
  weekLabel: { ...Type.caption, marginBottom: Spacing.xs },
  targetRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  targetNum: { fontSize: 36, fontWeight: '800', color: Colors.mint },
  targetUnit: { ...Type.bodySm },
  progressRing: { width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: Colors.mint, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  progressPct: { fontSize: 18, fontWeight: '800', color: Colors.mint },
  progressSymbol: { fontSize: 10, fontWeight: '700', color: Colors.mint, marginTop: 2 },
  progressTrack: { height: 6, backgroundColor: Colors.bgElevated, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: Colors.mint, borderRadius: 3 },
  overviewBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md },
  overviewStat: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  overviewStatText: { ...Type.caption },

  sectionTitle: { ...Type.label, marginBottom: Spacing.md },
  methodRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.md },
  methodIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  methodName: { ...Type.bodyMedium, flex: 1 },
  methodDot: { width: 8, height: 8, borderRadius: 4 },

  schedRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 120 },
  schedCol: { alignItems: 'center', flex: 1 },
  schedVal: { ...Type.caption, color: Colors.textMuted, fontSize: 10, marginBottom: 4 },
  schedBar: { width: 16, backgroundColor: Colors.bgElevated, borderRadius: 8 },
  schedBarCur: { backgroundColor: Colors.mint },
  schedBarPast: { backgroundColor: Colors.mintMuted },
  schedLabel: { ...Type.caption, marginTop: 6 },

  nrtHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addText: { ...Type.label, color: Colors.mint },
  nrtEmptyWrap: { alignItems: 'center', paddingVertical: Spacing['2xl'], gap: Spacing.sm },
  nrtEmpty: { ...Type.bodySm },
  nrtRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  nrtIcon: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  nrtType: { ...Type.bodyMedium, flex: 1 },
  nrtDose: { ...Type.label, color: Colors.mint },
  nrtDate: { ...Type.caption, width: 80, textAlign: 'right' },

  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.bgCard, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg },
  emptyTitle: { ...Type.bodyMedium, color: Colors.textMuted },
  emptySub: { ...Type.caption, marginTop: Spacing.xs },

  modal: { flex: 1, backgroundColor: Colors.bg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  modalTitle: { ...Type.h3 },
  modalBody: { padding: Spacing['2xl'] },
  fieldLabel: { ...Type.label, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  nrtTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  nrtChip: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: Radius.full, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  nrtChipActive: { backgroundColor: Colors.mint, borderColor: Colors.mint },
  nrtChipText: { ...Type.label, color: Colors.textSecondary },
  input: { backgroundColor: Colors.bgInput, borderRadius: Radius.md, padding: Spacing.lg, color: Colors.text, fontSize: 16, marginTop: Spacing.xs },
  saveBtn: { backgroundColor: Colors.mint, paddingVertical: 16, borderRadius: Radius.xl, alignItems: 'center', marginTop: Spacing['3xl'] },
  saveText: { fontSize: 16, fontWeight: '700', color: Colors.textInverse },
});
