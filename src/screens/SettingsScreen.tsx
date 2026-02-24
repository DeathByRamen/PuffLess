import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadows, Type } from '../constants/theme';
import { useAppData } from '../hooks/useAppData';
import { resetAllData } from '../services/storage';

export default function SettingsScreen() {
  const { profile, plan, logs, cravings, reload } = useAppData();
  const [resetting, setResetting] = useState(false);

  const handleExport = async () => {
    let csv = 'Date,Puffs,Goal,Goal Met,Mood,Nicotine (mg)\n';
    for (const log of [...logs].sort((a, b) => a.date.localeCompare(b.date))) {
      csv += `${log.date},${log.puffCount},${log.dailyGoal},${log.goalMet},${log.mood},${log.nicotineStrength}\n`;
    }
    try { await Share.share({ message: csv, title: 'PuffLess Data' }); } catch {}
  };

  const handleReset = () => {
    Alert.alert('Reset All Data?', 'This will permanently delete all your logs, cravings, and plan. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: async () => { setResetting(true); await resetAllData(); reload(); setResetting(false); } },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Profile */}
      <View style={[styles.card, Shadows.sm]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-circle-outline" size={22} color={Colors.teal} />
          <Text style={styles.sectionTitle}>Profile</Text>
        </View>
        {profile ? (
          <>
            <Row icon="hardware-chip-outline" label="Device" value={profile.deviceType} />
            <Row icon="analytics-outline" label="Starting Puffs/Day" value={`${profile.startingPuffsPerDay}`} />
            <Row icon="flask-outline" label="Starting Nicotine" value={`${profile.startingNicotineLevel}mg`} />
            <Row icon="calendar-outline" label="Started" value={new Date(profile.createdAt).toLocaleDateString()} />
            {plan && <Row icon="flag-outline" label="Target Date" value={new Date(plan.targetEndDate).toLocaleDateString()} />}
            <Row icon="layers-outline" label="Methods" value={profile.selectedMethods.join(', ')} />
          </>
        ) : (
          <Text style={styles.emptyText}>No profile found</Text>
        )}
      </View>

      {/* Notifications */}
      <View style={[styles.card, Shadows.sm]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="notifications-outline" size={22} color={Colors.teal} />
          <Text style={styles.sectionTitle}>Notifications</Text>
        </View>
        {profile && (
          <>
            <Row icon="pulse-outline" label="Frequency" value={profile.notificationPreference} />
            <Row icon="moon-outline" label="Quiet Hours" value={`${profile.quietHoursStart}:00 – ${profile.quietHoursEnd}:00`} />
          </>
        )}
      </View>

      {/* Data */}
      <View style={[styles.card, Shadows.sm]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="server-outline" size={22} color={Colors.teal} />
          <Text style={styles.sectionTitle}>Data</Text>
        </View>
        <Row icon="calendar-outline" label="Days Logged" value={`${logs.length}`} />
        <Row icon="flash-outline" label="Cravings Logged" value={`${cravings.length}`} />

        <TouchableOpacity style={styles.actionBtn} onPress={handleExport} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={18} color={Colors.teal} />
          <Text style={styles.actionBtnText}>Export Data (CSV)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerBtn} onPress={handleReset} disabled={resetting} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          <Text style={styles.dangerBtnText}>{resetting ? 'Resetting...' : 'Reset All Data'}</Text>
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={[styles.card, Shadows.sm]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="information-circle-outline" size={22} color={Colors.teal} />
          <Text style={styles.sectionTitle}>About</Text>
        </View>
        <Row icon="code-slash-outline" label="Version" value="1.0.0" />
        <Row icon="logo-react" label="Built with" value="React Native / Expo" />
      </View>
    </ScrollView>
  );
}

function Row({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={18} color={Colors.textMuted} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 100 },
  card: { backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  sectionTitle: { ...Type.label, fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rowLabel: { ...Type.bodyMedium, fontSize: 14 },
  rowValue: { ...Type.bodySm, maxWidth: '55%', textAlign: 'right' },
  emptyText: { ...Type.bodySm },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    marginTop: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.teal,
  },
  actionBtnText: { ...Type.label, color: Colors.teal },
  dangerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    marginTop: Spacing.md, paddingVertical: Spacing.md,
    borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.danger,
  },
  dangerBtnText: { ...Type.label, color: Colors.danger },
});
