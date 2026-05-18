# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## 0.6.0 - 2026-05-19

### Added

- **Two bookmark groups** with a per-tab toggle in the new tab corner: configure separate bookmark sources for two groups (e.g. external / internal networks), switch between them with one click; both groups round-trip through `localStorage` so already-open tabs follow popup edits via `storage` events
- **Custom group labels**: rename either bookmark group from the popup (max 24 chars). Empty labels fall back to localized defaults
- Playwright e2e coverage for bookmark groups: per-group state isolation, custom labels with default fallback, cross-page switch sync via `storage` event
- `_locales/{en,zh_CN}/messages.json` with `default_locale: "en"` for store-grade i18n on extension name, description, and toolbar tooltip
- `ErrorBoundary` around the new tab React tree so a render failure shows a recoverable screen instead of a blank page
- Toast component on the new tab page for in-flow feedback, replacing the native `alert(...)` previously used for the manual-provider clipboard hint

### Changed

- Refactored `entrypoints/newtab/main.tsx` (was ~1000 lines) into focused hooks (`useClock`, `useToast`, `useBookmarkLoader`, `useBackgroundMedia`, `useSearchProviders`, `useSearchInput`) and presentational components (`TimeDisplay`, `SearchHub`, `ShortcutsGrid`, `BackgroundLayer`, `BookmarkGroupToggle`, `WindmillButton`, `Toast`); the orchestrator is now ~90 lines
- New tab UI now reads its strings through the shared `utils/i18n.ts` (newtab title, search placeholder, weekdays, aria labels, group toggle), with formatted-string interpolation support (`{name}`, `{year}` placeholders)
- Popup shares a single `DEFAULT_BOOKMARKS` source from `utils/defaultBookmarks.ts` (was duplicated)
- Popup status state moved from regex-based "is this an error?" detection to an explicit `{ text, kind }` tuple with `showSuccess` / `showError` helpers
- Build artifacts shrunk from 1.55 MB to 426 KB by relocating Playwright fixtures (`flower.mp4`) out of `public/` and removing the unused WXT placeholder logo

### Security

- Search provider URL templates and bookmark URLs are now whitelisted to `http://` / `https://` protocols at normalization and click time, blocking `javascript:` / `data:text/html` injection paths from custom providers and remote bookmark JSON
- Background service worker filters `fetchBackgroundImage` request URLs against the `host_permissions` allowlist (`images.unsplash.com` / `source.unsplash.com` / `picsum.photos` / `fastly.picsum.photos`), rejecting any other host
- All `window.open` calls use `noopener,noreferrer` to prevent reverse-tabnabbing into the opener page
- Removed stray `console.log` calls that exposed Unsplash request URLs

### Manifest / Store

- Manifest `name`, `description`, and `action.default_title` migrated to `__MSG_*__` placeholders backed by `_locales/{en,zh_CN}/messages.json`
- Added Firefox `browser_specific_settings.gecko.data_collection_permissions: { required: ["none"] }` to satisfy AMO's 2025-11-03 data-collection consent rules
- Added `https://images.unsplash.com/*` to `host_permissions` in preparation for the deprecation of `source.unsplash.com`

## 0.4.1 - 2026-05-17

### Fixed

- Shortened the manifest `description` so the Chrome Web Store accepts the package (previous 167-character string exceeded Chrome's 132-character limit)

## 0.4.0 - 2026-05-17

### Added

- Search history with arrow-key navigation in the new tab search box (stores up to 20 recent queries; ArrowUp/ArrowDown cycles through history with prefix-match filtering)
- E2E regression coverage for search history recording, prefix-match navigation, and the 20-entry cap
- Animated GIF demo for search history; reproduced via `pnpm run demo:search-history` (Playwright + ImageMagick)
- Project-level demo GIF rendered in CI (`pnpm run demo:project`) and attached to GitHub releases
- `PRIVACY.md` covering local storage and third-party requests for Chrome Web Store publication
- `AGENTS.md` with Codex-oriented project guidance

### Changed

- Repositioned the extension as **AI-search-first**: README, user guides (zh/en), CLAUDE.md, AGENTS.md, DEVELOPMENT.md, IFLOW.md, `package.json` description, and the WXT manifest now lead with the AI search hub (Google AI, Metaso, Grok, X, plus user-added providers)
- Redesigned the extension icon around the AI search hub concept; authoring source switched to `assets/icon-source.svg` and re-rendered at 16/32/48/96/128 with `rsvg-convert`
- Default to bundled bookmarks on first install instead of fetching the jsdelivr-hosted remote JSON
- Cross-tab config sync now uses `storage` events instead of background broadcast — no `tabs` permission required
- The search input is cleared after submitting a search so subsequent ArrowUp navigation starts from the latest history entry

### Removed

- `tabs` permission, `entrypoints/content.ts` content script, and the `useProxy` search-provider proxy fetch — none were needed for the AI-search-first flow and they each broadened the permission surface
- Dead `chrome.runtime.sendMessage` paths in popup Save/Reset and the now-orphaned `runtime.onMessage` listener in the new tab — cross-tab sync is fully driven by `storage` events

### Fixed

- Popup *Refresh bookmarks* button now writes a `bookmarksRefreshSignal` `localStorage` key (previously sent a runtime broadcast that was removed alongside the `tabs` permission, leaving the button inert); already-open new tabs react to the signal and re-read their bookmark source
- E2E coverage for the popup *Quick actions* section (Save / Refresh / Reset) so this class of regression cannot recur silently

### Security

- Provider and bookmark icons are sanitized at render time: inline SVG is converted to a data URI after a script/handler/`javascript:` check; remote URLs must be HTTPS; otherwise the icon falls back to a text glyph (replaces previous `dangerouslySetInnerHTML` paths)

## 0.3.1 - 2026-05-12

### Changed

- Improved the new tab search provider switcher with clearer active-provider feedback
- Restored Google AI as the default built-in search provider name and behavior

### Fixed

- Repaired legacy search provider configs that could get stuck with only one provider visible
- Preserved built-in provider metadata such as icons across popup edits and new tab rendering
- Added end-to-end regression coverage for default-provider sync, provider switching, and legacy config repair

## 0.2.0 - 2025-09-20

### Added

- Enhanced popup interface with Ace Editor for JSON bookmark editing
- Real bookmark data integration in popup interface
- Support for importing bookmarks from JSON format
- Example bookmarks configuration file with icons
- GitHub Actions workflow for automated building and releasing
- Firefox MV3 compatibility support
- Enhanced development documentation

### Changed

- Improved popup UI with better bookmark management interface
- Updated build configuration for cross-browser compatibility
- Enhanced background script messaging system
- Updated Node.js version requirements to 23
- Renamed project from "newtab-extension" to "your-new-tab"

### Fixed

- Improved cross-browser runtime API compatibility
- Enhanced error handling for bookmark loading
- Fixed build and deployment processes

## 0.1.0

### Added

- Windmill button in bottom right corner for manual background image switching
- Continuous rotation animation for windmill button during image loading
- Loading state indication when fetching new background images
- New tab page with real-time clock and date display
- Google search functionality
- Grid of customizable website shortcuts
- Background image rotation using Unsplash with Picsum fallback
- Daily caching of background images with localStorage
- Customizable bookmarks URL configuration via popup
- Fallback to default gradient background when images fail to load
- Responsive design for different screen sizes
- Icons support for bookmarks in both NewTab and Popup
- Support for direct JSON input in bookmarks functionality
- Customizable bookmarks with responsive design

### Changed

- Moved bookmarks URL configuration from newtab to popup interface
- Replaced Unsplash Source API with Unsplash and Picsum for more reliable image fetching
- Simplified image fetching logic with better error handling
- Enhanced background script messaging and added fallback image sources
- Cleaned up image loading logic and styles in new tab component
- Updated background image source to Unsplash
- Simplified background script and updated new tab images
- Adjusted shortcut icon styles in newtab

### Fixed

- Fixed Unsplash API 503 errors by implementing Picsum fallback
- Improved background image loading with preloading and error handling
- Enhanced fallback mechanisms for both bookmarks and background images
- Updated initial state for image loading in NewTab component
