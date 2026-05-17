import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium, test, expect } from '@playwright/test';

const extensionPath = path.join(process.cwd(), '.output', 'chrome-mv3');

const directJsonBefore = JSON.stringify([
  { id: 'qa-before-1', title: 'Before Save', url: 'https://example.com/before' },
], null, 2);

const directJsonAfterRefresh = JSON.stringify([
  { id: 'qa-refresh-1', title: 'After Refresh', url: 'https://example.com/after-refresh' },
]);

async function launchExtension() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'your-new-tab-pw-quick-'));
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    viewport: { width: 1440, height: 960 },
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent('serviceworker');
  }
  const extensionId = new URL(serviceWorker.url()).host;

  return {
    context,
    extensionId,
    async cleanup() {
      await context.close();
      fs.rmSync(userDataDir, { recursive: true, force: true });
    },
  };
}

async function openExtensionPage(context, extensionId, pageName) {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/${pageName}.html`);
  return page;
}

async function pasteDirectJson(popupPage, jsonText) {
  await popupPage.locator('.toggle-card').filter({ hasText: /直接粘贴书签 JSON|Paste Bookmarks JSON Directly/ }).click();
  const textarea = popupPage.locator('#bookmarksJson');
  await expect(textarea).toBeVisible();
  await textarea.fill(jsonText);
}

test('Save in Quick actions propagates new direct JSON bookmarks to an already-open new tab', async () => {
  const extension = await launchExtension();

  try {
    const newTabPage = await openExtensionPage(extension.context, extension.extensionId, 'newtab');
    // Defaults render before any save.
    await expect(newTabPage.locator('.shortcut-label').first()).toBeVisible();

    const popupPage = await openExtensionPage(extension.context, extension.extensionId, 'popup');
    await pasteDirectJson(popupPage, directJsonBefore);
    await popupPage.locator('#saveConfigButton').click();
    await expect(popupPage.locator('.status-message.success')).toBeVisible();

    await expect(newTabPage.locator('.shortcut-label')).toContainText(['Before Save']);
  } finally {
    await extension.cleanup();
  }
});

test('Refresh bookmarks in Quick actions re-reads bookmarks in an already-open new tab', async () => {
  const extension = await launchExtension();

  try {
    const popupPage = await openExtensionPage(extension.context, extension.extensionId, 'popup');
    await pasteDirectJson(popupPage, directJsonBefore);
    await popupPage.locator('#saveConfigButton').click();
    await expect(popupPage.locator('.status-message.success')).toBeVisible();

    const newTabPage = await openExtensionPage(extension.context, extension.extensionId, 'newtab');
    await expect(newTabPage.locator('.shortcut-label')).toContainText(['Before Save']);

    // Mutate the persisted JSON from the new tab itself — same-document setItem
    // does NOT fire a storage event in this page, so without the refresh signal
    // the UI stays stale.
    await newTabPage.evaluate((json) => {
      localStorage.setItem('bookmarksJson', json);
    }, directJsonAfterRefresh);

    // Click Refresh bookmarks in the popup; it writes bookmarksRefreshSignal,
    // which fires a storage event in the new tab and triggers a re-read.
    const refreshLabel = /刷新书签|Refresh bookmarks/i;
    await popupPage.getByRole('button', { name: refreshLabel }).click();

    await expect(newTabPage.locator('.shortcut-label')).toContainText(['After Refresh']);
  } finally {
    await extension.cleanup();
  }
});

test('Reset in Quick actions restores defaults in an already-open new tab', async () => {
  const extension = await launchExtension();

  try {
    const popupPage = await openExtensionPage(extension.context, extension.extensionId, 'popup');
    await pasteDirectJson(popupPage, directJsonBefore);
    await popupPage.locator('#saveConfigButton').click();
    await expect(popupPage.locator('.status-message.success')).toBeVisible();

    const newTabPage = await openExtensionPage(extension.context, extension.extensionId, 'newtab');
    await expect(newTabPage.locator('.shortcut-label')).toContainText(['Before Save']);

    const resetLabel = /^重置$|^Reset$/i;
    await popupPage.getByRole('button', { name: resetLabel }).click();
    await expect(popupPage.locator('.status-message.success')).toBeVisible();

    // Default bookmarks should now render — the test JSON entry must be gone.
    await expect(newTabPage.locator('.shortcut-label', { hasText: 'Before Save' })).toHaveCount(0);
    await expect(newTabPage.locator('.shortcut-label').first()).toBeVisible();
  } finally {
    await extension.cleanup();
  }
});
