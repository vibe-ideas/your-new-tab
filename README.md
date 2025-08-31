# New Tab Extension

A customizable browser extension that replaces your new tab page with a beautiful, functional interface.

## Features

- Real-time clock and date display
- Quick Google search functionality
- Customizable website shortcuts grid
- Daily rotating background images from picsum.photos
- Manual background image switching with windmill button
- Customizable bookmarks via popup configuration
- Responsive design for all screen sizes

## Development

This extension is built with:

- [WXT](https://wxt.dev) - Web Extension Framework
- [React](https://react.dev) - UI Library
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript

### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [WXT Extension](https://marketplace.visualstudio.com/items?itemName=wxt-dev.wxt)

### Project Structure

```bash
├── entrypoints/
│   ├── newtab/          # Main new tab page
│   ├── popup/           # Extension popup for configuration
│   ├── background.ts    # Background script
│   └── content.ts       # Content script
├── public/              # Static assets
└── assets/              # Extension icons
```

### Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Create zip for distribution
npm run zip
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed information about updates and changes.
