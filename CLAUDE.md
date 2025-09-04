# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser extension built with WXT (Web Extension Framework) and React that overrides the new tab page. The extension displays a custom new tab interface with:
- Current time and date display
- Search functionality (Google search)
- Grid of shortcuts to frequently visited websites
- Daily rotating background images from Unsplash and Picsum
- Manual background image switching with windmill button
- Customizable bookmarks via popup configuration
- Responsive design for all screen sizes

## Project Structure

```
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
- **New Tab Page**: The main user interface located in `entrypoints/newtab/`. It's a React application that displays time, date, search functionality, and website shortcuts.
- **Popup**: Configuration interface located in `entrypoints/popup/`. Allows users to customize bookmark sources and refresh bookmarks manually.
- **Background Script**: Located in `entrypoints/background.ts`. Runs in the background and handles:
  - Bookmark refreshing across all tabs
  - Background image fetching to avoid CORS issues
  - Communication between content scripts and UI components
- **Content Script**: Located in `entrypoints/content.ts`. Runs on specific web pages (currently Google sites) to interact with web content.

### Core Components

1. **NewTab Component** (`entrypoints/newtab/main.tsx`): Main React component that renders:
   - Real-time clock with date display
   - Search input with Google search integration
   - Grid of website shortcuts organized in rows
   - Background image handling with daily rotation
   - Windmill button for manual background switching

2. **Popup Component** (`entrypoints/popup/App.tsx`): Configuration UI that allows:
   - Customizing bookmark JSON URL
   - Testing URL accessibility
   - Resetting to default configuration
   - Manual bookmark refreshing

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
- Request necessary permissions for tabs manipulation and external image sources

## Data Flow

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

3. **Search Functionality**:
   - Google search integration with new tab opening
   - Real-time keyboard event handling

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