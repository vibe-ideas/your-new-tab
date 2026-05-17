# Installation

- Step 1. Clone the repository:

```bash
git clone https://github.com/vibe-ideas/your-new-tab.git
```

- Step 2. Install dependencies:

```bash
pnpm install
```

- Step 3. debug the extension:

```bash
pnpm run dev

# known firefox manifest v3 bug: https://github.com/wxt-dev/wxt/issues/230
# running in v2
pnpm run dev:firefox
```

- Step 4. Load the extension in your browser:
  - **Chrome/Edge**:
    1. Navigate to `chrome://extensions`
    2. Enable "Developer mode"
    3. Click "Load unpacked"
    4. Select the `.output/chrome-mv3` directory
  - **Firefox**:
    1. Navigate to `about:debugging`
    2. Click "This Firefox"
    3. Click "Load Temporary Add-on"
    4. Select the `.output/firefox-mv2/manifest.json` file

## Development

This extension is built with:

- [WXT](https://wxt.dev) - Web Extension Framework
- [React 19](https://react.dev) - UI Library
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript

### Project Structure

```shell
├── entrypoints/
│   ├── newtab/          # Main new tab page (React app)
│   │   ├── index.html   # HTML entry point
│   │   ├── main.tsx     # React component and initialization
│   │   └── newtab.css   # Styling
│   ├── popup/           # Extension popup for configuration
│   │   ├── index.html   # HTML entry point
│   │   ├── App.tsx      # Popup configuration UI
│   │   ├── main.tsx     # React component initialization
│   │   ├── App.css      # Popup styling
│   │   └── style.css    # Additional popup styling
│   └── background.ts    # Background script (image fetch only)
├── utils/               # Shared helpers (browser API, search providers, history)
├── public/              # Static assets (icons rendered from assets/icon-source.svg)
├── assets/              # Extension icon source (SVG + 1024 PNG)
└── wxt.config.ts        # WXT configuration
```

### Development Commands

```bash
# Install dependencies
npm install

# Start development server for Chrome
npm run dev

# Start development server for Firefox
npm run dev:firefox

# Build for production (Chrome)
npm run build

# Build for production (Firefox)
npm run build:firefox

# Create zip for Chrome Web Store
npm run zip

# Create zip for Firefox Add-ons
npm run zip:firefox

# Run TypeScript compilation without emitting files
npm run compile
```

### Development Workflow

1. Run `npm run dev` to start the development server
2. Load the extension in the browser using the provided instructions
3. Make changes to files in `entrypoints/newtab/` for UI updates
4. Build with `npm run build` when ready to package
5. Use `npm run zip` to create a distributable package

## Architecture Overview

### Entry Points

- **New Tab Page**: React app in `entrypoints/newtab/`. Renders the AI search bar with provider picker, search history, clock, shortcut grid, and background.
- **Popup**: Configuration UI in `entrypoints/popup/`. Manages search-provider list (built-in + user-added), default provider, bookmark sources, and animated background URLs.
- **Background Script**: `entrypoints/background.ts`. Sole responsibility is fetching the daily background image from Unsplash/Picsum to bypass CORS — no broadcast, no content scripting.

Cross-tab config sync uses `window` `storage` events (no `tabs` permission, no message broadcast).

### Data Flow

1. **AI Search**:
   - Built-in providers defined in `utils/searchProviders.ts` (Google AI, Metaso, X, Grok)
   - User-added providers persisted in `localStorage` and merged with built-ins on render
   - Active provider sticks across new-tab opens; selection round-trips through `localStorage` → `storage` event for cross-tab sync
   - Submitting a query opens the provider's URL with `{query}` substituted in a new tab

2. **Bookmark Management**:
   - Three modes: bundled defaults, remote JSON URL, or pasted JSON
   - Cached in `localStorage` with daily refresh logic; popup offers manual refresh
   - New-tab page reacts to `storage` events for live updates

3. **Background Image Handling**:
   - Daily rotation using Unsplash with Picsum fallbacks
   - Images fetched through the background script to avoid CORS issues
   - Base64 encoding cached in `localStorage` with a timestamp
   - Manual switching via windmill button (cycles user animated URLs when configured)

4. **Search History**:
   - Recent queries persisted in `localStorage` under the `searchHistory` key (capped at 20 entries)
   - Helpers live in `utils/searchHistory.ts` (`getSearchHistory`, `addSearchHistory`, `filterHistoryByPrefix`)
   - The new tab input handles `ArrowUp`/`ArrowDown` to cycle through history with prefix-match filtering
   - The input is cleared on submit so the next ArrowUp surfaces the most recent entry
