import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium, test, expect } from '@playwright/test';

const extensionPath = path.join(process.cwd(), '.output', 'chrome-mv3');
const screenshotPath = path.join(process.cwd(), 'docs', 'screenshots', 'search-history-e2e.png');
const googleSearchUrl = 'http://127.0.0.1:4174/README.md?engine=google&q={query}';

async function launchExtension() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'your-new-tab-pw-'));
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

async function configureGoogleSearchUrl(popupPage) {
  await popupPage.locator('[role="tab"][data-tab="search"]').click();
  await popupPage.locator('.provider-card[data-provider-id="google"] .input-field').nth(1).fill(googleSearchUrl);
  await popupPage.locator('#defaultSearchProvider').selectOption('google');
  await popupPage.locator('.default-provider-row .secondary-button').click();
  await expect(popupPage.locator('.status-message.success')).toBeVisible();
}

async function performSearch(context, newTabPage, query) {
  await newTabPage.locator('.search-input').fill(query);
  const [searchPage] = await Promise.all([
    context.waitForEvent('page'),
    newTabPage.locator('.search-button').click(),
  ]);
  await searchPage.waitForLoadState('domcontentloaded');
  await searchPage.close();
}

test('records search history and navigates with arrow keys', async () => {
  fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
  const extension = await launchExtension();

  try {
    const popupPage = await openExtensionPage(extension.context, extension.extensionId, 'popup');
    await configureGoogleSearchUrl(popupPage);
    await popupPage.close();

    const newTabPage = await openExtensionPage(extension.context, extension.extensionId, 'newtab');
    await expect(newTabPage.locator('.search-box')).toBeVisible();

    await performSearch(extension.context, newTabPage, 'first query');
    await performSearch(extension.context, newTabPage, 'second query');
    await performSearch(extension.context, newTabPage, 'third query');

    const storedHistory = await newTabPage.evaluate(() => JSON.parse(localStorage.getItem('searchHistory') || '[]'));
    expect(storedHistory).toEqual(['third query', 'second query', 'first query']);

    const input = newTabPage.locator('.search-input');
    await expect(input).toHaveValue('');

    await input.focus();
    await input.press('ArrowUp');
    await expect(input).toHaveValue('third query');

    await input.press('ArrowUp');
    await expect(input).toHaveValue('second query');

    await input.press('ArrowUp');
    await expect(input).toHaveValue('first query');

    await input.press('ArrowUp');
    await expect(input).toHaveValue('first query');

    await input.press('ArrowDown');
    await expect(input).toHaveValue('second query');

    await newTabPage.screenshot({ path: screenshotPath, fullPage: true });

    await input.press('ArrowDown');
    await expect(input).toHaveValue('third query');

    await input.press('ArrowDown');
    await expect(input).toHaveValue('');
  } finally {
    await extension.cleanup();
  }
});

test('filters history by prefix when navigating with arrow keys', async () => {
  const extension = await launchExtension();

  try {
    const popupPage = await openExtensionPage(extension.context, extension.extensionId, 'popup');
    await configureGoogleSearchUrl(popupPage);
    await popupPage.close();

    const newTabPage = await openExtensionPage(extension.context, extension.extensionId, 'newtab');
    await expect(newTabPage.locator('.search-box')).toBeVisible();

    await performSearch(extension.context, newTabPage, 'apple pie');
    await performSearch(extension.context, newTabPage, 'banana split');
    await performSearch(extension.context, newTabPage, 'apple cider');
    await performSearch(extension.context, newTabPage, 'cherry tart');

    const input = newTabPage.locator('.search-input');
    await input.focus();
    await input.fill('apple');

    await input.press('ArrowUp');
    await expect(input).toHaveValue('apple cider');

    await input.press('ArrowUp');
    await expect(input).toHaveValue('apple pie');

    await input.press('ArrowUp');
    await expect(input).toHaveValue('apple pie');

    await input.press('ArrowDown');
    await expect(input).toHaveValue('apple cider');

    await input.press('ArrowDown');
    await expect(input).toHaveValue('apple');
  } finally {
    await extension.cleanup();
  }
});

test('caps stored history at 20 entries', async () => {
  const extension = await launchExtension();

  try {
    const newTabPage = await openExtensionPage(extension.context, extension.extensionId, 'newtab');
    await expect(newTabPage.locator('.search-box')).toBeVisible();

    await newTabPage.evaluate(() => {
      const items = [];
      for (let i = 0; i < 25; i += 1) {
        items.push(`query-${i}`);
      }
      localStorage.setItem('searchHistory', JSON.stringify(items));
    });

    const storedCount = await newTabPage.evaluate(() => JSON.parse(localStorage.getItem('searchHistory') || '[]').length);
    expect(storedCount).toBe(25);

    await newTabPage.evaluate(() => {
      const STORAGE_KEY = 'searchHistory';
      const MAX_HISTORY = 20;
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const next = ['fresh', ...current].slice(0, MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    });

    const trimmed = await newTabPage.evaluate(() => JSON.parse(localStorage.getItem('searchHistory') || '[]'));
    expect(trimmed.length).toBe(20);
    expect(trimmed[0]).toBe('fresh');
  } finally {
    await extension.cleanup();
  }
});
