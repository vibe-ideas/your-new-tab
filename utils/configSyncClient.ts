import { getStorage, sendMessage } from './browser';
import { readActiveBookmarkGroup } from './bookmarkGroups';
import { i18n } from './i18n';
import { captureConfig, configWrites, same, validatePatch, SYNC_SECTIONS, SYNC_STATE_KEY, SYNC_BACKUP_KEY, type SyncPatch, type SyncSnapshot, type SyncState } from './configSyncModel';

export const CONFIG_APPLIED_EVENT = 'config-sync-applied';
export const SYNC_STATUS_EVENT = 'config-sync-status';
const MIRROR_KEY = 'configSync.mirror.v1';
const OUTBOX_KEY = 'configSync.outbox.v1';
let status: Pick<SyncState, 'status' | 'bytes' | 'error' | 'lastCheckedAt' | 'lastWrittenAt' | 'lastReceivedAt'> = { status: 'pending', bytes: 0 };
let initialized: Promise<void> | undefined;
let busy = 0;
let queue: Promise<unknown> = Promise.resolve();
export const getSyncStatus = () => status;
const setStatus = (next: typeof status) => { status = next; window.dispatchEvent(new Event(SYNC_STATUS_EVENT)); };
const outbox = (): SyncPatch => validatePatch(JSON.parse(localStorage.getItem(OUTBOX_KEY) || '{}'));
const sameStored = (key: string, a: string | null | undefined, b: string | null | undefined) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (['searchProviders', 'bookmarkGroupLabels', 'anniversaryItems'].includes(key) || key.endsWith('.bookmarksJson')) {
    try { return same(JSON.parse(a), JSON.parse(b)); } catch { return false; }
  }
  return false;
};

function apply(state: SyncState) {
  setStatus({ status: state.status, bytes: state.bytes, error: state.error, lastCheckedAt: state.lastCheckedAt, lastWrittenAt: state.lastWrittenAt, lastReceivedAt: state.lastReceivedAt });
  if (!state.initialized) return;
  const serialized = JSON.stringify(state.values);
  const previousMirror = JSON.parse(localStorage.getItem(MIRROR_KEY) || 'null') as SyncSnapshot | null;
  if (same(state.values, previousMirror)) return;
  const writes = configWrites(state.values);
  // Preserve device-specific provider selection unless the default changes.
  if (writes.defaultSearchProvider !== localStorage.getItem('defaultSearchProvider')) writes.lastSearchProvider = writes.defaultSearchProvider;
  if (writes.customBackgroundMediaUrls !== localStorage.getItem('customBackgroundMediaUrls')) writes.customBackgroundMediaIndex = null;
  // Apply only sections that changed since the last mirror. Unrelated local keys
  // can still be read/repaired by their existing owners.
  const previousWrites = previousMirror ? configWrites(previousMirror) : {};
  const changed = Object.entries(writes).filter(([key, value]) => (!previousMirror || !sameStored(key, previousWrites[key], value)) && !sameStored(key, localStorage.getItem(key), value));
  const backup = changed.map(([key]) => [key, localStorage.getItem(key)] as const);
  try {
    for (const [key, value] of changed) { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); }
    localStorage.setItem(MIRROR_KEY, serialized);
  } catch (error) {
    for (const [key, value] of backup) { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { /* retain original error */ } }
    throw error;
  }
  const language = localStorage.getItem('language');
  if (language === 'en' || language === 'zh-CN') i18n.setLanguage(language);
  changed.forEach(([key, newValue], index) => window.dispatchEvent(new StorageEvent('storage', { key, oldValue: backup[index][1], newValue })));
  window.dispatchEvent(new Event(CONFIG_APPLIED_EVENT));
}

async function refresh() {
  if (busy) return;
  try {
    const state = (await getStorage().local.get(SYNC_STATE_KEY))[SYNC_STATE_KEY] as SyncState | undefined;
    if (!busy && state) {
      if (Object.keys(outbox()).length) setStatus({ ...status, bytes: state.bytes, status: status.status === 'error' ? 'error' : 'pending' });
      else apply(state);
    }
  } catch (error) { setStatus({ ...status, status: 'error', error: String(error) }); }
}

async function request(action: string, values?: SyncPatch) {
  const response = await sendMessage({ action, values });
  if (!response?.success) throw new Error(response?.error || 'Configuration sync unavailable');
}

async function drainOutbox() {
  const pending = outbox();
  if (!Object.keys(pending).length) return;
  await request('configSync:save', pending);
  const remaining = outbox();
  for (const section of SYNC_SECTIONS) if (section in pending && same(pending[section], remaining[section])) delete remaining[section];
  if (Object.keys(remaining).length) localStorage.setItem(OUTBOX_KEY, JSON.stringify(remaining));
  else localStorage.removeItem(OUTBOX_KEY);
}

function serial(operation: () => Promise<void>) {
  busy++;
  const next = queue.then(operation, operation).catch((error) => { setStatus({ ...status, status: 'error', error: String(error) }); })
    .finally(async () => { busy--; if (!busy) await refresh(); });
  queue = next;
  return next;
}

export function initializeConfigSync(): Promise<void> {
  if (initialized) return initialized;
  initialized = serial(async () => {
    readActiveBookmarkGroup(); // Migrate legacy bookmark keys before taking a snapshot.
    const storage = getStorage();
    storage.onChanged.addListener((changes, area) => { if (area === 'local' && changes[SYNC_STATE_KEY]) void refresh(); });
    window.addEventListener('online', () => { void retryConfigSync(); });
    // Another extension page applies the mirror synchronously; refresh its readers.
    window.addEventListener('storage', (event) => {
      if (event.key !== MIRROR_KEY) return;
      const language = localStorage.getItem('language');
      if (language === 'en' || language === 'zh-CN') i18n.setLanguage(language);
      window.dispatchEvent(new Event(CONFIG_APPLIED_EVENT));
    });
    await request('configSync:init', captureConfig(localStorage));
    await drainOutbox();
  });
  return initialized;
}

export function publishConfigChanges(before: SyncSnapshot, after = captureConfig(localStorage)) {
  const patch: SyncPatch = {};
  for (const section of SYNC_SECTIONS) if (!same(before[section], after[section])) patch[section] = after[section];
  if (!Object.keys(patch).length) return;
  // Written before messaging, so closing the settings tab cannot lose an upload.
  try { localStorage.setItem(OUTBOX_KEY, JSON.stringify({ ...outbox(), ...patch })); }
  catch (error) { setStatus({ ...status, status: 'error', error: String(error) }); return; }
  setStatus({ ...status, status: 'pending', error: undefined });
  void serial(drainOutbox);
}

export function retryConfigSync() {
  return serial(async () => {
    await request('configSync:init', captureConfig(localStorage));
    await drainOutbox();
    await request('configSync:retry');
  });
}

export async function downloadSyncBackup() {
  const backup = (await getStorage().local.get(SYNC_BACKUP_KEY))[SYNC_BACKUP_KEY];
  if (!backup) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'your-new-tab-before-sync.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
