import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium, test, expect } from '@playwright/test';

const extensionPath = path.join(process.cwd(), '.output', 'chrome-mv3');

const sampleJson = JSON.stringify([
  { id: 'tab-test-1', title: 'Tab Test', url: 'https://example.com/tab-test' },
], null, 2);

async function launchExtension() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'your-new-tab-pw-tabs-'));
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

async function openPopup(context, extensionId) {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  return page;
}

test('Bookmarks tab is the default; tab navigation reveals each tab panel', async () => {
  const extension = await launchExtension();

  try {
    const popup = await openPopup(extension.context, extension.extensionId);

    // Bookmarks tab is the default — toggle cards visible, others hidden.
    await expect(popup.locator('[data-tab-panel="bookmarks"]')).toBeVisible();
    await expect(popup.locator('[role="tab"][data-tab="bookmarks"]')).toHaveAttribute('aria-selected', 'true');
    await expect(popup.locator('[data-tab-panel="search"]')).toHaveCount(0);
    await expect(popup.locator('[data-tab-panel="backgrounds"]')).toHaveCount(0);

    // Switch to Search.
    await popup.locator('[role="tab"][data-tab="search"]').click();
    await expect(popup.locator('[role="tab"][data-tab="search"]')).toHaveAttribute('aria-selected', 'true');
    await expect(popup.locator('[role="tab"][data-tab="bookmarks"]')).toHaveAttribute('aria-selected', 'false');
    await expect(popup.locator('[data-tab-panel="search"]')).toBeVisible();
    await expect(popup.locator('#defaultSearchProvider')).toBeVisible();
    await expect(popup.locator('[data-tab-panel="bookmarks"]')).toHaveCount(0);

    // Switch to Backgrounds.
    await popup.locator('[role="tab"][data-tab="backgrounds"]').click();
    await expect(popup.locator('[role="tab"][data-tab="backgrounds"]')).toHaveAttribute('aria-selected', 'true');
    await expect(popup.locator('#backgroundMediaUrls')).toBeVisible();
    await expect(popup.locator('[data-tab-panel="search"]')).toHaveCount(0);
  } finally {
    await extension.cleanup();
  }
});

test('Switching tabs preserves form state in unmounted panels', async () => {
  const extension = await launchExtension();

  try {
    const popup = await openPopup(extension.context, extension.extensionId);

    // Enter direct JSON mode and paste a payload on the Bookmarks tab.
    await popup.locator('.toggle-card').filter({ hasText: /直接粘贴书签 JSON|Paste Bookmarks JSON Directly/ }).click();
    await popup.locator('#bookmarksJson').fill(sampleJson);

    // Switch away to Search, then to Backgrounds, then back.
    await popup.locator('[role="tab"][data-tab="search"]').click();
    await expect(popup.locator('#defaultSearchProvider')).toBeVisible();
    await popup.locator('[role="tab"][data-tab="backgrounds"]').click();
    await expect(popup.locator('#backgroundMediaUrls')).toBeVisible();
    await popup.locator('[role="tab"][data-tab="bookmarks"]').click();

    // The pasted JSON must still be there (state lives in the popup-level hook).
    await expect(popup.locator('#bookmarksJson')).toHaveValue(sampleJson);
  } finally {
    await extension.cleanup();
  }
});

test('Save button in the persistent footer works from any active tab', async () => {
  const extension = await launchExtension();

  try {
    const popup = await openPopup(extension.context, extension.extensionId);

    // Move to the Backgrounds tab, fill a media URL, then save from the footer.
    await popup.locator('[role="tab"][data-tab="backgrounds"]').click();
    await popup.locator('#backgroundMediaUrls').fill('https://example.com/sample.gif');

    // Save button is always visible in the footer.
    await expect(popup.locator('#saveConfigButton')).toBeVisible();
    await popup.locator('#saveConfigButton').click();
    await expect(popup.locator('.status-message.success')).toBeVisible();

    // Persisted to localStorage.
    const stored = await popup.evaluate(() => localStorage.getItem('customBackgroundMediaUrls'));
    expect(stored).toBe('https://example.com/sample.gif');
  } finally {
    await extension.cleanup();
  }
});
