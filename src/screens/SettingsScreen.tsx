import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share, Modal, SafeAreaView, Platform, TextInput } from 'react-native';
import DateTimePicker from '../components/DateTimePickerWrapper';
import { Ionicons } from '@expo/vector-icons';
import NativeSlider from '@react-native-community/slider';
import * as DocumentPicker from 'expo-document-picker';
import { cacheDirectory, writeAsStringAsync, readAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Colors, Spacing, Radius, Shadows, Type } from '../constants/theme';
import { useAppData } from '../hooks/useAppData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveProfile, savePlan, resetAllData } from '../services/storage';
import { buildPlan } from '../services/planGenerator';
import {
  exportAllDataAsJSON,
  importAllData,
  setupICloudSync,
  stopICloudSync,
  pushToICloud,
  getLastSyncedAt,
} from '../services/backup';
import { VapeDeviceType, NotificationPreference, UserProfile } from '../models/types';
import { DEVICE_COST_LABELS, DEVICE_PUFF_LABELS, DEVICE_COST_RANGES, DEVICE_PUFF_RANGES } from '../constants/data';

const DEVICE_OPTIONS: VapeDeviceType[] = ['Disposable', 'Pod System', 'Mod/Tank', 'Other'];
const NOTIF_OPTIONS: NotificationPreference[] = ['Encourage me often', 'Just the essentials', 'Only milestones'];
const DEVICE_ICONS: Record<VapeDeviceType, keyof typeof Ionicons.glyphMap> = {
  'Disposable': 'flame-outline', 'Pod System': 'phone-portrait-outline', 'Mod/Tank': 'build-outline', 'Other': 'help-circle-outline',
};
const NOTIF_ICONS: Record<NotificationPreference, keyof typeof Ionicons.glyphMap> = {
  'Encourage me often': 'notifications', 'Just the essentials': 'notifications-outline', 'Only milestones': 'trophy-outline',
};

type EditField = null | 'deviceType' | 'nicotineLevel' | 'costPerPod' | 'puffsPerPod' | 'targetQuitDate' | 'notification' | 'quietStart' | 'quietEnd';

export default function SettingsScreen({ route }: { route?: { params?: { onReset?: () => void } } }) {
  const { profile, plan, logs, streak, totalPuffsAvoided, costPerPuff, reload } = useAppData();
  const onReset = route?.params?.onReset;
  const [editField, setEditField] = useState<EditField>(null);

  const [deviceType, setDeviceType] = useState<VapeDeviceType>('Pod System');
  const [nicotineLevel, setNicotineLevel] = useState(50);
  const [costPerPod, setCostPerPod] = useState(15);
  const [puffsPerPod, setPuffsPerPod] = useState(200);
  const [notifPref, setNotifPref] = useState<NotificationPreference>('Just the essentials');
  const [quietStart, setQuietStart] = useState(22);
  const [quietEnd, setQuietEnd] = useState(8);
  const [targetQuitDate, setTargetQuitDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return d;
  });
  const [showTargetDatePicker, setShowTargetDatePicker] = useState(false);
  const [targetDateInputText, setTargetDateInputText] = useState('');
  const [iCloudEnabled, setICloudEnabled] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setDeviceType(profile.deviceType);
      setNicotineLevel(profile.startingNicotineLevel);
      setCostPerPod(profile.costPerPod);
      setPuffsPerPod(profile.puffsPerPod);
      setNotifPref(profile.notificationPreference);
      setQuietStart(profile.quietHoursStart);
      setQuietEnd(profile.quietHoursEnd);
      if (profile.targetQuitDate) {
        setTargetQuitDate(new Date(profile.targetQuitDate));
      }
    }
  }, [profile]);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AsyncStorage.getItem('puffless_icloud_enabled').then((v) => setICloudEnabled(v === 'true'));
    getLastSyncedAt().then(setLastSyncedAt);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    if (iCloudEnabled) {
      setupICloudSync(() => { reload(); getLastSyncedAt().then(setLastSyncedAt); });
      return () => { stopICloudSync(); };
    } else {
      stopICloudSync();
    }
  }, [iCloudEnabled, reload]);

  const persistField = async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates };
    await saveProfile(updated);
    reload();
  };

  const persistTargetDate = async (date: Date) => {
    if (!profile) return;
    const targetIso = date.toISOString();
    await saveProfile({ ...profile, targetQuitDate: targetIso });
    if (plan) {
      await savePlan(buildPlan(plan.activeMethods, profile.startingPuffsPerDay, profile.startingNicotineLevel, targetIso, plan.startDate));
    }
    reload();
  };

  const parseTargetDateInput = (text: string): Date | null => {
    const mdy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mdy) {
      const d = new Date(parseInt(mdy[3], 10), parseInt(mdy[1], 10) - 1, parseInt(mdy[2], 10));
      return isNaN(d.getTime()) ? null : d;
    }
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
      const d = new Date(parseInt(iso[1], 10), parseInt(iso[2], 10) - 1, parseInt(iso[3], 10));
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  };

  const handleExport = async () => {
    const rows = ['Date,Puffs,Mood', ...logs.map(l => `${l.date},${l.puffCount},${l.mood || ''}`)];
    await Share.share({ message: rows.join('\n'), title: 'PuffLess Data Export' });
  };

  const handleReset = () => {
    const doReset = async () => {
      await resetAllData();
      onReset?.();
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Reset All Data\n\nThis will delete everything and restart onboarding. This cannot be undone.')) {
        doReset();
      }
    } else {
      Alert.alert('Reset All Data', 'This will delete everything and restart onboarding. This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: doReset },
      ]);
    }
  };

  const handleExportBackup = async () => {
    if (backupBusy) return;
    setBackupBusy(true);
    try {
      const json = await exportAllDataAsJSON();
      const filename = `puffless-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const dir = cacheDirectory;
      if (!dir) throw new Error('Cache directory not available');
      const path = `${dir}${filename}`;
      await writeAsStringAsync(path, json);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Export PuffLess Backup' });
      } else {
        await Share.share({ message: json, title: filename });
      }
    } catch (e) {
      Alert.alert('Export failed', String(e));
    } finally {
      setBackupBusy(false);
    }
  };

  const handleImportBackup = async () => {
    if (backupBusy) return;
    setBackupBusy(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled) { setBackupBusy(false); return; }
      const uri = result.assets[0].uri;
      const json = await readAsStringAsync(uri);
      const outcome = await importAllData(json);
      if (outcome.ok) {
        reload();
        Alert.alert('Restore complete', 'Your data has been restored.');
      } else {
        Alert.alert('Restore failed', outcome.error);
      }
    } catch (e) {
      Alert.alert('Import failed', String(e));
    } finally {
      setBackupBusy(false);
    }
  };

  const handleICloudToggle = async () => {
    const next = !iCloudEnabled;
    setICloudEnabled(next);
    await AsyncStorage.setItem('puffless_icloud_enabled', next ? 'true' : 'false');
    if (next) {
      await pushToICloud();
      setLastSyncedAt(new Date().toISOString());
    }
  };

  const handleSyncNow = async () => {
    if (backupBusy) return;
    setBackupBusy(true);
    try {
      await pushToICloud();
      const at = new Date().toISOString();
      setLastSyncedAt(at);
      reload();
    } finally {
      setBackupBusy(false);
    }
  };

  const startDate = profile ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : '—';
  const totalSaved = (totalPuffsAvoided * costPerPuff).toFixed(2);

  const renderEditModal = () => {
    if (!editField || !profile) return null;

    let title = '';
    let content: React.ReactNode = null;

    switch (editField) {
      case 'deviceType':
        title = 'Device Type';
        content = (
          <View style={st.optionList}>
            {DEVICE_OPTIONS.map(d => (
              <TouchableOpacity
                key={d}
                style={[st.optionRow, deviceType === d && st.optionRowActive]}
                onPress={() => {
                  const cr = DEVICE_COST_RANGES[d];
                  const pr = DEVICE_PUFF_RANGES[d];
                  const newCost = d === 'Disposable' ? cr.default : Math.min(cr.max, Math.max(cr.min, costPerPod));
                  const newPuffs = d === 'Disposable' ? pr.default : Math.min(pr.max, Math.max(pr.min, puffsPerPod));
                  const newNicotine = d === 'Disposable' ? 5 : nicotineLevel;
                  setDeviceType(d);
                  setCostPerPod(newCost);
                  setPuffsPerPod(newPuffs);
                  if (d === 'Disposable') setNicotineLevel(5);
                  persistField({ deviceType: d, costPerPod: newCost, puffsPerPod: newPuffs, startingNicotineLevel: newNicotine });
                  setEditField(null);
                }}
                activeOpacity={0.7}
              >
                <View style={[st.optionIcon, deviceType === d && st.optionIconActive]}>
                  <Ionicons name={DEVICE_ICONS[d]} size={20} color={deviceType === d ? Colors.textInverse : Colors.textMuted} />
                </View>
                <Text style={[st.optionLabel, deviceType === d && { color: Colors.mint }]}>{d}</Text>
                {deviceType === d && <Ionicons name="checkmark-circle" size={22} color={Colors.mint} />}
              </TouchableOpacity>
            ))}
          </View>
        );
        break;

      case 'nicotineLevel':
        title = 'Nicotine Level';
        content = (
          <View style={st.sliderWrap}>
            <Text style={st.sliderValue}>{nicotineLevel}<Text style={st.sliderUnit}> mg</Text></Text>
            <NativeSlider
              style={st.slider}
              minimumValue={0} maximumValue={60} step={5}
              value={nicotineLevel}
              onValueChange={setNicotineLevel}
              minimumTrackTintColor={Colors.mint} maximumTrackTintColor={Colors.border} thumbTintColor={Colors.mint}
            />
            <View style={st.sliderRange}><Text style={st.rangeText}>0mg</Text><Text style={st.rangeText}>60mg</Text></View>
            <TouchableOpacity style={[st.saveBtn, Shadows.glow]} onPress={() => { persistField({ startingNicotineLevel: nicotineLevel }); setEditField(null); }} activeOpacity={0.85}>
              <Text style={st.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        );
        break;

      case 'costPerPod': {
        const cr = DEVICE_COST_RANGES[deviceType];
        const isDisposable = deviceType === 'Disposable';
        title = DEVICE_COST_LABELS[deviceType];
        content = (
          <View style={st.sliderWrap}>
            <Text style={st.sliderValue}>${costPerPod.toFixed(isDisposable ? 0 : 2)}</Text>
            <NativeSlider
              style={st.slider}
              minimumValue={cr.min} maximumValue={cr.max} step={isDisposable ? 1 : 0.5}
              value={costPerPod}
              onValueChange={(v) => setCostPerPod(+(v).toFixed(isDisposable ? 0 : 2))}
              minimumTrackTintColor={Colors.mint} maximumTrackTintColor={Colors.border} thumbTintColor={Colors.mint}
            />
            <View style={st.sliderRange}><Text style={st.rangeText}>${cr.min}</Text><Text style={st.rangeText}>${cr.max}</Text></View>
            <TouchableOpacity style={[st.saveBtn, Shadows.glow]} onPress={() => { persistField({ costPerPod }); setEditField(null); }} activeOpacity={0.85}>
              <Text style={st.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        );
        break;
      }

      case 'puffsPerPod': {
        const pr = DEVICE_PUFF_RANGES[deviceType];
        title = DEVICE_PUFF_LABELS[deviceType];
        content = (
          <View style={st.sliderWrap}>
            <Text style={st.sliderValue}>{puffsPerPod}</Text>
            <NativeSlider
              style={st.slider}
              minimumValue={pr.min} maximumValue={pr.max} step={pr.max > 1000 ? 100 : 10}
              value={puffsPerPod}
              onValueChange={(v) => setPuffsPerPod(Math.round(v))}
              minimumTrackTintColor={Colors.mint} maximumTrackTintColor={Colors.border} thumbTintColor={Colors.mint}
            />
            <View style={st.sliderRange}><Text style={st.rangeText}>{pr.min}</Text><Text style={st.rangeText}>{pr.max}</Text></View>
            <TouchableOpacity style={[st.saveBtn, Shadows.glow]} onPress={() => { persistField({ puffsPerPod }); setEditField(null); }} activeOpacity={0.85}>
              <Text style={st.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        );
        break;
      }

      case 'targetQuitDate': {
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 14);
        title = 'Target Quit Date';
        content = (
          <View style={st.sliderWrap}>
            <TouchableOpacity style={[st.datePickerBtn, st.datePickerBtnInner]} onPress={() => setShowTargetDatePicker(true)} activeOpacity={0.8}>
              <Ionicons name="calendar" size={22} color={Colors.mint} />
              <Text style={st.datePickerValue}>{targetQuitDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
            {showTargetDatePicker && (
              <DateTimePicker
                value={targetQuitDate}
                mode="date"
                minimumDate={minDate}
                maximumDate={new Date(Date.now() + 365 * 86400000)}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, d) => {
                  if (d) {
                    setTargetQuitDate(d);
                    persistTargetDate(d);
                  }
                  if (Platform.OS === 'android') setShowTargetDatePicker(false);
                }}
              />
            )}
            {Platform.OS === 'ios' && showTargetDatePicker && (
              <TouchableOpacity style={st.datePickerDone} onPress={() => { setShowTargetDatePicker(false); setEditField(null); }}>
                <Text style={st.datePickerDoneText}>Done</Text>
              </TouchableOpacity>
            )}
            <Text style={st.dateInputLabel}>Or enter date (MM/DD/YYYY)</Text>
            <View style={st.dateInputRow}>
              <TextInput
                style={st.dateInput}
                value={targetDateInputText}
                onChangeText={setTargetDateInputText}
                placeholder="e.g. 06/15/2025"
                placeholderTextColor={Colors.textDim}
                keyboardType="numbers-and-punctuation"
              />
              <TouchableOpacity
                style={[st.dateInputBtn, Shadows.sm]}
                onPress={async () => {
                  const d = parseTargetDateInput(targetDateInputText.trim());
                  if (d && d > new Date()) {
                    setTargetQuitDate(d);
                    setTargetDateInputText('');
                    await persistTargetDate(d);
                    setEditField(null);
                  }
                }}
                activeOpacity={0.85}
              >
                <Text style={st.dateInputBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[st.saveBtn, Shadows.glow]} onPress={() => setEditField(null)} activeOpacity={0.85}>
              <Text style={st.saveBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        );
        break;
      }

      case 'notification':
        title = 'Notification Preference';
        content = (
          <View style={st.optionList}>
            {NOTIF_OPTIONS.map(n => (
              <TouchableOpacity
                key={n}
                style={[st.optionRow, notifPref === n && st.optionRowActive]}
                onPress={() => { setNotifPref(n); persistField({ notificationPreference: n }); setEditField(null); }}
                activeOpacity={0.7}
              >
                <View style={[st.optionIcon, notifPref === n && st.optionIconActive]}>
                  <Ionicons name={NOTIF_ICONS[n]} size={20} color={notifPref === n ? Colors.textInverse : Colors.textMuted} />
                </View>
                <Text style={[st.optionLabel, notifPref === n && { color: Colors.mint }]}>{n}</Text>
                {notifPref === n && <Ionicons name="checkmark-circle" size={22} color={Colors.mint} />}
              </TouchableOpacity>
            ))}
          </View>
        );
        break;

      case 'quietStart':
        title = 'Quiet Hours Start';
        content = (
          <View style={st.sliderWrap}>
            <Text style={st.sliderValue}>{quietStart}:00</Text>
            <NativeSlider
              style={st.slider}
              minimumValue={0} maximumValue={23} step={1}
              value={quietStart}
              onValueChange={(v) => setQuietStart(Math.round(v))}
              minimumTrackTintColor={Colors.mint} maximumTrackTintColor={Colors.border} thumbTintColor={Colors.mint}
            />
            <View style={st.sliderRange}><Text style={st.rangeText}>12 AM</Text><Text style={st.rangeText}>11 PM</Text></View>
            <TouchableOpacity style={[st.saveBtn, Shadows.glow]} onPress={() => { persistField({ quietHoursStart: quietStart }); setEditField(null); }} activeOpacity={0.85}>
              <Text style={st.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        );
        break;

      case 'quietEnd':
        title = 'Quiet Hours End';
        content = (
          <View style={st.sliderWrap}>
            <Text style={st.sliderValue}>{quietEnd}:00</Text>
            <NativeSlider
              style={st.slider}
              minimumValue={0} maximumValue={23} step={1}
              value={quietEnd}
              onValueChange={(v) => setQuietEnd(Math.round(v))}
              minimumTrackTintColor={Colors.mint} maximumTrackTintColor={Colors.border} thumbTintColor={Colors.mint}
            />
            <View style={st.sliderRange}><Text style={st.rangeText}>12 AM</Text><Text style={st.rangeText}>11 PM</Text></View>
            <TouchableOpacity style={[st.saveBtn, Shadows.glow]} onPress={() => { persistField({ quietHoursEnd: quietEnd }); setEditField(null); }} activeOpacity={0.85}>
              <Text style={st.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        );
        break;
    }

    return (
      <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditField(null)}>
        <SafeAreaView style={st.modalSafe}>
          <View style={st.modalHeader}>
            <TouchableOpacity onPress={() => setEditField(null)}><Ionicons name="close" size={28} color={Colors.textMuted} /></TouchableOpacity>
            <Text style={st.modalTitle}>{title}</Text>
            <View style={{ width: 28 }} />
          </View>
          <View style={st.modalBody}>{content}</View>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      {/* Profile summary */}
      <View style={[st.card, Shadows.md]}>
        <View style={st.profileRow}>
          <View style={st.avatar}><Ionicons name="person" size={28} color={Colors.mint} /></View>
          <View style={{ flex: 1 }}>
            <Text style={st.profileName}>My Journey</Text>
            <Text style={st.profileDate}>Started {startDate}</Text>
          </View>
        </View>
        <View style={st.divider} />
        <View style={st.summaryRow}>
          {[
            { label: 'Streak', value: `${streak}d`, color: Colors.amber },
            { label: 'Avoided', value: `${totalPuffsAvoided}`, color: Colors.mint },
            { label: 'Saved', value: `$${totalSaved}`, color: Colors.sky },
          ].map(s => (
            <View key={s.label} style={st.summaryItem}>
              <Text style={[st.summaryVal, { color: s.color }]}>{s.value}</Text>
              <Text style={st.summaryLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Device info */}
      {profile && (
        <View style={[st.card, Shadows.sm]}>
          <Text style={st.sectionTitle}>Device Info</Text>
          <EditableRow icon="hardware-chip-outline" label="Device type" value={profile.deviceType} onPress={() => setEditField('deviceType')} />
          <EditableRow icon="flask-outline" label="Nicotine level" value={`${profile.startingNicotineLevel}mg`} onPress={() => setEditField('nicotineLevel')} />
          <EditableRow icon="cash-outline" label={DEVICE_COST_LABELS[profile.deviceType]} value={`$${profile.costPerPod?.toFixed(profile.deviceType === 'Disposable' ? 0 : 2) ?? '—'}`} onPress={() => setEditField('costPerPod')} />
          <EditableRow icon="layers-outline" label={DEVICE_PUFF_LABELS[profile.deviceType]} value={`${profile.puffsPerPod}`} onPress={() => setEditField('puffsPerPod')} />
          <EditableRow icon="flag-outline" label="Target quit date" value={profile.targetQuitDate ? new Date(profile.targetQuitDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'} onPress={() => setEditField('targetQuitDate')} />
        </View>
      )}

      {/* Notifications */}
      {profile && (
        <View style={[st.card, Shadows.sm]}>
          <Text style={st.sectionTitle}>Notifications</Text>
          <EditableRow icon="notifications-outline" label="Preference" value={profile.notificationPreference} onPress={() => setEditField('notification')} />
          <EditableRow icon="moon-outline" label="Quiet start" value={`${profile.quietHoursStart}:00`} onPress={() => setEditField('quietStart')} />
          <EditableRow icon="sunny-outline" label="Quiet end" value={`${profile.quietHoursEnd}:00`} onPress={() => setEditField('quietEnd')} />
        </View>
      )}

      {/* Backup & Sync */}
      <View style={[st.card, Shadows.sm]}>
        <Text style={st.sectionTitle}>Backup & Sync</Text>
        {Platform.OS === 'ios' && (
          <>
            <TouchableOpacity style={st.actionRow} onPress={handleICloudToggle} activeOpacity={0.7}>
              <Ionicons name="cloud-outline" size={20} color={Colors.mint} />
              <Text style={st.actionLabel}>iCloud sync</Text>
              <View style={[st.toggle, iCloudEnabled && st.toggleOn]}>
                <View style={[st.toggleKnob, iCloudEnabled && st.toggleKnobOn]} />
              </View>
            </TouchableOpacity>
            {iCloudEnabled && (
              <>
                <TouchableOpacity style={st.actionRow} onPress={handleSyncNow} disabled={backupBusy} activeOpacity={0.7}>
                  <Ionicons name="sync-outline" size={20} color={Colors.mint} />
                  <Text style={st.actionLabel}>Sync now</Text>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textDim} />
                </TouchableOpacity>
                {lastSyncedAt && (
                  <Text style={st.lastSynced}>Last synced: {new Date(lastSyncedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</Text>
                )}
              </>
            )}
          </>
        )}
        <TouchableOpacity style={st.actionRow} onPress={handleExportBackup} disabled={backupBusy} activeOpacity={0.7}>
          <Ionicons name="document-text-outline" size={20} color={Colors.mint} />
          <Text style={st.actionLabel}>Export backup (JSON)</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.textDim} />
        </TouchableOpacity>
        <TouchableOpacity style={st.actionRow} onPress={handleImportBackup} disabled={backupBusy} activeOpacity={0.7}>
          <Ionicons name="document-attach-outline" size={20} color={Colors.mint} />
          <Text style={st.actionLabel}>Import backup</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.textDim} />
        </TouchableOpacity>
      </View>

      {/* Data */}
      <View style={[st.card, Shadows.sm]}>
        <Text style={st.sectionTitle}>Data</Text>
        <TouchableOpacity style={st.actionRow} onPress={handleExport} activeOpacity={0.7}>
          <Ionicons name="download-outline" size={20} color={Colors.mint} />
          <Text style={st.actionLabel}>Export data (CSV)</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.textDim} />
        </TouchableOpacity>
        <TouchableOpacity style={st.actionRow} onPress={handleReset} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={20} color={Colors.danger} />
          <Text style={[st.actionLabel, { color: Colors.danger }]}>Reset all data</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.textDim} />
        </TouchableOpacity>
      </View>

      <Text style={st.footer}>PuffLess v1.0 • Made with care</Text>

      {renderEditModal()}
    </ScrollView>
  );
}

function EditableRow({ icon, label, value, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={st.settingRow} onPress={onPress} activeOpacity={0.6}>
      <Ionicons name={icon} size={18} color={Colors.textMuted} />
      <Text style={st.settingLabel}>{label}</Text>
      <Text style={st.settingVal}>{value}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.textDim} />
    </TouchableOpacity>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 100 },
  card: { backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Spacing.lg },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.mintMuted, justifyContent: 'center', alignItems: 'center' },
  profileName: { ...Type.h3 },
  profileDate: { ...Type.bodySm, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.lg },
  summaryRow: { flexDirection: 'row' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: 20, fontWeight: '800' },
  summaryLabel: { ...Type.caption, marginTop: 4 },
  sectionTitle: { ...Type.label, marginBottom: Spacing.md },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  settingLabel: { ...Type.body, flex: 1, color: Colors.textSecondary },
  settingVal: { ...Type.bodyMedium, color: Colors.text, marginRight: Spacing.xs },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  actionLabel: { ...Type.bodyMedium, flex: 1 },
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: Colors.bgElevated, justifyContent: 'flex-start', paddingHorizontal: 2, flexDirection: 'row', alignItems: 'center' },
  toggleOn: { backgroundColor: Colors.mint, justifyContent: 'flex-end' },
  toggleKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.textMuted },
  toggleKnobOn: { backgroundColor: Colors.white },
  lastSynced: { ...Type.caption, marginTop: -Spacing.sm, marginBottom: Spacing.sm, marginLeft: 28 },
  footer: { ...Type.caption, textAlign: 'center', paddingVertical: Spacing.xl },

  // Modal
  modalSafe: { flex: 1, backgroundColor: Colors.bg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  modalTitle: { ...Type.h3 },
  modalBody: { padding: Spacing['2xl'] },

  // Option picker
  optionList: { gap: Spacing.sm },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border },
  optionRowActive: { borderColor: Colors.mint, backgroundColor: Colors.mintSubtle },
  optionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center' },
  optionIconActive: { backgroundColor: Colors.mint },
  optionLabel: { ...Type.bodyMedium, flex: 1 },

  // Slider editor
  sliderWrap: { alignItems: 'center', paddingTop: Spacing['2xl'] },
  sliderValue: { fontSize: 48, fontWeight: '800', color: Colors.mint, letterSpacing: -1 },
  sliderUnit: { fontSize: 24, fontWeight: '600', color: Colors.textSecondary },
  slider: { width: '100%', height: 40, marginTop: Spacing['2xl'] },
  sliderRange: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: Spacing.xs },
  rangeText: { ...Type.caption },
  saveBtn: { backgroundColor: Colors.mint, paddingVertical: 16, paddingHorizontal: Spacing['3xl'], borderRadius: Radius.xl, marginTop: Spacing['3xl'], width: '100%', alignItems: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: Colors.textInverse },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  datePickerBtnInner: { width: '100%', paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, backgroundColor: Colors.bgElevated, borderRadius: Radius.lg, marginBottom: Spacing.lg },
  datePickerValue: { ...Type.bodyMedium, fontWeight: '700', flex: 1 },
  datePickerDone: { marginTop: Spacing.sm, paddingVertical: Spacing.sm },
  datePickerDoneText: { ...Type.bodyMedium, color: Colors.mint, fontWeight: '600' },
  dateInputLabel: { ...Type.caption, color: Colors.textMuted, marginBottom: Spacing.sm },
  dateInputRow: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
  dateInput: { flex: 1, backgroundColor: Colors.bgElevated, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, ...Type.bodyMedium },
  dateInputBtn: { backgroundColor: Colors.mint, paddingHorizontal: Spacing.lg, borderRadius: Radius.lg, justifyContent: 'center' },
  dateInputBtnText: { ...Type.bodyMedium, fontWeight: '700', color: Colors.textInverse },
});
