import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadows, Type } from '../constants/theme';
import { useAppData } from '../hooks/useAppData';
import { moneySaved, getPlanProgress, getGoalForDate } from '../services/planGenerator';
import { projectQuitDate } from '../services/usageProjection';
import { getLocalDateString } from '../utils/date';

const HEALTH_MILESTONES = [
  { hours: 1, title: 'Heart rate normalises', icon: 'heart' as const, color: Colors.coral },
  { hours: 12, title: 'Blood oxygen improves', icon: 'water' as const, color: Colors.sky },
  { hours: 48, title: 'Taste & smell sharpen', icon: 'restaurant' as const, color: Colors.amber },
  { hours: 72, title: 'Nicotine leaves body', icon: 'leaf' as const, color: Colors.mint },
  { hours: 720, title: 'Lungs begin healing', icon: 'fitness' as const, color: Colors.violet },
];

export default function ProgressScreen() {
  const { logs, cravings, plan, profile, streak, totalPuffsAvoided, costPerPuff } = useAppData();
  const progress = plan ? getPlanProgress(plan) : 0;
  const saved = moneySaved(totalPuffsAvoided, costPerPuff);
  const projection = plan && profile ? projectQuitDate(logs, plan.targetEndDate) : null;

  const weekData = logs.slice(-7);
  const weekDataWithGoals = plan
    ? weekData.map((log) => ({ ...log, goal: getGoalForDate(plan, log.date) }))
    : weekData.map((log) => ({ ...log, goal: 0 }));
  const maxVal = Math.max(
    ...weekDataWithGoals.map((l) => Math.max(l.puffCount, l.goal)),
    1
  );
  const allLogsWithGoals = plan ? logs.map((log) => ({ ...log, goal: getGoalForDate(plan, log.date) })) : [];
  const cumulativePuffsUnder = allLogsWithGoals.reduce((sum, l) => sum + Math.max(0, l.goal - l.puffCount), 0);

  const triggerCounts: Record<string, number> = {};
  cravings.forEach(c => { triggerCounts[c.trigger] = (triggerCounts[c.trigger] || 0) + 1; });
  const topTriggers = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxTrigger = topTriggers.length > 0 ? topTriggers[0][1] : 1;

  const hoursSinceStart = profile ? (Date.now() - new Date(profile.createdAt).getTime()) / 3600000 : 0;
  const resistRate = cravings.length > 0 ? Math.round((cravings.filter(c => c.action !== 'Vaped').length / cravings.length) * 100) : 0;

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      {/* Top stats - 2x2 grid for better readability */}
      <View style={st.statsGrid}>
        <View style={[st.statCard, Shadows.sm]}>
          <View style={[st.statIconWrap, { backgroundColor: Colors.amber + '22' }]}>
            <Ionicons name="flame" size={20} color={Colors.amber} />
          </View>
          <Text style={[st.statValue, { color: Colors.amber }]}>{streak}d</Text>
          <Text style={st.statLabel}>Streak</Text>
        </View>
        <View style={[st.statCard, Shadows.sm]}>
          <View style={[st.statIconWrap, { backgroundColor: Colors.mintMuted }]}>
            <Ionicons name="trending-down" size={20} color={Colors.mint} />
          </View>
          <Text style={[st.statValue, { color: Colors.mint }]}>{Math.round(progress * 100)}%</Text>
          <Text style={st.statLabel}>Plan Progress</Text>
        </View>
        <View style={[st.statCard, Shadows.sm]}>
          <View style={[st.statIconWrap, { backgroundColor: Colors.sky + '22' }]}>
            <Ionicons name="wallet" size={20} color={Colors.sky} />
          </View>
          <Text style={[st.statValue, { color: Colors.sky }]}>${saved.toFixed(0)}</Text>
          <Text style={st.statLabel}>Money Saved</Text>
        </View>
        <View style={[st.statCard, Shadows.sm]}>
          <View style={[st.statIconWrap, { backgroundColor: Colors.violet + '22' }]}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.violet} />
          </View>
          <Text style={[st.statValue, { color: Colors.violet }]}>{resistRate}%</Text>
          <Text style={st.statLabel}>Resist Rate</Text>
        </View>
      </View>

      {/* Weekly chart - puffs vs step-down target */}
      <View style={[st.card, Shadows.sm]}>
        <Text style={st.cardTitle}>Last 7 Days vs Target</Text>
        {weekDataWithGoals.length > 0 ? (
          <View style={st.chartRow}>
            {weekDataWithGoals.map((log, i) => {
              const h = Math.max(4, (log.puffCount / maxVal) * 100);
              const dayLabel = new Date(log.date).toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2);
              const isToday = log.date === getLocalDateString();
              const overGoal = log.goal > 0 && log.puffCount > log.goal;
              const barColor = overGoal ? Colors.danger : Colors.mint;
              return (
                <View key={i} style={st.barCol}>
                  <Text style={[st.barValue, isToday && { fontWeight: '700' }, { color: barColor }]}>
                    {log.puffCount}{log.goal > 0 ? `/${log.goal}` : ''}
                  </Text>
                  <View style={st.barTrack}>
                    <View style={[st.barFill, { height: `${h}%`, backgroundColor: barColor }]} />
                  </View>
                  <Text style={[st.barLabel, isToday && { color: barColor, fontWeight: '600' }]}>{dayLabel}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={st.emptyChart}>
            <Ionicons name="bar-chart-outline" size={40} color={Colors.textDim} />
            <Text style={st.emptyTitle}>No data yet</Text>
            <Text style={st.emptySub}>Log your first puffs to see your trend</Text>
          </View>
        )}
      </View>

      {/* Adjusted Target Quit Date */}
      {projection && (
        <View style={[st.card, Shadows.sm]}>
          <Text style={st.cardTitle}>Adjusted Target Quit Date Based on Usage</Text>
          <View style={st.projectionRow}>
            <View style={[st.projectionIconWrap, { backgroundColor: Colors.mint + '22' }]}>
              <Ionicons name="calendar" size={22} color={Colors.mint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.projectionDate}>
                {new Date(projection.projectedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
              <Text style={[
                st.projectionSub,
                projection.daysSoonerOrLater > 0 && { color: Colors.mint },
                projection.daysSoonerOrLater < 0 && { color: Colors.coral },
              ]}>
                {projection.daysSoonerOrLater > 0
                  ? `${projection.daysSoonerOrLater} days sooner than planned`
                  : projection.daysSoonerOrLater < 0
                    ? `${Math.abs(projection.daysSoonerOrLater)} days later than planned`
                    : 'On track with your plan'}
              </Text>
              <Text style={st.projectionMeta}>Based on last {projection.windowDays} days (linear trend)</Text>
            </View>
          </View>
        </View>
      )}

      {/* Triggers */}
      {topTriggers.length > 0 && (
        <View style={[st.card, Shadows.sm]}>
          <Text style={st.cardTitle}>Top Triggers</Text>
          {topTriggers.map(([trigger, count], i) => (
            <View key={trigger}>
              {i > 0 && <View style={st.divider} />}
              <View style={st.triggerRow}>
                <Text style={st.triggerLabel}>{trigger}</Text>
                <View style={st.triggerBar}>
                  <View style={[st.triggerFill, { width: `${(count / maxTrigger) * 100}%` }]} />
                </View>
                <Text style={st.triggerCount}>{count}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Health milestones */}
      <View style={[st.card, Shadows.sm]}>
        <View style={st.healthHeader}>
          <Text style={st.cardTitle}>Health Recovery</Text>
          {plan && (
            <View style={st.cumulativePill}>
              <Ionicons name="trending-down" size={14} color={Colors.mint} />
              <Text style={st.cumulativeText}>{cumulativePuffsUnder} puffs under target (all time)</Text>
            </View>
          )}
        </View>
        {HEALTH_MILESTONES.map((m, i) => {
          const unlocked = hoursSinceStart >= m.hours;
          const proximityPct = unlocked ? 100 : Math.min(100, (hoursSinceStart / m.hours) * 100);
          return (
            <View key={i}>
              {i > 0 && <View style={st.divider} />}
              <View style={st.milestone}>
                <View style={[st.milestoneIcon, { backgroundColor: unlocked ? m.color + '22' : Colors.bgElevated }]}>
                  <Ionicons name={m.icon} size={18} color={unlocked ? m.color : Colors.textDim} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[st.milestoneTitle, !unlocked && { color: Colors.textDim }]}>{m.title}</Text>
                  <Text style={st.milestoneTime}>{m.hours < 24 ? `${m.hours}h` : `${Math.round(m.hours / 24)}d`} after quitting</Text>
                  {!unlocked && (
                    <View style={st.proximityTrack}>
                      <View style={[st.proximityFill, { width: `${proximityPct}%`, backgroundColor: m.color }]} />
                    </View>
                  )}
                </View>
                {unlocked && <Ionicons name="checkmark-circle" size={22} color={m.color} />}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 100 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  statCard: { width: '47%', flexGrow: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.xl, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.md, gap: Spacing.xs },
  statIconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', marginTop: Spacing.xs },
  statLabel: { ...Type.caption, fontSize: 11 },
  card: { backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.lg },
  cardTitle: { ...Type.label, marginBottom: Spacing.lg },
  healthHeader: { marginBottom: Spacing.lg },
  cumulativePill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.xs },
  cumulativeText: { ...Type.caption, color: Colors.mint, fontWeight: '600' },
  chartRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 140 },
  barCol: { alignItems: 'center', flex: 1 },
  barValue: { ...Type.caption, color: Colors.textMuted, fontSize: 10, marginBottom: 4 },
  barTrack: { width: 18, height: 100, backgroundColor: Colors.bgElevated, borderRadius: 9, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: 18, borderRadius: 9 },
  barLabel: { ...Type.caption, marginTop: 6 },
  emptyChart: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.sm },
  emptyTitle: { ...Type.bodyMedium, color: Colors.textMuted },
  emptySub: { ...Type.caption },
  projectionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  projectionIconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  projectionDate: { ...Type.bodyMedium, fontWeight: '700', fontSize: 16 },
  projectionSub: { ...Type.caption, color: Colors.mint, marginTop: 2 },
  projectionMeta: { ...Type.caption, color: Colors.textMuted, marginTop: 4 },
  divider: { height: 1, backgroundColor: Colors.divider },
  triggerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  triggerLabel: { ...Type.bodySm, width: 80 },
  triggerBar: { flex: 1, height: 8, backgroundColor: Colors.bgElevated, borderRadius: 4, overflow: 'hidden' },
  triggerFill: { height: 8, backgroundColor: Colors.mint, borderRadius: 4 },
  triggerCount: { ...Type.caption, width: 24, textAlign: 'right', color: Colors.mint, fontWeight: '700' },
  milestone: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  milestoneIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  milestoneTitle: { ...Type.bodyMedium },
  milestoneTime: { ...Type.caption },
  proximityTrack: { height: 3, backgroundColor: Colors.bgElevated, borderRadius: 2, overflow: 'hidden', marginTop: 6, width: '60%' },
  proximityFill: { height: 3, borderRadius: 2 },
});
