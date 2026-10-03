import { test, expect, enterJson, bookmarks, selectSettingsTab as select } from './helpers/extension.mjs';

const save = (page) => page.locator('#saveConfigButton');
const discard = (page) => page.locator('#discardConfigButton');

test('settings open on AI search and keyboard navigation selects each section', async ({ app }) => {
  const page = app.settings;
  await expect(page.locator('[data-tab-panel="search"]')).toBeVisible();
  await expect(save(page)).toBeDisabled();
  await page.locator('#nav-search').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#nav-bookmarks')).toBeFocused();
  await expect(page.locator('[data-tab-panel="bookmarks"]')).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.locator('#nav-anniversaries')).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.locator('#nav-search')).toBeFocused();
});

test('switching source modes, groups, sections and language preserves drafts until discarded', async ({ app }) => {
  const page = app.settings;
  await enterJson(page, bookmarks('External draft'));
  await page.locator('input[value="remote"]').check();
  await page.locator('#bookmarksUrl').fill('https://example.com/bookmarks.json');
  await page.locator('input[value="json"]').check();
  await expect(page.locator('#bookmarksJson')).toContainText('External draft');
  await page.locator('.bookmark-group-button').nth(1).click();
  await enterJson(page, bookmarks('Internal draft'));
  await select(page, 'backgrounds');
  await page.locator('#backgroundMediaUrls').fill('https://example.com/draft.mp4');
  await page.getByRole('button', { name: '中文', exact: true }).click();
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await select(page, 'bookmarks');
  await expect(page.locator('#bookmarksJson')).toContainText('Internal draft');
  await page.locator('.bookmark-group-button').nth(0).click();
  await expect(page.locator('#bookmarksJson')).toContainText('External draft');
  expect(await page.evaluate(() => localStorage.getItem('bookmarkGroup.external.bookmarksJson'))).toBeNull();
  await discard(page).click();
  await expect(page.locator('input[value="default"]')).toBeChecked();
  await page.locator('.bookmark-group-button').nth(1).click();
  await expect(page.locator('input[value="default"]')).toBeChecked();
  await select(page, 'backgrounds');
  await expect(page.locator('#backgroundMediaUrls')).toHaveValue('');
  await expect(save(page)).toBeDisabled();
});

test('restoring one bookmark group requires confirmation and preserves the other group and sections', async ({ app }) => {
  const page = app.settings;
  await enterJson(page, bookmarks('External saved'));
  await page.locator('#bookmarkGroupLabel').fill('Personal');
  await page.locator('.bookmark-group-button').nth(1).click();
  await enterJson(page, bookmarks('Internal saved'));
  await page.locator('#bookmarkGroupLabel').fill('Work');
  await select(page, 'backgrounds');
  await page.locator('#backgroundMediaUrls').fill('https://example.com/saved.gif');
  await save(page).click();
  await select(page, 'bookmarks');
  await page.locator('.reset-button').click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('#bookmarksJson')).toContainText('Internal saved');
  await expect(save(page)).toBeDisabled();
  await page.locator('.reset-button').click();
  await page.locator('#confirmRestoreButton').click();
  await expect(page.locator('input[value="default"]')).toBeChecked();
  await expect(page.locator('#bookmarkGroupLabel')).toHaveValue('');
  expect(await page.evaluate(() => localStorage.getItem('bookmarkGroup.internal.useDirectJson'))).toBe('true');
  await save(page).click();
  await page.reload();
  await select(page, 'bookmarks');
  await expect(page.locator('input[value="default"]')).toBeChecked();
  await page.locator('.bookmark-group-button').nth(0).click();
  await expect(page.locator('#bookmarkGroupLabel')).toHaveValue('Personal');
  await expect(page.locator('#bookmarksJson')).toContainText('External saved');
  await select(page, 'backgrounds');
  await expect(page.locator('#backgroundMediaUrls')).toHaveValue('https://example.com/saved.gif');
});

test('saving from another section reveals and focuses an invalid field in the hidden bookmark group', async ({ app }) => {
  const page = app.settings;
  await enterJson(page, '[{}]');
  await page.locator('.bookmark-group-button').nth(1).click();
  await select(page, 'backgrounds');
  await save(page).click();
  await expect(page.locator('[data-tab-panel="bookmarks"]')).toBeVisible();
  await expect(page.locator('.bookmark-group-button').nth(0)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#bookmarksJson')).toBeFocused();
  await expect(page.locator('#bookmarksJson-error')).toContainText('rows 1');
});

test('adding a search engine opens its editor and saving invalid hidden fields returns focus to the editor', async ({ app }) => {
  const page = app.settings;
  await page.getByRole('button', { name: 'Add search engine' }).click();
  const editor = page.locator('.provider-card').last();
  const name = editor.locator('input').nth(0);
  await expect(name).toBeFocused();
  await name.fill('My engine');
  await editor.locator('summary').click();
  await select(page, 'backgrounds');
  await save(page).click();
  await expect(page.locator('.provider-card').last().locator('input').nth(1)).toBeFocused();
  await page.locator('.provider-card').last().locator('input').nth(1).fill('https://example.com/?q={query}');
  await save(page).click();
  await page.reload();
  await expect(page.locator('.provider-card').last()).toContainText('My engine');
});

test('a failed save retains drafts for retry and unrelated changes preserve the last selected search engine', async ({ app }) => {
  const page = app.settings;
  await app.seed({ lastSearchProvider: 'metaso' });
  await select(page, 'backgrounds');
  await page.locator('#backgroundMediaUrls').fill('https://example.com/retry.mp4');
  await page.evaluate(() => {
    const set = Storage.prototype.setItem;
    window.restoreStorage = () => { Storage.prototype.setItem = set; };
    Storage.prototype.setItem = function (key, value) {
      if (key === 'customBackgroundMediaUrls') throw new DOMException('Full', 'QuotaExceededError');
      return set.call(this, key, value);
    };
  });
  await save(page).click();
  await expect(page.locator('.status-message.error')).toContainText('Could not save');
  await expect(save(page)).toBeEnabled();
  await expect(page.locator('#backgroundMediaUrls')).toHaveValue('https://example.com/retry.mp4');
  expect(await page.evaluate(() => localStorage.getItem('customBackgroundMediaUrls'))).toBeNull();
  await page.evaluate(() => window.restoreStorage());
  await save(page).click();
  await expect(save(page)).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem('lastSearchProvider'))).toBe('metaso');
  await page.reload();
  await select(page, 'backgrounds');
  await expect(page.locator('#backgroundMediaUrls')).toHaveValue('https://example.com/retry.mp4');
});

test('unsaved changes warn before leaving and discarding removes the warning', async ({ app }) => {
  const page = app.settings;
  await select(page, 'backgrounds');
  await page.locator('#backgroundMediaUrls').fill('https://example.com/unsaved.gif');
  const dialogEvent = page.waitForEvent('dialog');
  const leaving = page.goto('about:blank').catch(() => {});
  const dialog = await dialogEvent;
  expect(dialog.type()).toBe('beforeunload');
  await dialog.dismiss();
  await leaving;
  await expect(page.locator('#backgroundMediaUrls')).toHaveValue('https://example.com/unsaved.gif');
  await discard(page).click();
  await page.goto('about:blank');
  expect(page.url()).toBe('about:blank');
});

test('removing all dates shows an empty state and a newly added date can be edited and saved', async ({ app }) => {
  const page = app.settings;
  await select(page, 'anniversaries');
  while (await page.locator('.anniversary-editor-card').count()) {
    const card = page.locator('.anniversary-editor-card').first();
    await card.locator('summary').click();
    await card.getByRole('button', { name: 'Remove', exact: true }).click();
  }
  await expect(page.locator('.empty-state')).toBeVisible();
  await page.getByRole('button', { name: 'Add a date' }).click();
  await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toBeFocused();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Launch day');
  await page.getByLabel('Date', { exact: true }).fill('2027-03-21');
  await page.getByLabel('Calendar', { exact: true }).selectOption('lunar');
  await save(page).click();
  await page.reload();
  await select(page, 'anniversaries');
  await expect(page.locator('.anniversary-editor-card')).toHaveCount(1);
  await expect(page.locator('.anniversary-editor-card')).toContainText('Launch day');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('anniversaryItems'))[0].calendar)).toBe('lunar');
});

test('background URLs show media types and invalid line numbers without fetching previews', async ({ app }) => {
  const page = app.settings;
  const requests = [];
  page.on('request', (request) => { if (request.url().includes('example.com/')) requests.push(request.url()); });
  await select(page, 'backgrounds');
  await page.locator('#backgroundMediaUrls').fill('https://example.com/image.gif\n\ninvalid\nhttps://example.com/movie.mp4');
  await expect(page.locator('#backgroundMediaUrls-error')).toContainText('lines 3');
  await expect(page.locator('.media-list .badge')).toHaveText(['Image', '!', 'Video']);
  await save(page).click();
  await expect(page.locator('#backgroundMediaUrls')).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem('customBackgroundMediaUrls'))).toBeNull();
  expect(requests).toEqual([]);
});
