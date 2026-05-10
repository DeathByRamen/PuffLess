import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadows, Type } from '../constants/theme';
import { MOTIVATIONAL_MESSAGES } from '../constants/data';
import { useAppData } from '../hooks/useAppData';
import { moneySaved } from '../services/planGenerator';
import { upsertTodayLog } from '../services/storage';
import QuickLogModal from '../components/QuickLogModal';
import CravingLogModal from '../components/CravingLogModal';

export default function TodayScreen() {
  const { todayLog, todayCravings, todaysGoal, streak, profile, costPerPuff, reload } = useAppData();
  const [showMoodLog, setShowMoodLog] = useState(false);
  const [showCravingLog, setShowCravingLog] = useState(false);
  const [showAllCravings, setShowAllCravings] = useState(false);
  const [puffInput, setPuffInput] = useState('');

  const puffs = todayLog?.puffCount ?? 0;
  const goal = todaysGoal;
  const displayPuffInput = puffInput !== '' ? puffInput : String(puffs);
  const progress = goal > 0 ? Math.min(1, puffs / goal) : 0;
  const avoided = profile ? Math.max(0, profile.startingPuffsPerDay - puffs) : 0;
  const saved = moneySaved(avoided, costPerPuff);
  const resisted = todayCravings.filter((c) => c.action !== 'Vaped').length;
  const message = MOTIVATIONAL_MESSAGES[new Date().getDate() % MOTIVATIONAL_MESSAGES.length];
  const ok = puffs <= goal;

  const handleIncrement = async () => {
    await upsertTodayLog({ puffCount: 1, dailyGoal: goal });
    reload();
  };

  const handleDecrement = async () => {
    if (puffs <= 0) return;
    await upsertTodayLog({ puffCount: -1, dailyGoal: goal });
    reload();
  };

  const handleSetPuffs = async (value: number) => {
    const n = Math.max(0, Math.round(value));
    await upsertTodayLog({ puffCount: n, setAbsolute: true, dailyGoal: goal });
    reload();
  };

  const displayCravings = showAllCravings ? todayCravings : todayCravings.slice(0, 3);

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={[st.hero, Shadows.lg]}>
        <View style={st.heroHead}>
          <Text style={st.heroLabel}>Today</Text>
          <Text style={st.dateLabel}>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
        </View>

        <View style={st.counterArea}>
          <TouchableOpacity style={st.counterBtn} onPress={handleDecrement} activeOpacity={0.7} disabled={puffs <= 0}>
            <Ionicons name="remove" size={28} color={puffs <= 0 ? Colors.textDim : Colors.text} />
          </TouchableOpacity>
          <View style={st.counterCenter}>
            <TextInput
              style={st.bigNumInput}
              value={displayPuffInput}
              onChangeText={(t) => setPuffInput(t.replace(/\D/g, ''))}
              onBlur={() => {
                const n = parseInt(puffInput || String(puffs), 10);
                if (!isNaN(n) && n >= 0 && n !== puffs) {
                  handleSetPuffs(n);
                }
                setPuffInput('');
              }}
              onFocus={() => setPuffInput(String(puffs))}
              keyboardType="number-pad"
              selectTextOnFocus
              maxLength={5}
            />
            <Text style={st.bigSub}>of {goal} puffs</Text>
          </View>
          <TouchableOpacity style={[st.counterBtn, st.counterBtnAdd]} onPress={handleIncrement} activeOpacity={0.7}>
            <Ionicons name="add" size={28} color={Colors.textInverse} />
          </TouchableOpacity>
        </View>

        <View style={st.progressTrack}>
          <View style={[st.progressFill, { width: `${Math.min(progress, 1) * 100}%`, backgroundColor: ok ? Colors.mint : Colors.danger }]} />
        </View>
        <View style={st.progressLabels}>
          <Text style={st.progressPct}>{Math.round(progress * 100)}%</Text>
          <View style={[st.statusPill, { backgroundColor: ok ? Colors.successDim : Colors.dangerDim }]}>
            <Ionicons name={ok ? 'checkmark-circle' : 'alert-circle'} size={14} color={ok ? Colors.success : Colors.danger} />
            <Text style={[st.statusText, { color: ok ? Colors.success : Colors.danger }]}>
              {ok ? (goal - puffs === 0 ? 'At limit' : `${goal - puffs} left`) : `${puffs - goal} over`}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={st.statsRow}>
        <View style={[st.stat, Shadows.sm]}>
          <Ionicons name="flame" size={22} color={Colors.amber} />
          <Text style={st.statVal}>{streak}</Text>
          <Text style={st.statLabel}>Day Streak</Text>
        </View>
        <View style={[st.stat, Shadows.sm]}>
          <Ionicons name="wallet" size={22} color={Colors.mint} />
          <Text style={[st.statVal, { color: Colors.mint }]}>${saved.toFixed(2)}</Text>
          <Text style={st.statLabel}>Saved Today</Text>
        </View>
        <View style={[st.stat, Shadows.sm]}>
          <Ionicons name="shield-checkmark" size={22} color={Colors.violet} />
          <Text style={st.statVal}>{resisted}/{todayCravings.length}</Text>
          <Text style={st.statLabel}>Resisted</Text>
        </View>
      </View>

      {/* Quick actions */}
      <View style={st.actionRow}>
        <TouchableOpacity style={st.secondaryBtn} onPress={() => setShowCravingLog(true)} activeOpacity={0.85}>
          <Ionicons name="flash" size={20} color={Colors.mint} />
          <Text style={st.secondaryText}>Log Craving</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.tertiaryBtn} onPress={() => setShowMoodLog(true)} activeOpacity={0.85}>
          <Ionicons name="happy-outline" size={20} color={Colors.amber} />
          <Text style={st.tertiaryText}>Mood</Text>
        </TouchableOpacity>
      </View>

      {/* Cravings */}
      {todayCravings.length > 0 ? (
        <View style={[st.card, Shadows.sm]}>
          <View style={st.cardHead}>
            <Text style={st.cardTitle}>Today's Cravings</Text>
            <View style={st.badge}><Text style={st.badgeText}>{todayCravings.length}</Text></View>
          </View>
          {displayCravings.map((c, i) => (
            <View key={c.id}>
              {i > 0 && <View style={st.rowDivider} />}
              <View style={st.cravingRow}>
                <View style={[st.cravingDot, { backgroundColor: c.action === 'Vaped' ? Colors.danger : Colors.mint }]} />
                <View style={{ flex: 1 }}>
                  <Text style={st.cravingTrigger}>{c.trigger}</Text>
                  <Text style={st.cravingAction}>{c.action}</Text>
                </View>
                <Text style={st.cravingTime}>{new Date(c.timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</Text>
              </View>
            </View>
          ))}
          {todayCravings.length > 3 && (
            <TouchableOpacity style={st.viewAllBtn} onPress={() => setShowAllCravings(!showAllCravings)} activeOpacity={0.7}>
              <Text style={st.viewAllText}>{showAllCravings ? 'Show less' : `View all ${todayCravings.length} cravings`}</Text>
              <Ionicons name={showAllCravings ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.mint} />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={[st.card, Shadows.sm, st.emptyCard]}>
          <Ionicons name="shield-outline" size={32} color={Colors.textDim} />
          <Text style={st.emptyTitle}>No cravings logged yet</Text>
          <Text style={st.emptySub}>Tap "Log Craving" when one hits</Text>
        </View>
      )}

      {/* Quote */}
      <View style={[st.quoteCard, Shadows.sm]}>
        <View style={st.quoteIcon}>
          <Ionicons name="chatbubble-ellipses" size={16} color={Colors.mint} />
        </View>
        <Text style={st.quoteText}>{message}</Text>
      </View>

      <Modal visible={showMoodLog} animationType="slide" presentationStyle="pageSheet">
        <QuickLogModal currentCount={puffs} goal={goal} onDismiss={() => { setShowMoodLog(false); reload(); }} />
      </Modal>
      <Modal visible={showCravingLog} animationType="slide" presentationStyle="pageSheet">
        <CravingLogModal onDismiss={() => { setShowCravingLog(false); reload(); }} />
      </Modal>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 100 },

  hero: { backgroundColor: Colors.bgCard, borderRadius: Radius['2xl'], padding: Spacing['2xl'] },
  heroHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  heroLabel: { ...Type.h3 },
  dateLabel: { ...Type.caption },

  counterArea: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing['2xl'], gap: Spacing.xl },
  counterBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center' },
  counterBtnAdd: { backgroundColor: Colors.mint, ...Shadows.glow },
  counterCenter: { alignItems: 'center', minWidth: 100 },
  bigNum: { ...Type.numberLg, color: Colors.text },
  bigNumInput: { ...Type.numberLg, color: Colors.text, padding: 0, margin: 0, textAlign: 'center', minWidth: 60 },
  bigSub: { ...Type.bodySm, marginTop: Spacing.xs },

  progressTrack: { height: 8, backgroundColor: Colors.bgElevated, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md },
  progressPct: { ...Type.caption, color: Colors.textSecondary },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: Spacing.sm, borderRadius: Radius.full },
  statusText: { fontSize: 12, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: Spacing.md },
  stat: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.xl, paddingVertical: Spacing.lg, alignItems: 'center', gap: Spacing.xs },
  statVal: { ...Type.h3, fontSize: 18 },
  statLabel: { ...Type.caption, fontSize: 11 },

  actionRow: { flexDirection: 'row', gap: Spacing.md },
  secondaryBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.mintMuted, paddingVertical: 14, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.mintGlow },
  secondaryText: { fontSize: 15, fontWeight: '700', color: Colors.mint },
  tertiaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, backgroundColor: Colors.bgCard, paddingVertical: 14, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border },
  tertiaryText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },

  card: { backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.lg },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  cardTitle: { ...Type.label },
  badge: { backgroundColor: Colors.mintMuted, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
  badgeText: { ...Type.caption, color: Colors.mint, fontWeight: '700' },

  rowDivider: { height: 1, backgroundColor: Colors.divider, marginVertical: 2 },
  cravingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.md },
  cravingDot: { width: 8, height: 8, borderRadius: 4 },
  cravingTrigger: { ...Type.bodyMedium },
  cravingAction: { ...Type.caption, marginTop: 1 },
  cravingTime: { ...Type.caption },

  viewAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.divider, marginTop: Spacing.sm },
  viewAllText: { ...Type.bodySm, color: Colors.mint, fontWeight: '600' },

  emptyCard: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.sm },
  emptyTitle: { ...Type.bodyMedium, color: Colors.textMuted },
  emptySub: { ...Type.caption },

  quoteCard: { backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.lg, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  quoteIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.mintMuted, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  quoteText: { ...Type.body, color: Colors.textSecondary, fontStyle: 'italic', flex: 1, lineHeight: 24 },
});
