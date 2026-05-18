import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium, test, expect } from '@playwright/test';

const extensionPath = path.join(process.cwd(), '.output', 'chrome-mv3');

const externalJson = JSON.stringify([
  { id: 'grp-ext-1', title: 'External Site', url: 'https://example.com/external' },
], null, 2);

const internalJson = JSON.stringify([
  { id: 'grp-int-1', title: 'Internal Site', url: 'https://example.com/internal' },
], null, 2);

async function launchExtension() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'your-new-tab-pw-groups-'));
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

const externalLabel = /外网|External/i;
const internalLabel = /内网|Internal/i;

const popupGroupButton = (popupPage, label) =>
  popupPage.locator('.bookmark-group-button').filter({ hasText: label });

const newtabGroupButton = (newTabPage, label) =>
  newTabPage.locator('.bookmark-group-toggle-button').filter({ hasText: label });

async function activatePopupBookmarksTab(popupPage) {
  const bookmarksTab = popupPage.locator('[role="tab"][data-tab="bookmarks"]');
  if ((await bookmarksTab.getAttribute('aria-selected')) !== 'true') {
    await bookmarksTab.click();
  }
  await expect(popupPage.locator('[data-tab-panel="bookmarks"]')).toBeVisible();
}

async function fillDirectJsonForCurrentGroup(popupPage, jsonText) {
  await activatePopupBookmarksTab(popupPage);
  const directJsonCard = popupPage.locator('.toggle-card')
    .filter({ hasText: /直接粘贴书签 JSON|Paste Bookmarks JSON Directly/ });
  await expect(directJsonCard).toBeVisible();
  const isActive = await directJsonCard.evaluate((el) => el.classList.contains('active'));
  if (!isActive) await directJsonCard.click();
  const textarea = popupPage.locator('#bookmarksJson');
  await expect(textarea).toBeVisible();
  await textarea.fill(jsonText);
}

async function saveAndExpectSuccess(popupPage) {
  await popupPage.locator('#saveConfigButton').click();
  await expect(popupPage.locator('.status-message.success')).toBeVisible();
  // Wait the auto-dismiss out so subsequent assertions don't race.
  await expect(popupPage.locator('.status-message.success')).toBeHidden({ timeout: 5000 });
}

test('each bookmark group keeps its own JSON; new tab toggle swaps bookmarks and persists across reload', async () => {
  const extension = await launchExtension();
  try {
    const popupPage = await openExtensionPage(extension.context, extension.extensionId, 'popup');

    // External (default active group) — direct JSON.
    await fillDirectJsonForCurrentGroup(popupPage, externalJson);
    await saveAndExpectSuccess(popupPage);

    // Switch popup to Internal and configure separately.
    await popupGroupButton(popupPage, internalLabel).click();
    await fillDirectJsonForCurrentGroup(popupPage, internalJson);
    await saveAndExpectSuccess(popupPage);

    // Open new tab — last popup-clicked group is Internal.
    const newTabPage = await openExtensionPage(extension.context, extension.extensionId, 'newtab');
    await expect(newTabPage.locator('.bookmark-group-toggle-button.active')).toContainText(internalLabel);
    await expect(newTabPage.locator('.shortcut-label')).toContainText(['Internal Site']);

    // Switch via the corner toggle on the new tab — bookmarks must swap.
    await newtabGroupButton(newTabPage, externalLabel).click();
    await expect(newTabPage.locator('.bookmark-group-toggle-button.active')).toContainText(externalLabel);
    await expect(newTabPage.locator('.shortcut-label')).toContainText(['External Site']);

    // Reload — the active group choice persists.
    await newTabPage.reload();
    await expect(newTabPage.locator('.bookmark-group-toggle-button.active')).toContainText(externalLabel);
    await expect(newTabPage.locator('.shortcut-label')).toContainText(['External Site']);
  } finally {
    await extension.cleanup();
  }
});

test('custom group labels render in the popup switcher and the new tab toggle', async () => {
  const extension = await launchExtension();
  try {
    const popupPage = await openExtensionPage(extension.context, extension.extensionId, 'popup');
    await activatePopupBookmarksTab(popupPage);

    // Rename External (active by default).
    await popupPage.locator('#bookmarkGroupLabel').fill('Public Web');
    // Switch to Internal and rename.
    await popupGroupButton(popupPage, internalLabel).click();
    await popupPage.locator('#bookmarkGroupLabel').fill('Corp VPN');
    await saveAndExpectSuccess(popupPage);

    const groupButtons = popupPage.locator('.bookmark-group-button');
    await expect(groupButtons.nth(0)).toHaveText('Public Web');
    await expect(groupButtons.nth(1)).toHaveText('Corp VPN');

    const newTabPage = await openExtensionPage(extension.context, extension.extensionId, 'newtab');
    const toggleButtons = newTabPage.locator('.bookmark-group-toggle-button');
    await expect(toggleButtons.nth(0)).toHaveText('Public Web');
    await expect(toggleButtons.nth(1)).toHaveText('Corp VPN');

    // Empty input falls back to the default label.
    await popupPage.bringToFront();
    await popupGroupButton(popupPage, /Corp VPN/).click();
    await popupPage.locator('#bookmarkGroupLabel').fill('');
    await saveAndExpectSuccess(popupPage);

    await expect(newTabPage.locator('.bookmark-group-toggle-button').nth(1)).toHaveText(internalLabel);
  } finally {
    await extension.cleanup();
  }
});

test('already-open new tab follows popup-driven group switch via the storage event', async () => {
  const extension = await launchExtension();
  try {
    const popupPage = await openExtensionPage(extension.context, extension.extensionId, 'popup');

    // Seed both groups.
    await fillDirectJsonForCurrentGroup(popupPage, externalJson);
    await saveAndExpectSuccess(popupPage);
    await popupGroupButton(popupPage, internalLabel).click();
    await fillDirectJsonForCurrentGroup(popupPage, internalJson);
    await saveAndExpectSuccess(popupPage);

    // Force active group to External so the new tab opens on it.
    await popupGroupButton(popupPage, externalLabel).click();
    await expect.poll(() =>
      popupPage.evaluate(() => localStorage.getItem('activeBookmarkGroup'))
    ).toBe('external');

    const newTabPage = await openExtensionPage(extension.context, extension.extensionId, 'newtab');
    await expect(newTabPage.locator('.bookmark-group-toggle-button.active')).toContainText(externalLabel);
    await expect(newTabPage.locator('.shortcut-label')).toContainText(['External Site']);

    // Now flip the popup back to Internal — the open new tab must follow.
    await popupPage.bringToFront();
    await popupGroupButton(popupPage, internalLabel).click();
    await expect.poll(() =>
      popupPage.evaluate(() => localStorage.getItem('activeBookmarkGroup'))
    ).toBe('internal');

    await expect(newTabPage.locator('.bookmark-group-toggle-button.active')).toContainText(internalLabel);
    await expect(newTabPage.locator('.shortcut-label')).toContainText(['Internal Site']);
  } finally {
    await extension.cleanup();
  }
});
