# User Guide

[中文版](./user-guide.md)

## Animated background effect

Once configured, the new tab page displays your media URLs as full-screen backgrounds:

- `GIF`, `APNG`, and `WebP` are rendered as animated image backgrounds.
- `MP4`, `WebM`, and `MOV` are rendered as muted looping video backgrounds.
- The clock, search box, and shortcuts stay in the foreground, with a dark overlay for readability.
- The windmill button in the lower-right corner switches through the configured background URLs in order.
- If no animated background is configured, or a media URL fails to load, the extension falls back to the default Unsplash/Picsum static background.

## How to use it

1. Open the extension popup.
2. Find the **Animated background URLs (one per line)** field.
3. Paste one direct media URL per line.
4. Click **Save**.
5. Open a new tab to see the updated background.

## Supported formats

- Animated images: `GIF`, `APNG`, `WebP`
- Animated video: `MP4`, `WebM`, `MOV`

## URL requirements

- Use direct file URLs whenever possible, such as links ending in `.gif`, `.webm`, or `.mp4`.
- Media should be accessible without login, cookies, temporary authorization, or anti-hotlink protection.
- If the source blocks embedding, the extension will fall back to the default static background.

## Switching backgrounds

- Click the windmill button in the lower-right corner to switch to the next configured animated background.
- The extension remembers the current position locally.
- Clear the field and save, or click **Reset** in the popup, to return to the default static background rotation.

## E2E test screenshot

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
