# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser extension built with WXT (Web Extension Framework) and React that overrides the new tab page. The extension displays a custom new tab interface with:
- Current time and date display
- Search functionality (Google search)
- Grid of shortcuts to frequently visited websites

## Project Structure

```
├── entrypoints/
│   ├── newtab/          # Main new tab page (React app)
│   │   ├── index.html   # HTML entry point
│   │   ├── main.tsx     # React component and initialization
│   │   └── newtab.css   # Styling
│   ├── background.ts    # Background script
│   └── content.ts       # Content script (runs on Google pages)
├── public/              # Static assets
├── assets/              # Extension icons
└── wxt.config.ts        # WXT configuration
```

## Key Configuration Files

1. `wxt.config.ts` - Main WXT configuration with React module and new tab override
2. `package.json` - Project dependencies and scripts
3. `tsconfig.json` - TypeScript configuration extending WXT's config

## Common Development Commands

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

## Architecture Overview

### Entry Points
- **New Tab Page**: The main user interface located in `entrypoints/newtab/`. It's a React application that displays time, date, search functionality, and website shortcuts.
- **Background Script**: Located in `entrypoints/background.ts`. Runs in the background and has access to extension APIs.
- **Content Script**: Located in `entrypoints/content.ts`. Runs on specific web pages (currently Google sites) to interact with web content.

### Core Components
1. **NewTab Component** (`entrypoints/newtab/main.tsx`): Main React component that renders:
   - Real-time clock with date display
   - Search input with Google search integration
   - Grid of website shortcuts organized in rows

2. **Styling** (`entrypoints/newtab/newtab.css`): Comprehensive CSS with:
   - Gradient background with SVG elements
   - Responsive design for different screen sizes
   - Modern UI elements with shadows and hover effects

### Extension Configuration
The extension is configured in `wxt.config.ts` to:
- Use the React module for React-specific features
- Override the new tab page with the custom interface
- Configure the development server to run on port 3000

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