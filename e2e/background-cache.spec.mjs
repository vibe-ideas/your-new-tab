import { test, expect, oldImage, newImage } from './helpers/extension.mjs';

test('opening a new tab reuses today’s cached background without requesting an image', async ({ app }) => {
  const page = await app.open();
  await expect(page.locator('img.background-media')).toHaveAttribute('src', oldImage);
  expect(await app.worker.evaluate(() => imageRequests.length)).toBe(0);
});

test('an expired background stays visible until its replacement loads and is cached', async ({ app }) => {
  await app.seed({ backgroundImage: { base64: oldImage, timestamp: 1 } });
  await app.worker.evaluate(() => { imageMode = 'hold'; });
  const page = await app.open();
  await expect(page.locator('img.background-media')).toHaveAttribute('src', oldImage);
  await expect.poll(() => app.worker.evaluate(() => typeof releaseImage)).toBe('function');
  await app.worker.evaluate(() => releaseImage());
  await expect(page.locator('img.background-media')).toHaveAttribute('src', newImage);
  const cached = await page.evaluate(() => JSON.parse(localStorage.getItem('backgroundImage')));
  expect(cached.base64).toBe(newImage);
  expect(new Date(cached.timestamp).toDateString()).toBe(new Date().toDateString());
});

test('failed automatic and manual background refreshes keep the previously displayed image', async ({ app }) => {
  await app.seed({ backgroundImage: { base64: oldImage, timestamp: 1 } });
  await app.worker.evaluate(() => { imageMode = 'fail'; });
  const page = await app.open();
  await expect.poll(() => app.worker.evaluate(() => imageRequests.length)).toBe(3);
  await expect(page.locator('img.background-media')).toHaveAttribute('src', oldImage);
  await page.locator('.windmill-button').click();
  await expect.poll(() => app.worker.evaluate(() => imageRequests.length)).toBe(6);
  await expect(page.locator('.windmill-button')).toBeEnabled();
  await expect(page.locator('img.background-media')).toHaveAttribute('src', oldImage);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('backgroundImage')).base64)).toBe(oldImage);
});

test('background fallback completes after the primary image source reaches its timeout', async ({ app }) => {
  await app.worker.evaluate(() => { imageMode = 'slow-primary'; });
  const page = await app.open();
  await page.locator('.windmill-button').click();
  await expect(page.locator('img.background-media')).toHaveAttribute('src', newImage, { timeout: 10000 });
  const requests = await app.worker.evaluate(() => imageRequests);
  expect(requests).toHaveLength(2);
  expect(requests[0]).toContain('unsplash');
  expect(requests[1]).toContain('picsum');
});

test('a new background remains visible when local storage is full', async ({ app }) => {
  const page = await app.open();
  await expect(page.locator('img.background-media')).toHaveAttribute('src', oldImage);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'backgroundImage') throw new DOMException('Storage full', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.locator('.windmill-button').click();
  await expect(page.locator('img.background-media')).toHaveAttribute('src', newImage);
  await expect(page.locator('.windmill-button')).toBeEnabled();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('backgroundImage')).base64)).toBe(oldImage);
});

test('a corrupt background cache is replaced without preventing search from loading', async ({ app }) => {
  await app.seed({ backgroundImage: '{broken-json' });
  const page = await app.open();
  await expect(page.locator('.search-input')).toBeVisible();
  await expect(page.locator('img.background-media')).toHaveAttribute('src', newImage);
});

test('a tab left open across midnight refreshes its daily background', async ({ app }) => {
  const beforeMidnight = new Date();
  beforeMidnight.setHours(23, 59, 59, 0);
  await app.seed({ backgroundImage: { base64: oldImage, timestamp: beforeMidnight.getTime() } });
  const page = await app.context.newPage();
  await page.clock.install({ time: beforeMidnight });
  await page.goto(`${app.origin}/newtab.html`);
  await expect(page.locator('img.background-media')).toHaveAttribute('src', oldImage);
  await page.clock.runFor(1500);
  await expect(page.locator('img.background-media')).toHaveAttribute('src', newImage);
  expect(await app.worker.evaluate(() => imageRequests.length)).toBe(1);
});
