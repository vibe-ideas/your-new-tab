import { test, expect, bookmarks, enterJson, groupConfig, selectSettingsTab } from './helpers/extension.mjs';

test('toolbar launcher opens the full settings page', async ({ app }) => {
  const launcher = await app.open('popup');
  const [settings] = await Promise.all([
    app.context.waitForEvent('page'),
    launcher.getByRole('button', { name: 'Open Settings' }).click(),
  ]);
  await expect(settings).toHaveURL(`${app.origin}/settings.html`);
  await expect(settings.locator('#saveConfigButton')).toBeVisible();
});

test('footer Save retains search and background edits while saving drafts from both bookmark groups', async ({ app }) => {
  const page = app.settings;
  await selectSettingsTab(page, 'search');
  await page.locator('.provider-card[data-provider-id="google"] > summary').click();
  await page.locator('.provider-card[data-provider-id="google"] .input-field').first().fill('My Google');
  await page.locator('#defaultSearchProvider').selectOption('metaso');
  await selectSettingsTab(page, 'backgrounds');
  await page.locator('#backgroundMediaUrls').fill('https://example.com/my.gif');
  await enterJson(page, bookmarks('External draft'));
  await page.locator('.bookmark-group-button').nth(1).click();
  await enterJson(page, bookmarks('Internal draft'));
  await page.locator('.bookmark-group-button').nth(0).click();
  await expect(page.locator('#bookmarksJson')).toHaveValue(JSON.stringify(bookmarks('External draft')));
  await selectSettingsTab(page, 'search');
  await expect(page.locator('.provider-card[data-provider-id="google"] .input-field').first()).toHaveValue('My Google');
  await page.locator('#saveConfigButton').click();
  await expect(page.locator('.status-message.success')).toBeVisible();
  await page.reload();
  await selectSettingsTab(page, 'bookmarks');
  await expect(page.locator('#bookmarksJson')).toHaveValue(JSON.stringify(bookmarks('External draft')));
  await page.locator('.bookmark-group-button').nth(1).click();
  await expect(page.locator('#bookmarksJson')).toHaveValue(JSON.stringify(bookmarks('Internal draft')));
  await selectSettingsTab(page, 'search');
  await expect(page.locator('.provider-card[data-provider-id="google"] .input-field').first()).toHaveValue('My Google');
  await expect(page.locator('#defaultSearchProvider')).toHaveValue('metaso');
  await selectSettingsTab(page, 'backgrounds');
  await expect(page.locator('#backgroundMediaUrls')).toHaveValue('https://example.com/my.gif');
});

test('saving or importing invalid bookmark rows reports their position and keeps the last saved bookmarks', async ({ app }) => {
  await enterJson(app.settings, bookmarks('Valid bookmark'));
  await app.settings.locator('#saveConfigButton').click();
  const page = await app.open();
  await expect(page.locator('.shortcut-label')).toHaveText(['Valid bookmark']);
  for (const invalid of [[{}], [null], [{ id: 'bad', title: 3, url: 'https://example.com' }], [{ id: 'bad', title: 'Unsafe', url: 'javascript:alert(1)' }]]) {
    await enterJson(app.settings, invalid);
    await app.settings.locator('#saveConfigButton').click();
    await expect(app.settings.locator('#bookmarksJson-error')).toContainText('rows 1');
    await expect(page.locator('.shortcut-label')).toHaveText(['Valid bookmark']);
  }
  await app.settings.locator('input[type="file"]').setInputFiles({
    name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('[{},{}]'),
  });
  await expect(app.settings.locator('.status-message.error')).toContainText('rows 1, 2');
  await app.settings.locator('#discardConfigButton').click();
  await app.settings.reload();
  await selectSettingsTab(app.settings, 'bookmarks');
  await expect(app.settings.locator('#bookmarksJson')).toHaveValue(JSON.stringify(bookmarks('Valid bookmark')));
});

test('malformed stored bookmarks keep search usable and fall back to the last valid list', async ({ app }) => {
  await app.seed(groupConfig('external', { json: bookmarks('Last valid') }));
  const page = await app.open();
  await expect(page.locator('.shortcut-label')).toHaveText(['Last valid']);
  for (const json of [[{}], [null], { error: 'not an array' }]) {
    await app.seed(groupConfig('external', { json }));
    await expect(page.locator('.shortcut-label')).toHaveText(['Last valid']);
    await expect(page.locator('.newtab-toast')).toBeVisible();
    await expect(page.locator('.search-input')).toBeVisible();
    await expect(page.locator('.newtab-error-screen')).toHaveCount(0);
  }
  await app.seed(groupConfig('external', { json: [...bookmarks('Good row'), {}] }));
  await expect(page.locator('.shortcut-label')).toHaveText(['Good row']);
});

test('refreshing remote bookmarks in two open tabs updates both without repeated requests', async ({ app }) => {
  let requests = 0;
  let title = 'Initial remote';
  await app.context.route('https://example.com/bookmarks.json', async (route) => {
    requests += 1;
    await new Promise((resolve) => setTimeout(resolve, 30));
    await route.fulfill({ json: bookmarks(title), headers: { 'access-control-allow-origin': '*' } });
  });
  await app.seed(groupConfig('external', { url: 'https://example.com/bookmarks.json' }));
  const first = await app.open();
  await expect(first.locator('.shortcut-label')).toHaveText(['Initial remote']);
  const second = await app.open();
  await expect(second.locator('.shortcut-label')).toHaveText(['Initial remote']);
  expect(requests).toBe(1);
  title = 'Refreshed remote';
  await selectSettingsTab(app.settings, 'bookmarks');
  await app.settings.getByRole('button', { name: /^Refresh saved bookmarks$/i }).click();
  await expect(first.locator('.shortcut-label')).toHaveText(['Refreshed remote']);
  await expect(second.locator('.shortcut-label')).toHaveText(['Refreshed remote']);
  // Observe beyond several network round trips to detect cache-event request loops.
  await first.waitForTimeout(1000);
  expect(requests).toBe(3);
});

test('switching groups during a slow remote request keeps the newly selected group visible', async ({ app }) => {
  let release;
  let requested = false;
  const pending = new Promise((resolve) => { release = resolve; });
  await app.context.route('https://example.com/slow.json', async (route) => {
    requested = true;
    await pending;
    await route.fulfill({ json: bookmarks('Old remote'), headers: { 'access-control-allow-origin': '*' } }).catch(() => {});
  });
  await app.seed({
    ...groupConfig('external', { url: 'https://example.com/slow.json' }),
    ...groupConfig('internal', { json: bookmarks('Internal selected') }),
  });
  const page = await app.open();
  await expect.poll(() => requested).toBe(true);
  await page.locator('.bookmark-group-toggle-button').nth(1).click();
  await expect(page.locator('.shortcut-label')).toHaveText(['Internal selected']);
  release();
  await page.waitForTimeout(250);
  await expect(page.locator('.shortcut-label')).toHaveText(['Internal selected']);
  expect(await page.evaluate(() => localStorage.getItem('bookmarkGroup.external.bookmarksData'))).toBeNull();
});

test('changing the remote bookmark URL fetches the new source even when the old cache is from today', async ({ app }) => {
  await app.context.route('https://example.com/*.json', (route) => route.fulfill({
    json: bookmarks(route.request().url().endsWith('new.json') ? 'New source' : 'Old source'),
    headers: { 'access-control-allow-origin': '*' },
  }));
  await app.seed(groupConfig('external', { url: 'https://example.com/old.json' }));
  const first = await app.open();
  await expect(first.locator('.shortcut-label')).toHaveText(['Old source']);
  await first.close();
  await app.seed(groupConfig('external', { url: 'https://example.com/new.json' }));
  const second = await app.open();
  await expect(second.locator('.shortcut-label')).toHaveText(['New source']);
});

test('a failed or malformed remote refresh retains the last valid bookmarks', async ({ app }) => {
  let mode = 'valid';
  await app.context.route('https://example.com/bookmarks.json', async (route) => {
    await route.fulfill({
      status: mode === 'offline' ? 503 : 200,
      json: mode === 'malformed' ? { error: 'unavailable' } : bookmarks('Cached remote'),
      headers: { 'access-control-allow-origin': '*' },
    });
  });
  await app.seed(groupConfig('external', { url: 'https://example.com/bookmarks.json' }));
  const page = await app.open();
  await expect(page.locator('.shortcut-label')).toHaveText(['Cached remote']);
  for (const failure of ['offline', 'malformed']) {
    mode = failure;
    await selectSettingsTab(app.settings, 'bookmarks');
  await app.settings.getByRole('button', { name: /^Refresh saved bookmarks$/i }).click();
    await expect(page.locator('.newtab-toast')).toContainText(failure === 'offline' ? 'Could not load bookmarks' : 'should be an array');
    await expect(page.locator('.shortcut-label')).toHaveText(['Cached remote']);
    await expect(page.locator('.search-input')).toBeVisible();
  }
});

test('provider menu keeps the keyboard highlight across clock ticks and selects it with Enter', async ({ app }) => {
  const page = await app.open();
  await page.locator('.search-provider-icon').click();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.provider-popover-item.highlighted')).toHaveAttribute('data-provider-id', 'metaso');
  const before = await page.locator('.time').textContent();
  await expect(page.locator('.time')).not.toHaveText(before);
  await expect(page.locator('.provider-popover-item.highlighted')).toHaveAttribute('data-provider-id', 'metaso');
  await page.keyboard.press('Enter');
  await expect(page.locator('.search-provider-icon')).toHaveAttribute('data-provider-id', 'metaso');
  await expect(page.locator('.search-input')).toBeFocused();
});

test('Tab leaves the search input and keyboard users can open a bookmark while Alt+arrows switch providers', async ({ app }) => {
  await app.seed(groupConfig('external', { json: bookmarks('Keyboard bookmark') }));
  await app.context.route('https://example.com/', (route) => route.fulfill({ body: 'Bookmark destination' }));
  const page = await app.open();
  await page.locator('.search-input').focus();
  await page.keyboard.press('Alt+ArrowDown');
  await expect(page.locator('.search-provider-icon')).toHaveAttribute('data-provider-id', 'metaso');
  await page.keyboard.press('Tab');
  await expect(page.locator('.search-button')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Keyboard bookmark' })).toBeFocused();
  const [destination] = await Promise.all([app.context.waitForEvent('page'), page.keyboard.press('Enter')]);
  await expect(destination).toHaveURL('https://example.com/');
  expect(await destination.evaluate(() => window.opener)).toBeNull();
  await page.locator('.search-input').focus();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('.search-provider-icon')).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.locator('.search-input')).toBeFocused();
  await expect(page.locator('.provider-popover')).toHaveCount(0);
});
