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
  await popupPage.locator('[data-tab="bookmarks"]').click();
  await popupPage.locator('.source-option').filter({ hasText: /JSON 数据|JSON data/ }).click();
  const textarea = popupPage.locator('#bookmarksJson');
  await expect(textarea).toBeVisible();
  await textarea.fill(jsonText);
}

test('saving bookmark JSON updates an already-open new tab', async () => {
  const extension = await launchExtension();

  try {
    const newTabPage = await openExtensionPage(extension.context, extension.extensionId, 'newtab');
    // Defaults render before any save.
    await expect(newTabPage.locator('.shortcut-label').first()).toBeVisible();

    const popupPage = await openExtensionPage(extension.context, extension.extensionId, 'settings');
    await pasteDirectJson(popupPage, directJsonBefore);
    await popupPage.locator('#saveConfigButton').click();
    await expect(popupPage.locator('.status-message.success')).toBeVisible();

    await expect(newTabPage.locator('.shortcut-label')).toContainText(['Before Save']);
  } finally {
    await extension.cleanup();
  }
});

test('refreshing saved bookmarks updates an already-open new tab', async () => {
  const extension = await launchExtension();

  try {
    const popupPage = await openExtensionPage(extension.context, extension.extensionId, 'settings');
    await pasteDirectJson(popupPage, directJsonBefore);
    await popupPage.locator('#saveConfigButton').click();
    await expect(popupPage.locator('.status-message.success')).toBeVisible();

    const newTabPage = await openExtensionPage(extension.context, extension.extensionId, 'newtab');
    await expect(newTabPage.locator('.shortcut-label')).toContainText(['Before Save']);

    // Mutate the persisted JSON for the active group from the new tab itself —
    // same-document setItem does NOT fire a storage event in this page, so
    // without the refresh signal the UI stays stale.
    await newTabPage.evaluate((json) => {
      const group = localStorage.getItem('activeBookmarkGroup') || 'external';
      localStorage.setItem(`bookmarkGroup.${group}.bookmarksJson`, json);
    }, directJsonAfterRefresh);

    // Click Refresh bookmarks in the popup; it writes bookmarksRefreshSignal,
    // which fires a storage event in the new tab and triggers a re-read.
    const refreshLabel = /刷新已保存的书签|Refresh saved bookmarks/i;
    await popupPage.getByRole('button', { name: refreshLabel }).click();

    await expect(newTabPage.locator('.shortcut-label')).toContainText(['After Refresh']);
  } finally {
    await extension.cleanup();
  }
});

test('validating bookmark JSON keeps success feedback visible after scrolling', async () => {
  const extension = await launchExtension();

  try {
    const popupPage = await openExtensionPage(extension.context, extension.extensionId, 'settings');

    // Direct JSON, valid payload — Test should report success.
    await pasteDirectJson(popupPage, directJsonBefore);

    const testLabel = /^校验数据$|^Validate data$/i;
    const testButton = popupPage.getByRole('button', { name: testLabel });

    // Scroll to the Test button so the popup viewport sits on Quick actions
    // (this is the failure mode the user reported: status was rendered above
    // the visible area).
    await testButton.scrollIntoViewIfNeeded();
    await testButton.click();

    const successToast = popupPage.locator('.status-message.success');
    await expect(successToast).toBeVisible();
    await expect(successToast).toBeInViewport();

    // Wait the auto-dismiss out so the next assertion isn't racing.
    await expect(successToast).toBeHidden({ timeout: 5000 });

    // Direct JSON, invalid payload — Test should report an error.
    const jsonTextarea = popupPage.locator('#bookmarksJson');
    await jsonTextarea.fill('not-json');
    await testButton.scrollIntoViewIfNeeded();
    await testButton.click();

    const errorToast = popupPage.locator('.status-message.error');
    await expect(errorToast).toBeVisible();
    await expect(errorToast).toBeInViewport();
  } finally {
    await extension.cleanup();
  }
});

test('restoring bookmark-group defaults only updates an open new tab after saving', async () => {
  const extension = await launchExtension();

  try {
    const popupPage = await openExtensionPage(extension.context, extension.extensionId, 'settings');
    await pasteDirectJson(popupPage, directJsonBefore);
    await popupPage.locator('#saveConfigButton').click();
    await expect(popupPage.locator('.status-message.success')).toBeVisible();

    const newTabPage = await openExtensionPage(extension.context, extension.extensionId, 'newtab');
    await expect(newTabPage.locator('.shortcut-label')).toContainText(['Before Save']);

    const resetLabel = /^恢复当前分组默认$|^Restore group defaults$/i;
    await popupPage.getByRole('button', { name: resetLabel }).click();
    await popupPage.locator('#confirmRestoreButton').click();
    await expect(newTabPage.locator('.shortcut-label')).toContainText(['Before Save']);
    await popupPage.locator('#saveConfigButton').click();
    await expect(popupPage.locator('.status-message.success')).toBeVisible();

    // Default bookmarks should now render — the test JSON entry must be gone.
    await expect(newTabPage.locator('.shortcut-label', { hasText: 'Before Save' })).toHaveCount(0);
    await expect(newTabPage.locator('.shortcut-label').first()).toBeVisible();
  } finally {
    await extension.cleanup();
  }
});
