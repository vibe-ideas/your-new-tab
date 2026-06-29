import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium, test, expect } from '@playwright/test';

const extensionPath = path.join(process.cwd(), '.output', 'chrome-mv3');

async function launchExtension() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'your-new-tab-pw-anniversary-'));
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

test('anniversary island stays at the top, expands on hover, and renders lunar repeats', async () => {
  const extension = await launchExtension();

  try {
    const newTabPage = await openExtensionPage(extension.context, extension.extensionId, 'newtab');
    const sidebar = newTabPage.locator('.anniversary-sidebar');
    const summary = newTabPage.locator('.anniversary-island-summary');
    const panel = newTabPage.locator('.anniversary-panel');
    await expect(sidebar).toBeVisible();
    await expect(sidebar).not.toHaveClass(/is-pinned-soon/);
    await expect(summary).toBeVisible();

    const tuckedBox = await summary.boundingBox();
    expect(tuckedBox.y).toBeLessThan(40);
    expect(tuckedBox.x).toBeGreaterThan(300);
    expect((await panel.boundingBox()).height).toBeLessThan(40);

    await sidebar.hover();
    await expect.poll(async () => (await panel.boundingBox()).height).toBeGreaterThan(100);

    await newTabPage.evaluate(() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const date = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
      localStorage.setItem('anniversaryItems', JSON.stringify([
        {
          id: 'tomorrow-trip',
          title: 'Tomorrow trip',
          date,
          type: 'travel',
          calendar: 'lunar',
          recurring: true,
          note: 'Pack documents',
        },
      ]));
      window.location.reload();
    });

    await expect(sidebar).toHaveClass(/is-pinned-soon/);
    await expect.poll(async () => (await panel.boundingBox()).height).toBeGreaterThan(100);
    await expect(sidebar.locator('.anniversary-card-title')).toHaveText('Tomorrow trip');
    await expect(sidebar.locator('.anniversary-card-meta')).toContainText(/Lunar|农历/);
    const pinnedBox = await summary.boundingBox();
    expect(pinnedBox.y).toBeLessThan(40);
  } finally {
    await extension.cleanup();
  }
});
