import { NativeEventEmitter, Platform } from 'react-native';
import * as Storage from './storage';

const BACKUP_VERSION = 1;

export interface BackupPayload {
  version: number;
  exportedAt: string;
  app: string;
  data: Record<string, string>;
}

export async function exportAllData(): Promise<BackupPayload> {
  const data = await Storage.getAllData();
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'PuffLess',
    data,
  };
}

export function exportAllDataAsJSON(): Promise<string> {
  return exportAllData().then((payload) => JSON.stringify(payload, null, 2));
}

function isBackupPayload(obj: unknown): obj is BackupPayload {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'version' in obj &&
    typeof (obj as BackupPayload).version === 'number' &&
    'data' in obj &&
    typeof (obj as BackupPayload).data === 'object' &&
    (obj as BackupPayload).data !== null
  );
}

export async function importAllData(json: string): Promise<{ ok: true } | { ok: false; error: string }> {
  let payload: unknown;
  try {
    payload = JSON.parse(json);
  } catch {
    return { ok: false, error: 'Invalid JSON' };
  }
  if (!isBackupPayload(payload)) {
    return { ok: false, error: 'Invalid backup format' };
  }
  if (payload.version > BACKUP_VERSION) {
    return { ok: false, error: 'Backup was created by a newer app version' };
  }
  await Storage.restoreAllData(payload.data);
  return { ok: true };
}

let iCloudSyncSubscription: { remove: () => void } | null = null;

async function pullFromICloudAndRestore(onSync?: () => void): Promise<void> {
  try {
    const ICloudKVS = require('react-native-icloud-key-value-store').default;
    const keys = await ICloudKVS.getAllKeys();
    if (!keys || keys.length === 0) return;
    const values = await ICloudKVS.multiGet(keys);
    const data: Record<string, string> = {};
    keys.forEach((k: string, i: number) => {
      const v = values?.[i];
      if (v != null && typeof v === 'string') data[k] = v;
    });
    if (Object.keys(data).length > 0) await Storage.restoreAllData(data);
    onSync?.();
  } catch {
    // no-op
  }
}

export function setupICloudSync(onSync?: () => void): void {
  if (Platform.OS !== 'ios') return;

  try {
    const ICloudKVS = require('react-native-icloud-key-value-store').default;
    pullFromICloudAndRestore(onSync);

    const emitter = new NativeEventEmitter(ICloudKVS);
    iCloudSyncSubscription = emitter.addListener('iCloudStoreDidChangeRemotely', () => {
      pullFromICloudAndRestore(onSync);
    });
  } catch {
    // Module not installed or not linked; no-op
  }
}

export function stopICloudSync(): void {
  if (iCloudSyncSubscription) {
    iCloudSyncSubscription.remove();
    iCloudSyncSubscription = null;
  }
}

export async function pushToICloud(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    const ICloudKVS = require('react-native-icloud-key-value-store').default;
    const data = await Storage.getAllData();
    if (Object.keys(data).length === 0) return;
    await ICloudKVS.multiSet(data);
    await setLastSyncedAt(new Date().toISOString());
  } catch {
    // no-op
  }
}

export async function getLastSyncedAt(): Promise<string | null> {
  if (Platform.OS !== 'ios') return null;
  try {
    const ICloudKVS = require('react-native-icloud-key-value-store').default;
    const raw = await ICloudKVS.getItem('puffless_last_synced');
    return typeof raw === 'string' ? raw : null;
  } catch {
    return null;
  }
}

export async function setLastSyncedAt(iso: string): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    const ICloudKVS = require('react-native-icloud-key-value-store').default;
    await ICloudKVS.setItem('puffless_last_synced', iso);
  } catch {
    // no-op
  }
}
