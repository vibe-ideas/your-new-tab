import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium, test, expect } from '@playwright/test';

const animatedBackgroundOne = 'http://127.0.0.1:4174/demo.gif?variant=1';
const animatedBackgroundTwo = 'http://127.0.0.1:4174/public/e2e-fixtures/flower.mp4';
const extensionPath = path.join(process.cwd(), '.output', 'chrome-mv3');
const screenshotPath = path.join(process.cwd(), 'docs', 'screenshots', 'animated-background-e2e.png');
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
