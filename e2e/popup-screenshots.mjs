import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from '@playwright/test';

const extensionPath = path.join(process.cwd(), '.output', 'chrome-mv3');
const outDir = path.join(process.cwd(), 'docs');

async function launchExtension() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'your-new-tab-screenshot-'));
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    viewport: { width: 900, height: 1100 },
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });
  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) serviceWorker = await context.waitForEvent('serviceworker');
  const extensionId = new URL(serviceWorker.url()).host;
  return {
    context,
    extensionId,
    cleanup: async () => {
      await context.close();
      fs.rmSync(userDataDir, { recursive: true, force: true });
    },
  };
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const ext = await launchExtension();
  try {
    const page = await ext.context.newPage();
    await page.setViewportSize({ width: 900, height: 1100 });
    await page.goto(`chrome-extension://${ext.extensionId}/popup.html`);
    await page.waitForSelector('[role="tab"][data-tab="bookmarks"]');

    await page.screenshot({ path: path.join(outDir, 'popup-tab-bookmarks.png'), fullPage: true });

    await page.locator('[role="tab"][data-tab="search"]').click();
    await page.waitForSelector('#defaultSearchProvider');
    await page.screenshot({ path: path.join(outDir, 'popup-tab-search.png'), fullPage: true });

    await page.locator('[role="tab"][data-tab="backgrounds"]').click();
    await page.waitForSelector('#backgroundMediaUrls');
    await page.screenshot({ path: path.join(outDir, 'popup-tab-backgrounds.png'), fullPage: true });
  } finally {
    await ext.cleanup();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
