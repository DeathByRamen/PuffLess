import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadows, Type } from '../constants/theme';
import { HEALTH_MILESTONES } from '../constants/data';
import { useAppData } from '../hooks/useAppData';
import { moneySaved } from '../services/planGenerator';

export default function ProgressScreen() {
  const { logs, cravings, profile, plan, totalPuffsAvoided, costPerPuff } = useAppData();

  const totalSaved = moneySaved(totalPuffsAvoided, costPerPuff);
  const goalsMetCount = logs.filter((l) => l.goalMet).length;

  const last7Days = (() => {
    const result: { day: string; puffs: number; goal: number; met: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const log = logs.find((l) => l.date === dateStr);
      result.push({
        day: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
        puffs: log?.puffCount ?? 0, goal: log?.dailyGoal ?? 0, met: log?.goalMet ?? false,
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

  const hoursReducing = plan ? Math.max(0, Math.round((Date.now() - new Date(plan.startDate).getTime()) / 3600000)) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard icon="wallet-outline" label="Saved" value={`$${totalSaved.toFixed(0)}`} color={Colors.emerald} />
        <StatCard icon="checkmark-circle-outline" label="Goals Met" value={`${goalsMetCount}`} color={Colors.teal} />
        <StatCard icon="ban-outline" label="Avoided" value={`${totalPuffsAvoided}`} color={Colors.amber} />
      </View>

      {/* Chart */}
      <View style={[styles.card, Shadows.sm]}>
        <Text style={styles.cardTitle}>Last 7 Days</Text>
        {last7Days.some((d) => d.puffs > 0) ? (
          <View style={styles.chart}>
            {last7Days.map((day, i) => (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View style={[styles.bar, {
                    height: `${Math.max(2, (day.puffs / maxPuffs) * 100)}%`,
                    backgroundColor: day.met ? Colors.teal : Colors.coral,
                    borderRadius: 4,
                  }]} />
                </View>
                <Text style={styles.barLabel}>{day.day}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Start logging to see your chart</Text>
          </View>
        )}
      </View>

      {/* Craving Patterns */}
      <View style={[styles.card, Shadows.sm]}>
        <Text style={styles.cardTitle}>Craving Patterns</Text>
        {totalCravings === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="flash-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Log cravings to see patterns</Text>
          </View>
        ) : (
          <>
            {sortedTriggers.slice(0, 4).map(([t, count]) => (
              <View key={t} style={styles.patternRow}>
                <Text style={styles.patternName}>{t}</Text>
                <View style={styles.patternBarBg}>
                  <View style={[styles.patternBarFill, { width: `${(count / totalCravings) * 100}%` }]} />
                </View>
                <Text style={styles.patternCount}>{count}</Text>
              </View>
            ))}
            <View style={styles.resistBadge}>
              <Ionicons name="shield-checkmark" size={16} color={resistRate >= 50 ? Colors.success : Colors.amber} />
              <Text style={[styles.resistText, { color: resistRate >= 50 ? Colors.success : Colors.amber }]}>
                {resistRate}% resist rate
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Health Milestones */}
      <View style={[styles.card, Shadows.sm]}>
        <Text style={styles.cardTitle}>Health Milestones</Text>
        {HEALTH_MILESTONES.map((m, i) => {
          const unlocked = hoursReducing >= m.hours;
          return (
            <View key={i} style={[styles.milestoneRow, { opacity: unlocked ? 1 : 0.35 }]}>
              <View style={[styles.milestoneIcon, { backgroundColor: unlocked ? Colors.successLight : Colors.bgInput }]}>
                <Ionicons name={unlocked ? 'checkmark' : 'ellipse-outline'} size={16} color={unlocked ? Colors.success : Colors.textMuted} />
              </View>
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

function StatCard({ icon, label, value, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; color: string }) {
  return (
    <View style={[statStyles.card, Shadows.sm]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function formatHours(h: number): string {
  if (h === 0) return 'Now';
  if (h < 24) return `${h}h`;
  if (h < 720) return `${Math.round(h / 24)}d`;
  return `${Math.round(h / 720)}mo`;
}

const statStyles = StyleSheet.create({
  card: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.xl, paddingVertical: Spacing.lg, alignItems: 'center', gap: Spacing.xs },
  value: { fontSize: 20, fontWeight: '800' },
  label: { ...Type.caption, fontSize: 11 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 100 },
  statsRow: { flexDirection: 'row', gap: Spacing.md },
  card: { backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.xl },
  cardTitle: { ...Type.label, marginBottom: Spacing.lg },
  emptyState: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.sm },
  emptyText: { ...Type.bodySm },
  chart: { flexDirection: 'row', height: 160, gap: 6, alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center' },
  barTrack: { width: '75%', height: 140, justifyContent: 'flex-end' },
  bar: { width: '100%' },
  barLabel: { ...Type.caption, marginTop: Spacing.xs, fontSize: 11 },
  patternRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  patternName: { ...Type.bodySm, width: 80, color: Colors.text },
  patternBarBg: { flex: 1, height: 8, backgroundColor: Colors.borderLight, borderRadius: 4, marginHorizontal: Spacing.md, overflow: 'hidden' },
  patternBarFill: { height: 8, backgroundColor: Colors.teal, borderRadius: 4 },
  patternCount: { ...Type.label, width: 28, textAlign: 'right', fontSize: 13 },
  resistBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, alignSelf: 'flex-end', marginTop: Spacing.sm },
  resistText: { fontSize: 13, fontWeight: '600' },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.md },
  milestoneIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  milestoneText: { flex: 1 },
  milestoneName: { ...Type.bodyMedium, fontSize: 14 },
  milestoneDesc: { ...Type.caption, marginTop: 1 },
  milestoneTime: { ...Type.caption, fontSize: 11 },
});
