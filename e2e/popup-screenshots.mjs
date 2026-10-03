import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';

const extensionPath = path.resolve('.output/chrome-mv3');
const outDir = path.resolve('docs/screenshots/settings-redesign');
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'your-new-tab-settings-'));
const context = await chromium.launchPersistentContext(userDataDir, {
  channel: 'chromium', headless: true, locale: 'en-US', reducedMotion: 'reduce',
  viewport: { width: 1440, height: 1000 },
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
});
try {
  fs.mkdirSync(outDir, { recursive: true });
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  const page = await context.newPage();
  await page.goto(`chrome-extension://${new URL(worker.url()).host}/settings.html`);
  let checks = 0;
  for (const language of ['zh', 'en']) {
    await page.getByRole('button', { name: language === 'en' ? 'EN' : '中文', exact: true }).click();
    // chrome.tabs.setZoom exercises actual browser zoom, including media queries.
    for (const [size, width, height, zoom] of [['desktop', 1440, 1000, 1], ['tablet', 768, 1024, 1], ['mobile', 320, 760, 1], ['zoom-200', 1440, 1000, 2]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(async (factor) => {
        const tab = await chrome.tabs.getCurrent();
        await chrome.tabs.setZoom(tab.id, factor);
      }, zoom);
      for (const section of ['search', 'bookmarks', 'backgrounds', 'anniversaries']) {
        await page.locator(`[data-tab="${section}"]`).click();
        if (section === 'search') await page.locator('.provider-card').first().locator('summary').click();
        if (section === 'bookmarks') await page.locator('input[value="json"]').check();
        if (section === 'anniversaries') await page.locator('.anniversary-editor-card').first().locator('summary').click();
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.mouse.move(0, 0);
        await expect(page.locator(`[data-tab="${section}"]`)).toHaveAttribute('aria-selected', 'true');
        const dimensions = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
        expect(dimensions.scrollWidth, `${language} ${size} ${section} overflow`).toBeLessThanOrEqual(dimensions.width);
        await page.screenshot({ path: path.join(outDir, `${language}-${section}-${size}.png`) });
        await page.locator('.reset-button').scrollIntoViewIfNeeded();
        const reset = await page.locator('.reset-button').boundingBox();
        const footer = await page.locator('.save-bar').boundingBox();
        expect(reset.y + reset.height, `${language} ${size} ${section} reset hidden by save bar`).toBeLessThanOrEqual(footer.y + 1);
        await expect(page.locator('#saveConfigButton')).toBeInViewport();
        if (size === 'mobile') await page.screenshot({ path: path.join(outDir, `${language}-${section}-${size}-bottom.png`) });
        await page.locator('#discardConfigButton').evaluate((button) => { if (!button.disabled) button.click(); });
        checks++;
      }
    }
  }
  console.log(`${checks} settings layouts checked (two languages, three widths, actual 200% browser zoom). Screenshots: ${outDir}`);
} finally {
  await context.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
}
