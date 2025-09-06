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
│   ├── background.ts    # Background script
│   └── content.ts       # Content script (runs on Google pages)
├── public/              # Static assets
├── assets/              # Extension icons
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

- **New Tab Page**: The main user interface located in `entrypoints/newtab/`. It's a React application that displays time, date, search functionality, and website shortcuts.
- **Popup**: Configuration interface located in `entrypoints/popup/`. Allows users to customize bookmark sources and refresh bookmarks manually.
- **Background Script**: Located in `entrypoints/background.ts`. Runs in the background and handles:
  - Bookmark refreshing across all tabs
  - Background image fetching to avoid CORS issues
  - Communication between content scripts and UI components
- **Content Script**: Located in `entrypoints/content.ts`. Runs on specific web pages (currently Google sites) to interact with web content.

### Data Flow

1. **Bookmark Management**:
   - Bookmarks are fetched from a customizable JSON URL
   - Data is cached in localStorage with daily refresh logic
   - Manual refresh available through popup interface
   - Background script broadcasts refresh messages to all tabs

2. **Background Image Handling**:
   - Daily rotation using Unsplash with Picsum fallbacks
   - Images fetched through background script to avoid CORS issues
   - Base64 encoding for better performance and reliability
   - localStorage caching with timestamp validation
   - Manual switching via windmill button
