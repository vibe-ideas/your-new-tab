# Privacy Policy

Your New Tab is an AI-search-first new tab page: it provides a unified search box that forwards your query to the AI / search provider you selected (Google AI Mode, Metaso, Grok, X, or any provider you add yourself). The extension also offers a configurable clock, shortcut grid, and background.

## Configuration Sync and Local Storage

The extension keeps a local copy of configuration and sends saved custom configuration to the browser's `storage.sync` area. Chrome transfers this data through the user's Google account when browser sync is enabled; Firefox uses the user's Mozilla account. This is browser-managed synchronization, not a developer-operated service. The extension cannot determine whether cloud transfer has completed.

Synced data includes custom bookmark groups and labels (including any custom icons), bookmark source URLs, customized search providers and the default provider, custom background URLs, dates and their notes, and language preference. Unmodified built-in bookmarks and providers are supplied by the extension rather than copied into sync storage. Remote bookmark contents are fetched on each device; only their configured source URL is synced.

The following data remains on the device:

- Cached bookmark data
- The last selected search provider and active bookmark group
- Search history entered in the new tab search box
- The selected background index
- Cached default background image data

An initial configuration backup, a local working copy, and pending sync writes are kept in `storage.local`. You can export the pre-sync backup from Settings. Failed writes retain your local settings and can be retried from Settings or when an extension page is opened again. This data is used only to render and configure the new tab page.

## Data Sent to Third Parties

The extension does not send data to the developer's servers.

Some features contact third-party services directly from the user's browser:

- **Configuration sync**: the browser transfers the configuration described above to its account-sync service when enabled, according to the browser provider's policies. Signing into a search provider's website alone does not enable browser sync.

- **Search**: pressing Enter in the search box opens the selected provider's URL with the user's query in a new tab. The query is sent only to the provider the user explicitly selected (built-in: Google AI, Metaso, Grok, X — or any provider the user added). The extension does not proxy the request through any backend; the browser contacts the provider directly.
- The default static background feature requests images from Unsplash or Picsum.
- If the user configures custom animated background media links, the browser requests those links to load the configured content.

Those third-party services may receive standard request metadata such as IP address, user agent, and the requested URL according to their own policies.

## Remote Code

The extension does not fetch or execute remote code. Custom background content is treated as data for display.

## Data Sharing

The extension does not sell data or send it to the developer. Browser account sync and the user-directed requests described above may send data to their respective providers.

## Data Removal

Saving a section's restored defaults syncs that reset to other devices. Search history and caches can be removed by clearing the extension's local site data. The pre-sync backup and pending writes are in extension local storage and are removed on uninstall. Clearing local site data alone does not remove synced settings; they can be restored from the browser's sync area. Manage account-side sync data through the browser's settings.
