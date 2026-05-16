import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium, test, expect } from '@playwright/test';

const animatedBackgroundOne = 'http://127.0.0.1:4174/demo.gif?variant=1';
const animatedBackgroundTwo = 'http://127.0.0.1:4174/public/e2e-fixtures/flower.mp4';
const extensionPath = path.join(process.cwd(), '.output', 'chrome-mv3');
const screenshotPath = path.join(process.cwd(), 'docs', 'screenshots', 'animated-background-e2e.png');
const googleSearchUrl = 'http://127.0.0.1:4174/README.md?engine=google&q={query}';
const metasoSearchUrl = 'http://127.0.0.1:4174/CHANGELOG.md?engine=metaso&q={query}';
const directJsonBookmarks = JSON.stringify([
  {
    id: 'json-demo-1',
    title: 'JSON Demo',
    url: 'https://example.com',
  },
  {
    id: 'json-demo-2',
    title: 'Claude Style',
    url: 'https://anthropic.com',
  },
], null, 2);

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

async function configureSearchProviders(popupPage) {
  await popupPage.locator('.provider-card[data-provider-id="google"] .input-field').nth(1).fill(googleSearchUrl);
  await popupPage.locator('.provider-card[data-provider-id="metaso"] .input-field').nth(1).fill(metasoSearchUrl);
}

async function seedLegacyMetasoOnlySearchConfig(page) {
  await page.evaluate(({ legacySearchProviders, defaultProviderId, lastProviderId }) => {
    localStorage.setItem('searchProviders', JSON.stringify(legacySearchProviders));
    localStorage.setItem('defaultSearchProvider', defaultProviderId);
    localStorage.setItem('lastSearchProvider', lastProviderId);
  }, {
    legacySearchProviders: [
      { id: 'metaso', name: 'Metaso', urlTemplate: metasoSearchUrl, capability: 'stable', enabled: true, useProxy: false },
    ],
    defaultProviderId: 'metaso',
    lastProviderId: 'metaso',
  });
}

test('accepts direct JSON bookmark configuration and renders custom bookmarks', async () => {
  const extension = await launchExtension();

  try {
    const popupPage = await openExtensionPage(extension.context, extension.extensionId, 'popup');
    await popupPage.locator('.toggle-card').filter({ hasText: /直接粘贴书签 JSON|Paste Bookmarks JSON Directly/ }).click();

    const jsonTextarea = popupPage.locator('#bookmarksJson');
    await expect(jsonTextarea).toBeVisible();
    await jsonTextarea.fill(directJsonBookmarks);
    await expect(jsonTextarea).toHaveValue(/JSON Demo/);

    await popupPage.locator('#saveConfigButton').click();
    await expect(popupPage.locator('.status-message.success')).toBeVisible();

    const newTabPage = await openExtensionPage(extension.context, extension.extensionId, 'newtab');
    await expect(newTabPage.locator('.shortcut-label')).toContainText(['JSON Demo', 'Claude Style']);
  } finally {
    await extension.cleanup();
  }
});

test('applies the saved default search provider in new tab searches', async () => {
  const extension = await launchExtension();

  try {
    const popupPage = await openExtensionPage(extension.context, extension.extensionId, 'popup');
    await configureSearchProviders(popupPage);
    await popupPage.locator('#defaultSearchProvider').selectOption('metaso');
    await popupPage.locator('.default-provider-row .secondary-button').click();
    await expect(popupPage.locator('.status-message.success')).toBeVisible();

    const newTabPage = await openExtensionPage(extension.context, extension.extensionId, 'newtab');
    await expect(newTabPage.locator('.search-provider-icon')).toHaveAttribute('data-provider-id', 'metaso');
    await expect(newTabPage.locator('.search-provider-name')).toHaveText('Metaso');
    await newTabPage.locator('.search-provider-icon').click();
    await expect(newTabPage.locator('.provider-popover-item.active')).toContainText('Metaso');

    const searchQuery = 'default provider regression';
    await newTabPage.locator('.search-input').fill(searchQuery);
    const [searchPage] = await Promise.all([
      extension.context.waitForEvent('page'),
      newTabPage.locator('.search-button').click(),
    ]);

    await searchPage.waitForLoadState('domcontentloaded');
    await expect(searchPage).toHaveURL(new RegExp(`engine=metaso.*q=${encodeURIComponent(searchQuery)}`));
  } finally {
    await extension.cleanup();
  }
});

test('switches search providers from the new tab menu and remembers the selection', async () => {
  const extension = await launchExtension();

  try {
    const popupPage = await openExtensionPage(extension.context, extension.extensionId, 'popup');
    await configureSearchProviders(popupPage);
    await popupPage.locator('#defaultSearchProvider').selectOption('google');
    await popupPage.locator('.default-provider-row .secondary-button').click();
    await expect(popupPage.locator('.status-message.success')).toBeVisible();

    const newTabPage = await openExtensionPage(extension.context, extension.extensionId, 'newtab');
    await expect(newTabPage.locator('.search-provider-icon')).toHaveAttribute('data-provider-id', 'google');
    await expect(newTabPage.locator('.search-provider-name')).toHaveText('Google AI');
    await newTabPage.locator('.search-provider-icon').click();
    await newTabPage.locator('.provider-popover-item[data-provider-id="metaso"]').click();
    await expect(newTabPage.locator('.search-provider-icon')).toHaveAttribute('data-provider-id', 'metaso');
    await expect(newTabPage.locator('.search-provider-name')).toHaveText('Metaso');
    await newTabPage.locator('.search-provider-icon').click();
    await expect(newTabPage.locator('.provider-popover-item.active')).toContainText('Metaso');

    const searchQuery = 'switched provider regression';
    await newTabPage.locator('.search-input').fill(searchQuery);
    const [searchPage] = await Promise.all([
      extension.context.waitForEvent('page'),
      newTabPage.locator('.search-button').click(),
    ]);

    await searchPage.waitForLoadState('domcontentloaded');
    await expect(searchPage).toHaveURL(new RegExp(`engine=metaso.*q=${encodeURIComponent(searchQuery)}`));

    const reloadedNewTabPage = await openExtensionPage(extension.context, extension.extensionId, 'newtab');
    await expect(reloadedNewTabPage.locator('.search-provider-icon')).toHaveAttribute('data-provider-id', 'metaso');
    await expect(reloadedNewTabPage.locator('.search-provider-name')).toHaveText('Metaso');
    await reloadedNewTabPage.locator('.search-provider-icon').click();
    await expect(reloadedNewTabPage.locator('.provider-popover-item.active')).toContainText('Metaso');
  } finally {
    await extension.cleanup();
  }
});

test('repairs legacy metaso-only search config in popup and new tab', async () => {
  const extension = await launchExtension();

  try {
    const popupPage = await openExtensionPage(extension.context, extension.extensionId, 'popup');
    await seedLegacyMetasoOnlySearchConfig(popupPage);
    await popupPage.reload();

    await expect(popupPage.locator('.provider-card[data-provider-id="google"]')).toBeVisible();
    await expect(popupPage.locator('.provider-card[data-provider-id="metaso"]')).toBeVisible();
    await expect(popupPage.locator('#defaultSearchProvider')).toHaveValue('google');

    const repairedPopupConfig = await popupPage.evaluate(() => ({
      providers: JSON.parse(localStorage.getItem('searchProviders') || '[]').map((provider) => provider.id),
      defaultProviderId: localStorage.getItem('defaultSearchProvider'),
      lastProviderId: localStorage.getItem('lastSearchProvider'),
    }));
    expect(repairedPopupConfig).toEqual({
      providers: ['google', 'metaso', 'x', 'grok'],
      defaultProviderId: 'google',
      lastProviderId: 'google',
    });

    const newTabPage = await openExtensionPage(extension.context, extension.extensionId, 'newtab');
    await expect(newTabPage.locator('.search-provider-icon')).toHaveAttribute('data-provider-id', 'google');
    await expect(newTabPage.locator('.search-provider-name')).toHaveText('Google AI');
    await newTabPage.locator('.search-provider-icon').click();
    await expect(newTabPage.locator('.provider-popover-item')).toHaveCount(4);
    await expect(newTabPage.locator('.provider-popover-item').nth(0)).toContainText('Google AI');
    await expect(newTabPage.locator('.provider-popover-item').nth(1)).toContainText('Metaso');
    await expect(newTabPage.locator('.provider-popover-item').nth(2)).toContainText('X');
    await expect(newTabPage.locator('.provider-popover-item').nth(3)).toContainText('Grok');
  } finally {
    await extension.cleanup();
  }
});

test('configures and plays animated backgrounds in the real extension', async () => {
  fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });

  const extension = await launchExtension();

  try {
    const popupPage = await openExtensionPage(extension.context, extension.extensionId, 'popup');
    await popupPage.locator('#backgroundMediaUrls').fill(`${animatedBackgroundOne}\n${animatedBackgroundTwo}`);
    await popupPage.locator('#saveConfigButton').click();
    await expect(popupPage.locator('.status-message.success')).toBeVisible();

    const newTabPage = await openExtensionPage(extension.context, extension.extensionId, 'newtab');

    await expect(newTabPage.locator('.time-display')).toBeVisible();
    await expect(newTabPage.locator('.search-box')).toBeVisible();

    await expect(newTabPage.locator('img.background-media')).toHaveAttribute('src', /variant=1/);

    await newTabPage.locator('.windmill-button').click();

    const video = newTabPage.locator('video.background-media');
    await expect(video).toHaveAttribute('src', /flower\.mp4/);
    await expect
      .poll(async () => video.evaluate((element) => ({
        paused: element.paused,
        currentTime: element.currentTime,
      })), {
        timeout: 10000,
      })
      .toMatchObject({
        paused: false,
      });

    await expect
      .poll(async () => video.evaluate((element) => element.currentTime), {
        timeout: 10000,
      })
      .toBeGreaterThan(0.1);

    await newTabPage.screenshot({ path: screenshotPath, fullPage: true });
  } finally {
    await extension.cleanup();
  }
});
