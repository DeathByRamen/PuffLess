import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { Colors, Spacing, Radius } from '../constants/theme';
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
    try {
      await Share.share({ message: csv, title: 'PuffLess Data Export' });
    } catch {
      // user cancelled
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset All Data?',
      'This will permanently delete all your logs, cravings, and plan. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            await resetAllData();
            reload();
            setResetting(false);
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Profile</Text>
        {profile ? (
          <>
            <SettingRow label="Device" value={profile.deviceType} />
            <SettingRow label="Starting Puffs/Day" value={`${profile.startingPuffsPerDay}`} />
            <SettingRow label="Starting Nicotine" value={`${profile.startingNicotineLevel}mg`} />
            <SettingRow label="Started" value={new Date(profile.createdAt).toLocaleDateString()} />
            {plan && (
              <SettingRow label="Target Date" value={new Date(plan.targetEndDate).toLocaleDateString()} />
            )}
            <SettingRow label="Methods" value={profile.selectedMethods.join(', ')} />
          </>
        ) : (
          <Text style={styles.emptyText}>No profile found</Text>
        )}
      </View>

      {/* Notifications */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        {profile && (
          <>
            <SettingRow label="Frequency" value={profile.notificationPreference} />
            <SettingRow label="Quiet Hours" value={`${profile.quietHoursStart}:00 – ${profile.quietHoursEnd}:00`} />
          </>
        )}
      </View>

      {/* Data */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Data</Text>
        <SettingRow label="Days Logged" value={`${logs.length}`} />
        <SettingRow label="Cravings Logged" value={`${cravings.length}`} />

        <TouchableOpacity style={styles.actionButton} onPress={handleExport}>
          <Text style={styles.actionButtonText}>Export Data (CSV)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerButton} onPress={handleReset} disabled={resetting}>
          <Text style={styles.dangerButtonText}>{resetting ? 'Resetting...' : 'Reset All Data'}</Text>
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>About</Text>
        <SettingRow label="Version" value="1.0.0" />
        <SettingRow label="Built with" value="React Native / Expo" />
      </View>
    </ScrollView>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 100 },
  card: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  settingLabel: { fontSize: 14, color: Colors.text },
  settingValue: { fontSize: 14, color: Colors.textSecondary, maxWidth: '60%', textAlign: 'right' },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
  actionButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.teal,
    alignItems: 'center',
  },
  actionButtonText: { fontSize: 15, fontWeight: '600', color: Colors.teal },
  dangerButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.red,
    alignItems: 'center',
  },
  dangerButtonText: { fontSize: 15, fontWeight: '600', color: Colors.red },
});
