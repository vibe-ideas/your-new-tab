import { getStorage } from './browser';
import { SYNC_STATE_KEY, SYNC_BACKUP_KEY, SYNC_SECTIONS, SYNC_PREFIX, emptySnapshot, validatePatch, same, type SyncState, type SyncSnapshot, type SyncPatch, type SyncSection } from './configSyncModel';
import { encodeSections, decodeSections, checkSyncQuota, obsoleteChunks, storageBytes } from './configSyncStorage';

// One writer per browser profile. Pending changes survive service-worker shutdown.
export function startConfigSyncService() {
  const storage = getStorage();
  let queue: Promise<unknown> = Promise.resolve();
  const serial = <T>(operation: () => Promise<T>): Promise<T> => {
    const next = queue.then(operation, operation);
    queue = next.catch(() => {});
    return next;
  };
  const load = async (): Promise<SyncState | undefined> => (await storage.local.get(SYNC_STATE_KEY))[SYNC_STATE_KEY] as SyncState | undefined;
  const store = async (state: SyncState) => { await storage.local.set({ [SYNC_STATE_KEY]: state }); return state; };

  async function reconcile(state: SyncState, seed?: SyncSnapshot): Promise<SyncState> {
    try {
      const records = await storage.sync.get(null);
      const remote = await decodeSections(records);
      state.lastCheckedAt = Date.now();
      state.bytes = storageBytes(records);
      if (!state.initialized) {
        // Existing cloud data takes precedence over a newly installed machine.
        // Keep the original local settings in a separate, downloadable backup.
        if (remote.errors.length) throw new Error('SYNC_INCOMPLETE');
        if (remote.exists && Object.keys(remote.values).some((section) => !(section in state.pending))) state.lastReceivedAt = Date.now();
        state.values = { ...emptySnapshot(), ...(remote.exists ? remote.values : seed || state.values), ...state.pending };
        if (!remote.exists) {
          for (const section of SYNC_SECTIONS) if (state.values[section] !== null) state.pending[section] = state.values[section];
        }
        state.initialized = true;
      } else {
        for (const section of SYNC_SECTIONS) {
          if (section in remote.values && !(section in state.pending)) {
            if (!same(state.values[section], remote.values[section])) state.lastReceivedAt = Date.now();
            state.values[section] = remote.values[section]!;
          }
        }
      }
      state.error = remote.errors.length ? 'SYNC_INCOMPLETE' : undefined;
      state.status = state.error ? 'error' : Object.keys(state.pending).length ? 'pending' : 'ready';
    } catch (error) {
      state.status = 'error'; state.error = error instanceof Error ? error.message : String(error);
    }
    return state;
  }

  async function flush(state: SyncState): Promise<SyncState> {
    if (!state.initialized || !Object.keys(state.pending).length) return store(state);
    try {
      const records = await storage.sync.get(null);
      const writes = await encodeSections(state.pending);
      // Check the peak size before making any changes; failed saves retain the cloud copy.
      checkSyncQuota({ ...records, ...writes });
      await storage.sync.set(writes);
      state.lastWrittenAt = Date.now();
      const stale = obsoleteChunks(records, writes, Object.keys(state.pending) as SyncSection[]);
      state.pending = {};
      state.status = 'ready'; state.error = undefined;
      // Commit the cleared outbox before optional cleanup. A cleanup failure must
      // never cause a successfully written edit to be replayed over a newer device.
      await store(state);
      if (stale.length) await storage.sync.remove(stale);
      await reconcile(state);
    } catch (error) {
      state.status = 'error'; state.error = error instanceof Error ? error.message : String(error);
    }
    return store(state);
  }

  const handle = (action: string, input?: unknown) => serial(async () => {
    let state = await load();
    if (action === 'configSync:init') {
      const seed = { ...emptySnapshot(), ...validatePatch(input) };
      if (!state) {
        state = { values: seed, pending: {}, initialized: false, bytes: 0, status: 'pending' };
        const backup = await storage.local.get(SYNC_BACKUP_KEY);
        if (!backup[SYNC_BACKUP_KEY]) await storage.local.set({ [SYNC_BACKUP_KEY]: { createdAt: new Date().toISOString(), values: seed } });
        await store(state);
      }
      await reconcile(state, seed);
    } else {
      if (!state) throw new Error('Configuration sync has not initialized');
      await reconcile(state);
      if (action === 'configSync:save') {
        const patch = validatePatch(input);
        state.values = { ...state.values, ...patch };
        state.pending = { ...state.pending, ...patch };
        state.status = 'pending';
      }
    }
    await store(state);
    return flush(state);
  });

  storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync' || !Object.keys(changes).some((key) => key.startsWith(SYNC_PREFIX))) return;
    void serial(async () => {
      const state = await load();
      if (state) await store(await reconcile(state));
    }).catch((error) => console.warn('Could not receive configuration sync', error));
  });
  return handle;
}
