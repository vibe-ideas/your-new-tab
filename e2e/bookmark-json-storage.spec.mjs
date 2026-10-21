import fs from 'node:fs/promises';
import { test, expect, enterJson, selectSettingsTab } from './helpers/extension.mjs';

for (const [index, group] of ['external', 'internal'].entries()) {
  test(`saving formatted JSON in the ${group} bookmark group reduces storage without changing its data or editor draft`, async ({ app }) => {
    const data = [{
      id: 'unicode-bookmark', title: '中文  Bookmark',
      url: 'https://example.com/?q=hello%20world', category: 'Work  links',
      icon: 'https://example.com/icon.png',
      metadata: { note: 'Keep  spaces, "quotes", tabs\tand newlines\ninside strings', enabled: false, tags: [] },
    }];
    const formatted = JSON.stringify(data, null, 4);
    const page = app.settings;
    await selectSettingsTab(page, 'bookmarks');
    await page.locator('.bookmark-group-button').nth(index).click();
    await enterJson(page, formatted);
    const newtab = await app.open();
    await page.locator('#saveConfigButton').click();
    await expect(page.locator('.status-message.success')).toBeVisible();
    await expect(page.locator('#bookmarksJson')).toHaveValue(formatted);
    await expect(newtab.locator('.shortcut-label')).toHaveText(['中文  Bookmark']);

    const stored = await page.evaluate((group) => localStorage.getItem(`bookmarkGroup.${group}.bookmarksJson`), group);
    expect(JSON.parse(stored)).toEqual(data);
    expect(Buffer.byteLength(stored)).toBeLessThan(Buffer.byteLength(formatted));
    expect(stored).not.toContain('\n');

    await page.reload();
    await selectSettingsTab(page, 'bookmarks');
    expect(JSON.parse(await page.locator('#bookmarksJson').inputValue())).toEqual(data);
    await page.getByRole('button', { name: 'Format', exact: true }).click();
    await expect(page.locator('#bookmarksJson')).toHaveValue(JSON.stringify(data, null, 2));
    await page.locator('#discardConfigButton').click();
  });
}

test('importing and saving formatted bookmarks stores a compact copy while exporting readable JSON with the same bookmark fields', async ({ app }) => {
  const data = [{ id: 'imported', title: 'Imported bookmark', url: 'https://example.com/', icon: 'https://example.com/icon.png', category: 'Work' }];
  const page = app.settings;
  await enterJson(page, '[]');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'bookmarks.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data, null, 4)),
  });
  await page.locator('#saveConfigButton').click();
  await expect(page.locator('.status-message.success')).toBeVisible();
  const stored = await page.evaluate(() => localStorage.getItem('bookmarkGroup.external.bookmarksJson'));
  expect(JSON.parse(stored)).toEqual(data);
  expect(stored).not.toContain('\n');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export File', exact: true }).click(),
  ]);
  const exported = await fs.readFile(await download.path(), 'utf8');
  expect(JSON.parse(exported)).toEqual(data);
  expect(exported).toContain('\n');
});
