import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Colors, Spacing, Radius } from '../constants/theme';
import { MOTIVATIONAL_MESSAGES, MOOD_EMOJIS } from '../constants/data';
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
  const circumference = 2 * Math.PI * 70;
  const avoided = profile ? Math.max(0, profile.startingPuffsPerDay - puffs) : 0;
  const saved = moneySaved(avoided, costPerPuff);
  const resisted = todayCravings.filter((c) => c.action !== 'Vaped').length;
  const message = MOTIVATIONAL_MESSAGES[new Date().getDate() % MOTIVATIONAL_MESSAGES.length];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Progress Ring */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Daily Progress</Text>
          <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>
        </View>
        <View style={styles.ringContainer}>
          <View style={styles.ring}>
            <Text style={styles.ringNumber}>{puffs}</Text>
            <Text style={styles.ringLabel}>of {goal} puffs</Text>
          </View>
          <View style={[styles.progressArc, { opacity: progress > 0 ? 1 : 0.2 }]}>
            <View style={[styles.arcFill, {
              width: `${progress * 100}%`,
              backgroundColor: puffs <= goal ? Colors.teal : Colors.red,
            }]} />
          </View>
        </View>
        {puffs <= goal ? (
          <Text style={[styles.statusText, { color: Colors.teal }]}>
            ✓ {goal - puffs === 0 ? "You've hit your limit — stay strong!" : `${goal - puffs} puffs remaining`}
          </Text>
        ) : (
          <Text style={[styles.statusText, { color: Colors.red }]}>
            ⚠ {puffs - goal} over today's goal
          </Text>
        )}
      </View>

      {/* Streak & Savings */}
      <View style={styles.card}>
        <View style={styles.streakRow}>
          <View>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakNumber}>{streak} day streak</Text>
            <Text style={styles.streakLabel}>Days under goal</Text>
          </View>
          <View style={styles.savingsBox}>
            <Text style={styles.savingsAmount}>${saved.toFixed(2)}</Text>
            <Text style={styles.streakLabel}>saved today</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => setShowQuickLog(true)}>
          <Text style={styles.primaryButtonText}>＋ Log Puffs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowCravingLog(true)}>
          <Text style={styles.secondaryButtonText}>💜 Craving</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Cravings */}
      {todayCravings.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Cravings ({todayCravings.length})</Text>
          <Text style={[styles.resistText, { color: resisted > todayCravings.length / 2 ? Colors.teal : Colors.orange }]}>
            {resisted} of {todayCravings.length} resisted
          </Text>
          {todayCravings.slice(0, 3).map((c) => (
            <View key={c.id} style={styles.cravingItem}>
              <Text>{c.trigger}</Text>
              <Text style={{ color: c.action === 'Vaped' ? Colors.red : Colors.teal }}>{c.action}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Motivational */}
      <View style={styles.card}>
        <Text style={styles.quoteText}>"{message}"</Text>
      </View>

      <Modal visible={showQuickLog} animationType="slide" presentationStyle="pageSheet">
        <QuickLogModal
          currentCount={puffs}
          goal={goal}
          onDismiss={() => { setShowQuickLog(false); reload(); }}
        />
      </Modal>
      <Modal visible={showCravingLog} animationType="slide" presentationStyle="pageSheet">
        <CravingLogModal onDismiss={() => { setShowCravingLog(false); reload(); }} />
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 100 },
  card: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  dateText: { fontSize: 13, color: Colors.textSecondary },
  ringContainer: { alignItems: 'center', paddingVertical: Spacing.xl },
  ring: { alignItems: 'center' },
  ringNumber: { fontSize: 56, fontWeight: '800', color: Colors.text },
  ringLabel: { fontSize: 14, color: Colors.textSecondary },
  progressArc: { width: '100%', height: 8, backgroundColor: Colors.border, borderRadius: 4, marginTop: Spacing.lg, overflow: 'hidden' },
  arcFill: { height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, fontWeight: '600', marginTop: Spacing.md },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  streakEmoji: { fontSize: 28 },
  streakNumber: { fontSize: 18, fontWeight: '700', color: Colors.text },
  streakLabel: { fontSize: 12, color: Colors.textSecondary },
  savingsBox: { alignItems: 'flex-end' },
  savingsAmount: { fontSize: 20, fontWeight: '700', color: Colors.green },
  buttonRow: { flexDirection: 'row', gap: Spacing.md },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.teal,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.tealLight,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '700', color: Colors.teal },
  resistText: { fontSize: 14, fontWeight: '600', marginTop: Spacing.xs, marginBottom: Spacing.md },
  cravingItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  quoteText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', fontStyle: 'italic', lineHeight: 22 },
});
