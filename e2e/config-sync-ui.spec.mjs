import fs from 'node:fs/promises';
import { test, expect, bookmarks, enterJson, selectSettingsTab } from './helpers/extension.mjs';

const STATE = 'configSync.state.v1';
async function readState(app) {
  return app.worker.evaluate(async (key) => (await chrome.storage.local.get(key))[key], STATE);
}
async function waitReady(app) {
  await expect(app.settings.locator('.config-sync')).toHaveAttribute('data-sync-status', 'ready');
}
async function remoteRecords(app, section, value) {
  return app.worker.evaluate(async ({ section, value }) => {
    const text = JSON.stringify(value);
    const revision = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))), (byte) => byte.toString(16).padStart(2, '0')).join('');
    const key = `config.v1.${section}`;
    return { [key]: { version: 1, revision, parts: 1 }, [`${key}.0`]: { revision, data: text } };
  }, { section, value });
}
async function receive(app, section, value) {
  const records = await remoteRecords(app, section, value);
  await app.worker.evaluate((data) => chrome.storage.sync.set(data), records);
}

test('the first sync uploads existing custom settings from this browser instead of a template', async ({ app }) => {
  await waitReady(app);
  await app.settings.close();
  await app.worker.evaluate(() => chrome.storage.sync.clear());
  const launcher = await app.open('popup');
  // Drain the receiver of the clear event before resetting this test profile.
  await launcher.evaluate(() => chrome.runtime.sendMessage({ action: 'configSync:retry' }));
  await app.worker.evaluate(() => chrome.storage.local.clear());
  await launcher.evaluate((data) => {
    localStorage.clear();
    const values = {
      language: 'en',
      'bookmarkGroup.external.useDefaultBookmarks': 'false',
      'bookmarkGroup.external.useDirectJson': 'true',
      'bookmarkGroup.external.bookmarksJson': JSON.stringify(data),
      'bookmarkGroup.internal.useDefaultBookmarks': 'false',
      'bookmarkGroup.internal.useDirectJson': 'false',
      'bookmarkGroup.internal.bookmarksUrl': 'https://example.com/private.json',
      bookmarkGroupLabels: JSON.stringify({ external: 'Personal', internal: 'Work' }),
      searchProviders: JSON.stringify([{ id: 'mine', name: 'My search', urlTemplate: 'https://example.com/search?q={query}' }]),
      defaultSearchProvider: 'mine', customBackgroundMediaUrls: 'https://example.com/custom.webm',
      anniversaryItems: '[]', searchHistory: '["do not sync"]',
    };
    for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
  }, bookmarks('Existing user bookmark'));
  app.settings = await app.open('settings');
  await waitReady(app);
  const state = await readState(app);
  expect(state.values.external).toEqual({ source: 'json', label: 'Personal', bookmarks: bookmarks('Existing user bookmark') });
  expect(state.values.internal).toEqual({ source: 'remote', label: 'Work', url: 'https://example.com/private.json' });
  expect(state.values.search.defaultProviderId).toBe('mine');
  expect(state.values.search.providers.map((item) => item.id)).toEqual(['mine']);
  expect(state.values.backgrounds).toEqual({ urls: ['https://example.com/custom.webm'] });
  expect(state.values.dates).toEqual({ items: [] });
  expect(JSON.stringify(await app.worker.evaluate(() => chrome.storage.sync.get(null)))).not.toContain('do not sync');
});

test('a browser sync write failure keeps saved edits and reopening settings retries the pending upload', async ({ app }) => {
  await waitReady(app);
  const lastWrittenAt = (await readState(app)).lastWrittenAt;
  await app.worker.evaluate(() => {
    globalThis.originalSyncSet = chrome.storage.sync.set.bind(chrome.storage.sync);
    chrome.storage.sync.set = async () => { throw new Error('Simulated sync write failure'); };
  });
  await enterJson(app.settings, bookmarks('Retry after failure'));
  await app.settings.locator('#saveConfigButton').click();
  await expect(app.settings.locator('.config-sync')).toHaveAttribute('data-sync-status', 'error');
  expect((await readState(app)).lastWrittenAt).toBe(lastWrittenAt);
  expect((await readState(app)).pending.external.bookmarks).toEqual(bookmarks('Retry after failure'));
  await app.worker.evaluate(() => { chrome.storage.sync.set = globalThis.originalSyncSet; });
  await app.settings.reload();
  await waitReady(app);
  expect((await readState(app)).pending).toEqual({});
  expect((await readState(app)).lastWrittenAt).toBeGreaterThan(lastWrittenAt);
  const records = await app.worker.evaluate(() => chrome.storage.sync.get(null));
  expect(JSON.stringify(records)).toContain('Retry after failure');
});

test('sync activity distinguishes saved writes, manual checks and incoming updates and retains their times after reload', async ({ app }) => {
  await waitReady(app);
  const written = app.settings.locator('[data-sync-time="written"] time');
  const received = app.settings.locator('[data-sync-time="received"] time');
  const checked = app.settings.locator('[data-sync-time="checked"] time');
  const initialWrite = (await readState(app)).lastWrittenAt;
  await expect(written).toHaveAttribute('datetime', new Date(initialWrite).toISOString());
  await expect(received).toHaveCount(0);

  await enterJson(app.settings, bookmarks('Timestamped save'));
  await app.settings.locator('#saveConfigButton').click();
  await expect.poll(async () => (await readState(app)).lastWrittenAt).toBeGreaterThan(initialWrite);
  await waitReady(app);
  const savedTime = (await readState(app)).lastWrittenAt;
  await expect(written).toHaveAttribute('datetime', new Date(savedTime).toISOString());
  await expect(received).toHaveCount(0); // A local write is not an incoming update.

  const checkedBefore = (await readState(app)).lastCheckedAt;
  await app.worker.evaluate(() => {
    const original = chrome.storage.sync.get.bind(chrome.storage.sync);
    chrome.storage.sync.get = async (...args) => {
      chrome.storage.sync.get = original;
      await new Promise((resolve) => { globalThis.releaseSyncCheck = resolve; });
      return original(...args);
    };
  });
  await app.settings.getByRole('button', { name: 'Retry sync', exact: true }).click();
  await expect(app.settings.getByRole('button', { name: 'Checking sync…', exact: true })).toBeDisabled();
  await app.worker.evaluate(() => globalThis.releaseSyncCheck());
  await expect(app.settings.getByRole('button', { name: 'Retry sync', exact: true })).toBeEnabled();
  const afterCheck = await readState(app);
  expect(afterCheck.lastCheckedAt).toBeGreaterThan(checkedBefore);
  expect(afterCheck.lastWrittenAt).toBe(savedTime);
  await expect(checked).toHaveAttribute('datetime', new Date(afterCheck.lastCheckedAt).toISOString());

  await receive(app, 'external', { source: 'json', label: '', bookmarks: bookmarks('Incoming with timestamp') });
  await expect(received).toHaveCount(1);
  const receivedTime = (await readState(app)).lastReceivedAt;
  await expect(received).toHaveAttribute('datetime', new Date(receivedTime).toISOString());
  await app.settings.reload();
  await waitReady(app);
  await expect(written).toHaveAttribute('datetime', new Date(savedTime).toISOString());
  await expect(received).toHaveAttribute('datetime', new Date(receivedTime).toISOString());
});

test('saving custom bookmarks syncs actual content while leaving history and image caches on this device', async ({ app }) => {
  await waitReady(app);
  await app.seed({ searchHistory: ['private query'], backgroundImage: { base64: 'private image', timestamp: Date.now() } });
  const data = bookmarks('My actual bookmark');
  await enterJson(app.settings, JSON.stringify(data, null, 2));
  await app.settings.locator('#saveConfigButton').click();
  await expect.poll(async () => (await readState(app)).values.external?.bookmarks).toEqual(data);
  await waitReady(app);
  const records = await app.worker.evaluate(() => chrome.storage.sync.get(null));
  expect(JSON.stringify(records)).toContain('My actual bookmark');
  expect(JSON.stringify(records)).not.toContain('private query');
  expect(JSON.stringify(records)).not.toContain('private image');
  expect(JSON.stringify(records)).not.toContain('linearGradient');
  expect((await readState(app)).values.internal).toBeNull();
});

test('another device updates saved bookmarks without overwriting an unsaved background draft', async ({ app }) => {
  await waitReady(app);
  const newtab = await app.open();
  await selectSettingsTab(app.settings, 'backgrounds');
  await app.settings.locator('#backgroundMediaUrls').fill('https://example.com/draft.webm');
  await receive(app, 'external', { source: 'json', label: 'Remote group', bookmarks: bookmarks('Remote bookmark') });
  await expect(newtab.locator('.shortcut-label')).toHaveText(['Remote bookmark']);
  await expect(app.settings.locator('.sync-draft-notice')).toBeVisible();
  await expect(app.settings.locator('#backgroundMediaUrls')).toHaveValue('https://example.com/draft.webm');
  await app.settings.locator('#saveConfigButton').click();
  await expect.poll(async () => (await readState(app)).values.backgrounds).toEqual({ urls: ['https://example.com/draft.webm'] });
  expect((await readState(app)).values.external.bookmarks).toEqual(bookmarks('Remote bookmark'));
});

test('discarding an unsaved bookmark draft loads the latest configuration received from another device', async ({ app }) => {
  await waitReady(app);
  await enterJson(app.settings, bookmarks('Unsaved draft'));
  await receive(app, 'external', { source: 'json', label: '', bookmarks: bookmarks('Latest remote') });
  await expect(app.settings.locator('.sync-draft-notice')).toBeVisible();
  await expect(app.settings.locator('#bookmarksJson')).toHaveValue(JSON.stringify(bookmarks('Unsaved draft')));
  await app.settings.locator('#discardConfigButton').click();
  await expect(app.settings.locator('#bookmarksJson')).toHaveValue(JSON.stringify(bookmarks('Latest remote')));
  await expect(app.settings.locator('.sync-draft-notice')).toHaveCount(0);
});

test('saving an external group label preserves an internal group label changed by another device', async ({ app }) => {
  await waitReady(app);
  await selectSettingsTab(app.settings, 'bookmarks');
  await app.settings.locator('#bookmarkGroupLabel').fill('My external label');
  await receive(app, 'internal', { source: 'default', label: 'Remote internal label' });
  await expect(app.settings.locator('.sync-draft-notice')).toBeVisible();
  await app.settings.locator('#saveConfigButton').click();
  await expect.poll(async () => (await readState(app)).values.external?.label).toBe('My external label');
  expect((await readState(app)).values.internal.label).toBe('Remote internal label');
  expect(await app.settings.evaluate(() => JSON.parse(localStorage.getItem('bookmarkGroupLabels')))).toEqual({ external: 'My external label', internal: 'Remote internal label' });
});

test('invalid incoming bookmarks retain the previous list and saving a valid replacement repairs sync', async ({ app }) => {
  await waitReady(app);
  await receive(app, 'external', { source: 'json', label: '', bookmarks: bookmarks('Valid previous') });
  const newtab = await app.open();
  await expect(newtab.locator('.shortcut-label')).toHaveText(['Valid previous']);
  await receive(app, 'external', { source: 'json', label: '', bookmarks: [{ id: 'bad', title: 'Invalid', url: 'javascript:alert(1)' }] });
  await expect(app.settings.locator('.config-sync')).toHaveAttribute('data-sync-status', 'error');
  await expect(newtab.locator('.shortcut-label')).toHaveText(['Valid previous']);
  await enterJson(app.settings, bookmarks('Repaired locally'));
  await app.settings.locator('#saveConfigButton').click();
  await expect.poll(async () => (await readState(app)).values.external?.bookmarks?.[0].title).toBe('Repaired locally');
  await waitReady(app);
  await expect(newtab.locator('.shortcut-label')).toHaveText(['Repaired locally']);
});

test('a new machine restores existing synced settings and exports its previous local configuration as a backup', async ({ app }) => {
  await waitReady(app);
  await receive(app, 'external', { source: 'json', label: '', bookmarks: bookmarks('Cloud bookmark') });
  await expect.poll(async () => (await readState(app)).values.external?.bookmarks?.[0].title).toBe('Cloud bookmark');
  await app.settings.close();
  await app.worker.evaluate(() => chrome.storage.local.clear());
  const page = await app.open('popup'); // Launcher does not initialize configuration sync.
  await page.evaluate((data) => {
    localStorage.clear();
    localStorage.setItem('language', 'en');
    localStorage.setItem('bookmarkGroup.external.useDefaultBookmarks', 'false');
    localStorage.setItem('bookmarkGroup.external.useDirectJson', 'true');
    localStorage.setItem('bookmarkGroup.external.bookmarksJson', JSON.stringify(data));
  }, bookmarks('Old machine-local bookmark'));
  app.settings = await app.open('settings');
  await waitReady(app);
  await selectSettingsTab(app.settings, 'bookmarks');
  await expect(app.settings.locator('#bookmarksJson')).toHaveValue(JSON.stringify(bookmarks('Cloud bookmark')));
  await app.settings.locator('.sync-details > summary').click();
  const [download] = await Promise.all([
    app.settings.waitForEvent('download'),
    app.settings.getByRole('button', { name: 'Export pre-sync backup' }).click(),
  ]);
  const backup = JSON.parse(await fs.readFile(await download.path(), 'utf8'));
  expect(backup.values.external.bookmarks).toEqual(bookmarks('Old machine-local bookmark'));
});

test('bookmarks larger than one sync item are split and remain readable after reopening settings', async ({ app }) => {
  await waitReady(app);
  const data = Array.from({ length: 120 }, (_, index) => ({ id: `bookmark-${index}`, title: `中文 😀 ${index}`, url: `https://example.com/${index}`, category: 'A category with "quotes"' }));
  await enterJson(app.settings, data);
  await app.settings.locator('#saveConfigButton').click();
  await expect.poll(async () => (await readState(app)).values.external?.bookmarks?.length).toBe(120);
  await waitReady(app);
  const records = await app.worker.evaluate(() => chrome.storage.sync.get(null));
  expect(records['config.v1.external'].parts).toBeGreaterThan(1);
  for (const [key, value] of Object.entries(records)) expect(Buffer.byteLength(key) + Buffer.byteLength(JSON.stringify(value))).toBeLessThanOrEqual(8192);
  await app.settings.reload();
  await selectSettingsTab(app.settings, 'bookmarks');
  expect(JSON.parse(await app.settings.locator('#bookmarksJson').inputValue())).toEqual(data);
});

test('incomplete incoming bookmark chunks retain the last valid configuration until every chunk arrives', async ({ app }) => {
  await waitReady(app);
  await receive(app, 'external', { source: 'json', label: '', bookmarks: bookmarks('Complete old value') });
  const newtab = await app.open();
  await expect(newtab.locator('.shortcut-label')).toHaveText(['Complete old value']);
  const records = await remoteRecords(app, 'external', { source: 'json', label: '', bookmarks: bookmarks('Complete new value') });
  await app.worker.evaluate((data) => chrome.storage.sync.set({ 'config.v1.external': data['config.v1.external'] }), records);
  await expect(app.settings.locator('.config-sync')).toHaveAttribute('data-sync-status', 'error');
  await expect(newtab.locator('.shortcut-label')).toHaveText(['Complete old value']);
  await app.worker.evaluate((data) => chrome.storage.sync.set({ 'config.v1.external.0': data['config.v1.external.0'] }), records);
  await expect(newtab.locator('.shortcut-label')).toHaveText(['Complete new value']);
  await waitReady(app);
});

test('an oversized save stays local without replacing the synced copy and a smaller edit retries successfully', async ({ app }) => {
  await waitReady(app);
  await enterJson(app.settings, bookmarks('Last synced'));
  await app.settings.locator('#saveConfigButton').click();
  await expect.poll(async () => (await readState(app)).values.external?.bookmarks?.[0].title).toBe('Last synced');
  await waitReady(app);
  const previous = await app.worker.evaluate(() => chrome.storage.sync.get(null));
  const large = [{ ...bookmarks('Large local')[0], extra: 'x'.repeat(110000) }];
  await enterJson(app.settings, large);
  await app.settings.locator('#saveConfigButton').click();
  await expect(app.settings.locator('.config-sync')).toContainText('Sync capacity exceeded');
  expect(await app.worker.evaluate(() => chrome.storage.sync.get(null))).toEqual(previous);
  expect(JSON.parse(await app.settings.evaluate(() => localStorage.getItem('bookmarkGroup.external.bookmarksJson')))).toEqual(large);
  await app.settings.reload();
  await expect(app.settings.locator('.config-sync')).toContainText('Sync capacity exceeded');
  await enterJson(app.settings, bookmarks('Smaller retry'));
  await app.settings.locator('#saveConfigButton').click();
  await expect.poll(async () => (await readState(app)).values.external?.bookmarks?.[0].title).toBe('Smaller retry');
  await waitReady(app);
  expect((await readState(app)).pending).toEqual({});
});

test('restoring a bookmark group syncs the default choice without uploading bundled bookmarks', async ({ app }) => {
  await waitReady(app);
  await enterJson(app.settings, bookmarks('To reset'));
  await app.settings.locator('#saveConfigButton').click();
  await expect.poll(async () => (await readState(app)).values.external?.bookmarks?.[0].title).toBe('To reset');
  await app.settings.getByRole('button', { name: 'Restore group defaults', exact: true }).click();
  await app.settings.locator('#confirmRestoreButton').click();
  await app.settings.locator('#saveConfigButton').click();
  await expect.poll(async () => (await readState(app)).values.external).toBeNull();
  await waitReady(app);
  const records = await app.worker.evaluate(() => chrome.storage.sync.get(null));
  expect(records['config.v1.external.0'].data).toBe('null');
});
