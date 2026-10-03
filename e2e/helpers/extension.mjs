import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium, test as base, expect } from '@playwright/test';

export const oldImage = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><path fill="red" d="M0 0h2v2H0z"/></svg>').toString('base64');
export const newSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><path fill="blue" d="M0 0h2v2H0z"/></svg>';
export const newImage = 'data:image/svg+xml;base64,' + Buffer.from(newSvg).toString('base64');
export const bookmarks = (title) => [{ id: title, title, url: 'https://example.com/' }];

export const test = base.extend({
  app: async ({}, use) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'newtab-reliability-'));
    const extensionPath = path.resolve('.output/chrome-mv3');
    const context = await chromium.launchPersistentContext(dir, {
      channel: 'chromium', headless: true, locale: 'en-US',
      viewport: { width: 1440, height: 960 },
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    try {
      const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
      const origin = `chrome-extension://${new URL(worker.url()).host}`;
      const open = async (name = 'newtab') => {
        const page = await context.newPage();
        await page.goto(`${origin}/${name}.html`);
        return page;
      };
      // Exercise the actual background message handler with deterministic image responses.
      await worker.evaluate((svg) => {
        const originalFetch = globalThis.fetch;
        globalThis.imageRequests = [];
        globalThis.imageMode = 'success';
        globalThis.fetch = async (url, options) => {
          if (!/unsplash|picsum/.test(String(url))) return originalFetch(url, options);
          globalThis.imageRequests.push(String(url));
          if (globalThis.imageMode === 'fail') throw new Error('Image server unavailable');
          if (globalThis.imageMode === 'hold') {
            await new Promise((resolve) => { globalThis.releaseImage = resolve; });
          }
          if (globalThis.imageMode === 'slow-primary' && String(url).includes('unsplash')) {
            await new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true }));
          }
          return new Response(svg, { headers: { 'content-type': 'image/svg+xml' } });
        };
      }, newSvg);
      const settings = await open('settings');
      const seed = (values) => settings.evaluate((entries) => {
        for (const [key, value] of Object.entries(entries)) {
          if (value === null) localStorage.removeItem(key);
          else localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        }
      }, values);
      await seed({ language: 'en', backgroundImage: { base64: oldImage, timestamp: Date.now() } });
      await use({ context, worker, settings, open, seed, origin });
    } finally {
      await context.close();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  },
});

export { expect };

export async function selectSettingsTab(page, name) {
  await page.locator(`[role="tab"][data-tab="${name}"]`).click();
}

export async function enterJson(page, data) {
  await selectSettingsTab(page, 'bookmarks');
  const mode = page.locator('.source-option').filter({ hasText: 'JSON data' });
  if (!(await mode.locator('input').isChecked())) await mode.click();
  await page.locator('#bookmarksJson').fill(typeof data === 'string' ? data : JSON.stringify(data));
}

export function groupConfig(group, { json, url }) {
  return {
    [`bookmarkGroup.${group}.useDefaultBookmarks`]: 'false',
    [`bookmarkGroup.${group}.useDirectJson`]: json === undefined ? 'false' : 'true',
    [`bookmarkGroup.${group}.bookmarksJson`]: JSON.stringify(json ?? []),
    [`bookmarkGroup.${group}.bookmarksUrl`]: url ?? '',
  };
}
