import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, DailyLog, Craving, NRTEntry, QuitPlan } from '../models/types';
import { getLocalDateString } from '../utils/date';

const KEYS = {
  PROFILE: 'puffless_profile',
  PLAN: 'puffless_plan',
  DAILY_LOGS: 'puffless_daily_logs',
  CRAVINGS: 'puffless_cravings',
  NRT_ENTRIES: 'puffless_nrt_entries',
  ONBOARDED: 'puffless_onboarded',
};

async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

async function setJSON(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// Profile
export async function getProfile(): Promise<UserProfile | null> {
  return getJSON<UserProfile>(KEYS.PROFILE);
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await setJSON(KEYS.PROFILE, profile);
}

// Plan
export async function getPlan(): Promise<QuitPlan | null> {
  return getJSON<QuitPlan>(KEYS.PLAN);
}

export async function savePlan(plan: QuitPlan): Promise<void> {
  await setJSON(KEYS.PLAN, plan);
}

// Daily Logs
export async function getDailyLogs(): Promise<DailyLog[]> {
  return (await getJSON<DailyLog[]>(KEYS.DAILY_LOGS)) ?? [];
}

export async function saveDailyLogs(logs: DailyLog[]): Promise<void> {
  await setJSON(KEYS.DAILY_LOGS, logs);
}

export type UpsertTodayLogUpdate = Partial<DailyLog> & (
  | { puffCount: number; setAbsolute?: false }
  | { puffCount: number; setAbsolute: true }
);

export async function upsertTodayLog(update: UpsertTodayLogUpdate): Promise<DailyLog> {
  const logs = await getDailyLogs();
  const today = getLocalDateString();
  const existingIndex = logs.findIndex((l) => l.date === today);

  if (existingIndex >= 0) {
    const existing = logs[existingIndex];
    if (update.setAbsolute) {
      existing.puffCount = Math.max(0, Math.round(update.puffCount));
    } else {
      existing.puffCount = Math.max(0, existing.puffCount + update.puffCount);
    }
    if (update.dailyGoal !== undefined) existing.dailyGoal = update.dailyGoal;
    if (update.mood !== undefined) existing.mood = update.mood;
    if (update.notes) existing.notes = update.notes;
    if (update.nicotineStrength !== undefined) existing.nicotineStrength = update.nicotineStrength;
    existing.goalMet = existing.puffCount <= existing.dailyGoal;
    logs[existingIndex] = existing;
    await saveDailyLogs(logs);
    return existing;
  }

  const count = update.setAbsolute ? Math.max(0, Math.round(update.puffCount)) : update.puffCount;
  const newLog: DailyLog = {
    date: today,
    puffCount: Math.max(0, count),
    nicotineStrength: update.nicotineStrength ?? 0,
    dailyGoal: update.dailyGoal ?? 0,
    goalMet: Math.max(0, count) <= (update.dailyGoal ?? 0),
    mood: update.mood ?? 3,
    notes: update.notes ?? '',
  };
  logs.push(newLog);
  await saveDailyLogs(logs);
  return newLog;
}

// Cravings
export async function getCravings(): Promise<Craving[]> {
  return (await getJSON<Craving[]>(KEYS.CRAVINGS)) ?? [];
}

export async function addCraving(craving: Craving): Promise<void> {
  const cravings = await getCravings();
  cravings.push(craving);
  await setJSON(KEYS.CRAVINGS, cravings);
}

// NRT Entries
export async function getNRTEntries(): Promise<NRTEntry[]> {
  return (await getJSON<NRTEntry[]>(KEYS.NRT_ENTRIES)) ?? [];
}

export async function addNRTEntry(entry: NRTEntry): Promise<void> {
  const entries = await getNRTEntries();
  entries.push(entry);
  await setJSON(KEYS.NRT_ENTRIES, entries);
}

// Onboarding
export async function isOnboarded(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.ONBOARDED);
  return val === 'true';
}

export async function setOnboarded(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDED, 'true');
}

// Reset
export async function resetAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}

// Backup / restore: full state for export/import
export const STORAGE_KEYS = { ...KEYS };

export async function getAllData(): Promise<Record<string, string>> {
  const keys = Object.values(KEYS);
  const pairs = await AsyncStorage.multiGet(keys);
  const out: Record<string, string> = {};
  for (const [k, v] of pairs) {
    if (v != null) out[k] = v;
  }
  return out;
}

export async function restoreAllData(data: Record<string, string>): Promise<void> {
  const entries = Object.entries(data).filter(([, v]) => v != null) as [string, string][];
  if (entries.length === 0) return;
  await AsyncStorage.multiSet(entries);
}
