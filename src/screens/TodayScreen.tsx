import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadows, Type } from '../constants/theme';
import { MOTIVATIONAL_MESSAGES } from '../constants/data';
import { useAppData } from '../hooks/useAppData';
import { moneySaved } from '../services/planGenerator';
import QuickLogModal from '../components/QuickLogModal';
import CravingLogModal from '../components/CravingLogModal';

export default function TodayScreen() {
  const { todayLog, todayCravings, todaysGoal, streak, profile, costPerPuff, reload } = useAppData();
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [showCravingLog, setShowCravingLog] = useState(false);

  const puffs = todayLog?.puffCount ?? 0;
  const goal = todaysGoal;
  const progress = goal > 0 ? Math.min(1, puffs / goal) : 0;
  const avoided = profile ? Math.max(0, profile.startingPuffsPerDay - puffs) : 0;
  const saved = moneySaved(avoided, costPerPuff);
  const resisted = todayCravings.filter((c) => c.action !== 'Vaped').length;
  const message = MOTIVATIONAL_MESSAGES[new Date().getDate() % MOTIVATIONAL_MESSAGES.length];
  const underGoal = puffs <= goal;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Progress Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Text style={styles.heroLabel}>Daily Progress</Text>
          <Text style={styles.dateLabel}>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
        </View>

        <View style={styles.ringArea}>
          <View style={styles.ringOuter}>
            <View style={styles.ringBg} />
            <View style={[styles.ringProgress, { width: `${progress * 100}%`, backgroundColor: underGoal ? Colors.teal : Colors.danger }]} />
          </View>
          <Text style={styles.puffCount}>{puffs}</Text>
          <Text style={styles.puffGoal}>of {goal} puffs</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: underGoal ? Colors.successLight : Colors.dangerLight }]}>
          <Ionicons name={underGoal ? 'checkmark-circle' : 'alert-circle'} size={16} color={underGoal ? Colors.success : Colors.danger} />
          <Text style={[styles.statusText, { color: underGoal ? Colors.success : Colors.danger }]}>
            {underGoal
              ? (goal - puffs === 0 ? "You've hit your limit — stay strong!" : `${goal - puffs} puffs remaining`)
              : `${puffs - goal} over today's goal`}
          </Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, Shadows.sm]}>
          <Ionicons name="flame" size={24} color={Colors.amber} />
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={[styles.statCard, Shadows.sm]}>
          <Ionicons name="wallet" size={24} color={Colors.emerald} />
          <Text style={[styles.statValue, { color: Colors.emerald }]}>${saved.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Saved Today</Text>
        </View>
        <View style={[styles.statCard, Shadows.sm]}>
          <Ionicons name="shield-checkmark" size={24} color={Colors.violet} />
          <Text style={styles.statValue}>{resisted}/{todayCravings.length}</Text>
          <Text style={styles.statLabel}>Resisted</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.primaryAction} onPress={() => setShowQuickLog(true)} activeOpacity={0.85}>
          <Ionicons name="add-circle" size={22} color={Colors.white} />
          <Text style={styles.primaryActionText}>Log Puffs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryAction} onPress={() => setShowCravingLog(true)} activeOpacity={0.85}>
          <Ionicons name="flash" size={22} color={Colors.teal} />
          <Text style={styles.secondaryActionText}>Craving</Text>
        </TouchableOpacity>
      </View>

      {/* Cravings */}
      {todayCravings.length > 0 && (
        <View style={[styles.card, Shadows.sm]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Today's Cravings</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{todayCravings.length}</Text>
            </View>
          </View>
          {todayCravings.slice(0, 3).map((c) => (
            <View key={c.id} style={styles.cravingRow}>
              <View style={styles.cravingLeft}>
                <Ionicons
                  name={c.action === 'Vaped' ? 'close-circle' : 'checkmark-circle'}
                  size={20}
                  color={c.action === 'Vaped' ? Colors.danger : Colors.success}
                />
                <Text style={styles.cravingTrigger}>{c.trigger}</Text>
              </View>
              <Text style={styles.cravingTime}>
                {new Date(c.timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Motivational */}
      <View style={[styles.quoteCard, Shadows.sm]}>
        <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.teal} />
        <Text style={styles.quoteText}>{message}</Text>
      </View>

      <Modal visible={showQuickLog} animationType="slide" presentationStyle="pageSheet">
        <QuickLogModal currentCount={puffs} goal={goal} onDismiss={() => { setShowQuickLog(false); reload(); }} />
      </Modal>
      <Modal visible={showCravingLog} animationType="slide" presentationStyle="pageSheet">
        <CravingLogModal onDismiss={() => { setShowCravingLog(false); reload(); }} />
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 100 },

  heroCard: { backgroundColor: Colors.bgCard, borderRadius: Radius['2xl'], padding: Spacing['2xl'], ...Shadows.lg },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  heroLabel: { ...Type.label, color: Colors.textSecondary },
  dateLabel: { ...Type.caption },

  ringArea: { alignItems: 'center', paddingVertical: Spacing['2xl'] },
  ringOuter: { width: '100%', height: 10, backgroundColor: Colors.borderLight, borderRadius: 5, overflow: 'hidden', marginBottom: Spacing.xl },
  ringBg: { ...StyleSheet.absoluteFillObject },
  ringProgress: { height: 10, borderRadius: 5 },
  puffCount: { ...Type.numberLg, marginTop: Spacing.sm },
  puffGoal: { ...Type.bodySm, marginTop: Spacing.xs },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    borderRadius: Radius.full, alignSelf: 'center',
  },
  statusText: { fontSize: 13, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: Spacing.md },
  statCard: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.xl,
    paddingVertical: Spacing.lg, alignItems: 'center', gap: Spacing.xs,
  },
  statValue: { ...Type.h3, fontSize: 18 },
  statLabel: { ...Type.caption, fontSize: 11 },

  actionRow: { flexDirection: 'row', gap: Spacing.md },
  primaryAction: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.teal, paddingVertical: 16, borderRadius: Radius.xl, ...Shadows.md,
  },
  primaryActionText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  secondaryAction: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.tealMuted, paddingVertical: 16, borderRadius: Radius.xl,
    borderWidth: 1.5, borderColor: Colors.tealLight,
  },
  secondaryActionText: { fontSize: 16, fontWeight: '700', color: Colors.teal },

  card: { backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.lg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  cardTitle: { ...Type.label },
  badge: { backgroundColor: Colors.tealMuted, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
  badgeText: { ...Type.caption, color: Colors.teal, fontWeight: '700' },

  cravingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  cravingLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cravingTrigger: { ...Type.bodyMedium },
  cravingTime: { ...Type.caption },

  quoteCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.xl,
    padding: Spacing.xl, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
  },
  quoteText: { ...Type.body, color: Colors.textSecondary, fontStyle: 'italic', flex: 1, lineHeight: 24 },
});
