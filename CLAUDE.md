# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **AI-search-first** browser extension built with WXT (Web Extension Framework) and React that overrides the new tab page. The headline feature is the AI search hub; everything else (clock, shortcuts, backgrounds) frames it.
- AI search hub: built-in providers Google AI Mode, Metaso, Grok, X; users can add their own provider with a `{query}` URL template
- Search history: ArrowUp/ArrowDown navigation with case-insensitive prefix matching (capped at 20 entries in `localStorage`)
- Current time and date display
- Grid of shortcuts to frequently visited websites (configurable JSON)
- Daily rotating background images from Unsplash and Picsum
- Optional animated backgrounds (GIF/APNG/WebP/MP4/WebM/MOV) cycled via the windmill button
- Bookmarks edited via extension popup (Ace JSON editor)
- Privacy-minded: no `tabs` permission, no content script, no telemetry — provider/bookmark icons are sanitized to data URIs or HTTPS URLs at render time

## Project Structure

```
├── entrypoints/
│   ├── newtab/          # Main new tab page (React app)
│   │   ├── index.html   # HTML entry point
│   │   ├── main.tsx     # React component and initialization
│   │   └── newtab.css   # Styling
│   ├── popup/           # Extension popup for configuration (tabbed layout)
│   │   ├── index.html             # HTML entry point
│   │   ├── App.tsx                # Shell: tab bar, panels, persistent action footer
│   │   ├── App.css                # Popup styling (tab bar + footer)
│   │   ├── main.tsx               # React component initialization
│   │   ├── style.css              # Base popup styling
│   │   ├── defaultBookmarks.ts    # Built-in bookmark seed data
│   │   ├── usePopupState.ts       # Custom hook owning all popup state + handlers
│   │   └── tabs/                  # Tab panel components
│   │       ├── BookmarksTab.tsx
│   │       ├── SearchTab.tsx
│   │       └── BackgroundsTab.tsx
│   └── background.ts    # Background script (image fetch only)
├── utils/               # Shared helpers (browser API, search providers, history)
├── public/              # Static assets (icons rendered from assets/icon-source.svg)
├── assets/              # Extension icon source (SVG + 1024 PNG)
└── wxt.config.ts        # WXT configuration

## Key Configuration Files

1. `wxt.config.ts` - Main WXT configuration with React module and new tab override
2. `package.json` - Project dependencies and scripts
3. `tsconfig.json` - TypeScript configuration extending WXT's config

## Common Development Commands

### Setup
```bash
npm install          # Install dependencies
```

### Development
```bash
npm run dev          # Start development server for Chrome
npm run dev:firefox  # Start development server for Firefox
```

### Building
```bash
npm run build        # Build extension for Chrome
npm run build:firefox # Build extension for Firefox
npm run zip          # Create zip file for Chrome Web Store
npm run zip:firefox  # Create zip file for Firefox Add-ons
```

### Type Checking
```bash
npm run compile      # Run TypeScript compilation without emitting files
```

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [WXT Extension](https://marketplace.visualstudio.com/items?itemName=wxt-dev.wxt)

## Architecture Overview

### Entry Points
- **New Tab Page**: The main user interface located in `entrypoints/newtab/`. React app rendering the AI search bar, provider picker, search history, clock, shortcut grid, and background.
- **Popup**: Configuration UI in `entrypoints/popup/`. Manages bookmark sources, search-provider list (built-in + custom), default provider, and animated background URLs.
- **Background Script**: `entrypoints/background.ts`. Sole responsibility is fetching daily background images from Unsplash/Picsum to bypass CORS — no broadcast, no content scripting.

Cross-tab config sync uses `window` `storage` events (no `tabs` permission, no message broadcast).

### Core Components

1. **NewTab Component** (`entrypoints/newtab/main.tsx`): Main React component that renders:
   - Real-time clock with date display
   - AI search input with provider picker (Google AI / Metaso / Grok / X / custom)
   - Search history navigation (`utils/searchHistory.ts`)
   - Grid of website shortcuts organized in rows
   - Background image handling with daily rotation
   - Windmill button for manual background switching

2. **Popup Component** (`entrypoints/popup/App.tsx`): Tabbed configuration UI organized into three panels with a persistent action footer:
   - **Bookmarks tab**: built-in bookmarks vs. pasted JSON, with format/minify helpers
   - **Search tab**: default provider picker, provider list editing, add custom provider
   - **Backgrounds tab**: animated background media URLs (one per line)
   - **Action footer** (always visible): Save, Reset, Test (when applicable), Refresh bookmarks; plus a current-config summary card
   - State and handlers live in [usePopupState.ts](entrypoints/popup/usePopupState.ts); each tab is a presentational component under [entrypoints/popup/tabs/](entrypoints/popup/tabs/)

3. **Styling** (`entrypoints/newtab/newtab.css`): Comprehensive CSS with:
   - Gradient background with SVG elements
   - Responsive design for different screen sizes
   - Modern UI elements with shadows and hover effects
   - Background image handling with fallbacks
   - Windmill button animations

### Extension Configuration
The extension is configured in `wxt.config.ts` to:
- Use the React module for React-specific features
- Override the new tab page with the custom interface
- Configure the development server to run on port 3000
- Request only `host_permissions` for the Unsplash/Picsum image hosts — no `tabs`, no broad host access

## Data Flow

1. **AI Search**:
   - Built-in providers defined in `utils/searchProviders.ts` (Google AI, Metaso, X, Grok)
   - User-added providers persisted in `localStorage` and merged with built-ins on render
   - Active provider is sticky across new-tab opens; selection round-trips through `localStorage` → `storage` event for cross-tab sync
   - Submitting a query opens the provider's URL with `{query}` substituted in a new tab
   - Search history stored in `localStorage` (`searchHistory`, capped at 20) — see `utils/searchHistory.ts`

2. **Bookmark Management**:
   - Three modes: bundled defaults, remote JSON URL, or pasted JSON
   - Cached in `localStorage` with daily refresh logic; popup offers manual refresh
   - New-tab page reacts to `storage` events for live updates (no broadcast)

3. **Background Image Handling**:
   - Daily rotation using Unsplash with Picsum fallbacks
   - Images fetched through the background script to bypass CORS, returned as base64
   - Cached in `localStorage` with a timestamp; windmill button forces a refresh
   - Optional user-supplied animated URLs (GIF/APNG/WebP/MP4/WebM/MOV) cycled by the windmill

## Development Workflow
1. Run `npm run dev` to start the development server
2. Load the extension in the browser using the provided instructions
3. Make changes to files in `entrypoints/newtab/` for UI updates
4. Build with `npm run build` when ready to package
5. Use `npm run zip` to create a distributable package

## Key Technologies
- **WXT**: Web Extension Framework for building browser extensions
- **React 19**: UI library for building the new tab interface
- **TypeScript**: Typed JavaScript for better development experience
- **CSS**: Custom styling with modern features like backdrop-filter