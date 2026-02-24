import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, Radius } from '../constants/theme';
import { HEALTH_MILESTONES } from '../constants/data';
import { useAppData } from '../hooks/useAppData';
import { moneySaved } from '../services/planGenerator';

export default function ProgressScreen() {
  const { logs, cravings, profile, plan, totalPuffsAvoided, costPerPuff } = useAppData();

  const totalSaved = moneySaved(totalPuffsAvoided, costPerPuff);
  const goalsMetCount = logs.filter((l) => l.goalMet).length;

  const last7Days = (() => {
    const result: { date: string; puffs: number; goal: number; met: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const log = logs.find((l) => l.date === dateStr);
      result.push({
        date: d.toLocaleDateString(undefined, { weekday: 'short' }),
        puffs: log?.puffCount ?? 0,
        goal: log?.dailyGoal ?? 0,
        met: log?.goalMet ?? false,
      });
    }
    return result;
  })();

  const maxPuffs = Math.max(1, ...last7Days.map((d) => d.puffs));

  const triggerCounts = cravings.reduce<Record<string, number>>((acc, c) => {
    acc[c.trigger] = (acc[c.trigger] ?? 0) + 1;
    return acc;
  }, {});
  const sortedTriggers = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]);
  const totalCravings = cravings.length;
  const resistedCount = cravings.filter((c) => c.action !== 'Vaped').length;
  const resistRate = totalCravings > 0 ? Math.round((resistedCount / totalCravings) * 100) : 0;

  const hoursReducing = plan
    ? Math.max(0, Math.round((Date.now() - new Date(plan.startDate).getTime()) / (1000 * 60 * 60)))
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard label="Saved" value={`$${totalSaved.toFixed(0)}`} color={Colors.green} />
        <StatCard label="Goals Met" value={`${goalsMetCount}`} color={Colors.teal} />
        <StatCard label="Avoided" value={`${totalPuffsAvoided}`} color={Colors.orange} />
      </View>

      {/* Weekly Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Last 7 Days</Text>
        {last7Days.some((d) => d.puffs > 0) ? (
          <View style={styles.chart}>
            {last7Days.map((day, i) => (
              <View key={i} style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <View style={[styles.bar, {
                    height: `${(day.puffs / maxPuffs) * 100}%`,
                    backgroundColor: day.met ? Colors.teal : Colors.red,
                  }]} />
                </View>
                <Text style={styles.barLabel}>{day.date}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>Start logging to see your chart</Text>
        )}
      </View>

      {/* Craving Patterns */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Craving Patterns</Text>
        {totalCravings === 0 ? (
          <Text style={styles.emptyText}>Log cravings to see your patterns</Text>
        ) : (
          <>
            {sortedTriggers.slice(0, 4).map(([trigger, count]) => (
              <View key={trigger} style={styles.triggerRow}>
                <Text style={styles.triggerName}>{trigger}</Text>
                <View style={styles.triggerBarTrack}>
                  <View style={[styles.triggerBar, { width: `${(count / totalCravings) * 100}%` }]} />
                </View>
                <Text style={styles.triggerCount}>{count}</Text>
                <Text style={styles.triggerPct}>{Math.round((count / totalCravings) * 100)}%</Text>
              </View>
            ))}
            <Text style={[styles.resistRateText, { color: resistRate >= 50 ? Colors.teal : Colors.orange }]}>
              Resist rate: {resistRate}%
            </Text>
          </>
        )}
      </View>

      {/* Health Milestones */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Health Milestones</Text>
        {HEALTH_MILESTONES.map((m, i) => {
          const unlocked = hoursReducing >= m.hours;
          return (
            <View key={i} style={[styles.milestoneRow, { opacity: unlocked ? 1 : 0.4 }]}>
              <Text style={styles.milestoneCheck}>{unlocked ? '✅' : '⭕'}</Text>
              <View style={styles.milestoneText}>
                <Text style={[styles.milestoneName, unlocked && { fontWeight: '700' }]}>{m.title}</Text>
                <Text style={styles.milestoneDesc}>{m.description}</Text>
              </View>
              <Text style={styles.milestoneTime}>{formatHours(m.hours)}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={statStyles.card}>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function formatHours(hours: number): string {
  if (hours === 0) return 'Now';
  if (hours < 24) return `${hours}h`;
  if (hours < 720) return `${Math.round(hours / 24)}d`;
  return `${Math.round(hours / 720)}mo`;
}

const statStyles = StyleSheet.create({
  card: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, paddingVertical: Spacing.lg, alignItems: 'center' },
  value: { fontSize: 20, fontWeight: '800' },
  label: { fontSize: 12, color: Colors.textSecondary, marginTop: Spacing.xs },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 100 },
  statsRow: { flexDirection: 'row', gap: Spacing.md },
  card: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.xl },
  chart: { flexDirection: 'row', height: 160, gap: Spacing.xs, alignItems: 'flex-end', marginTop: Spacing.md },
  barColumn: { flex: 1, alignItems: 'center' },
  barTrack: { width: '70%', height: 130, justifyContent: 'flex-end', backgroundColor: Colors.borderLight, borderRadius: 4, overflow: 'hidden' },
  bar: { width: '100%', borderRadius: 4, minHeight: 2 },
  barLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: Spacing.xs },
  triggerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  triggerName: { width: 80, fontSize: 13, color: Colors.text },
  triggerBarTrack: { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: 4, marginHorizontal: Spacing.sm, overflow: 'hidden' },
  triggerBar: { height: 8, backgroundColor: Colors.teal, borderRadius: 4 },
  triggerCount: { fontSize: 13, fontWeight: '700', color: Colors.text, width: 30, textAlign: 'right' },
  triggerPct: { fontSize: 11, color: Colors.textSecondary, width: 36, textAlign: 'right' },
  resistRateText: { fontSize: 13, fontWeight: '600', textAlign: 'right', marginTop: Spacing.sm },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  milestoneCheck: { fontSize: 16, marginRight: Spacing.md },
  milestoneText: { flex: 1 },
  milestoneName: { fontSize: 14, color: Colors.text },
  milestoneDesc: { fontSize: 12, color: Colors.textSecondary },
  milestoneTime: { fontSize: 11, color: Colors.textSecondary },
});
