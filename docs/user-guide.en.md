# User Guide

[中文版](./user-guide.md)

> This extension is positioned as an **AI-search-first** new tab page: open a new tab, type your question, and send it to your chosen AI/search provider in one keystroke. The AI search hub is covered first; backgrounds and bookmarks follow.

## AI search hub

The center of the new tab page is a unified AI search box, with the active provider's icon on the left:

- **Built-in providers**: Google AI Mode, Metaso, Grok, X. Grok and X require you to be logged in on those sites in your browser.
- **Bring your own**: open the popup and click *Add search provider*. Provide a name and a URL template that contains `{query}` as the placeholder. Examples:
  - ChatGPT search: `https://chatgpt.com/?q={query}`
  - Perplexity: `https://www.perplexity.ai/search?q={query}`
  - Any internal LLM gateway: `https://your-gateway.example.com/?q={query}`
- **Set a default**: mark any provider as default in the popup; new tabs open with it preselected. The most recent manual switch is also remembered.
- **One-click switching**: click the provider icon on the left of the search bar in the new tab to swap providers. Changes propagate to other open new tabs via `storage` events.
- **Privacy**: the extension does **not** proxy your query. Pressing Enter opens the provider's site directly in a new tab; the request is made by your browser.

## Bookmark configuration

The popup now keeps two bookmark source options:

- **Built-in bookmarks**: the default mode, using the developer-focused shortcuts bundled with the extension.
- **Paste bookmarks JSON directly**: import your own shortcut list, with formatting and minifying tools in the popup.

Bookmark data is stored locally in the browser's `localStorage`. Resetting the extension returns to the built-in bookmarks and does not fetch data from an external bookmark source.

### Search history

The new tab search box remembers your recent queries so you can recall them with arrow keys.

- Pressing **Enter** to run a search records the query into the local history.
- With the search box focused, press **ArrowUp** to walk back through history; keep pressing to reach older entries.
- Press **ArrowDown** to walk forward; reaching the bottom restores whatever you had typed before pressing arrow keys.
- Type part of a query first, then press arrow keys to navigate only the entries that **start with your current input** (case-insensitive prefix match).
- Up to **20 entries** are kept; newest queries are inserted at the top and the oldest entry is dropped when the cap is exceeded.
- History is persisted in `localStorage` under the `searchHistory` key on this machine only; clearing site data wipes it.

![Search history animated demo](./search-history-demo.gif)

> The clip first walks the full history with ArrowUp, then clears the input, types `apple`, and shows ArrowUp cycling only through entries that start with `apple`. Generated via `pnpm run demo:search-history` (Playwright frame capture + ImageMagick).

## Animated background effect

Once configured, the new tab page displays your media links as full-screen backgrounds:

- `GIF`, `APNG`, and `WebP` are rendered as animated image backgrounds.
- `MP4`, `WebM`, and `MOV` are rendered as muted looping video backgrounds.
- The clock, search box, and shortcuts stay in the foreground, with a dark overlay for readability.
- The windmill button in the lower-right corner switches through the configured background media links in order.
- If no animated background is configured, or a media link fails to load, the extension falls back to the default Unsplash/Picsum static background.

## How to use it

1. Open the extension popup.
2. Find the **Animated background media links (one per line)** field.
3. Paste one direct media link per line.
4. Click **Save**.
5. Open a new tab to see the updated background.

## Supported formats

- Animated images: `GIF`, `APNG`, `WebP`
- Animated video: `MP4`, `WebM`, `MOV`

## Media link requirements

- Use direct file links whenever possible, such as links ending in `.gif`, `.webm`, or `.mp4`.
- Media should be accessible without login, cookies, temporary authorization, or anti-hotlink protection.
- If the source blocks embedding, the extension will fall back to the default static background.

## Switching backgrounds

- Click the windmill button in the lower-right corner to switch to the next configured animated background.
- The extension remembers the current position locally.
- Clear the field and save, or click **Reset** in the popup, to return to the default static background rotation.

## Animated background E2E screenshot

The screenshot below comes from a **real extension environment** Playwright CLI E2E flow: the built extension is loaded, animated backgrounds are configured through the popup, the new tab is opened, and the test verifies that MP4 playback starts after switching.

![Animated background E2E screenshot](./screenshots/animated-background-e2e.png)

## Reproducing locally

### Start dev mode

```bash
pnpm run dev
```

### Reproduce the real extension E2E flow

From the repository root, run:

```bash
pnpm exec playwright install chromium
pnpm run check
```
