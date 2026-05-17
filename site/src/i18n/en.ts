import type { Dict } from './zh';

export const en: Dict = {
  lang: 'en',
  dir: 'ltr',
  htmlTitle: 'Your New Tab — One tab, every AI search',
  htmlDesc:
    'An AI-search-first browser new tab: type once and send your query to Google AI, Metaso, Grok, or X — with arrow-key search history, animated backgrounds, and your own shortcuts.',
  nav: {
    features: 'Features',
    faq: 'FAQ',
    privacy: 'Privacy',
    github: 'GitHub',
    switchLang: '中文',
  },
  hero: {
    eyebrow: 'AI-Search-First New Tab',
    title: 'One tab. Every AI search.',
    subtitle:
      'Open a new tab, type your question once, and fire it at Google AI, Metaso, Grok, X — or any provider you wire in yourself. Arrow-key search history, daily backgrounds, no telemetry.',
    ctaInstall: 'Install for Chrome',
    ctaFirefox: 'Firefox build',
    ctaSource: 'View source',
    demoAlt: 'Product demo animation',
  },
  features: {
    heading: 'Why Your New Tab',
    intro:
      'Turn the new tab page into the sharpest AI entry point you have — not yet another start page you click through.',
    items: [
      {
        title: '4 built-in AI providers',
        body: 'Google AI Mode, Metaso, Grok, and X Search — switch with one click and your choice sticks across every new tab.',
      },
      {
        title: 'Bring your own provider',
        body: 'Paste any URL with a {query} placeholder in the popup; pick an icon and slot it into your provider list. Reorder freely.',
      },
      {
        title: 'Smart search history',
        body: 'ArrowUp/ArrowDown cycles your last 20 queries. Type a prefix first and history filters case-insensitively to matches.',
      },
      {
        title: 'Dynamic backgrounds',
        body: 'Daily-rotating images from Unsplash and Picsum, with optional GIF / WebP / MP4 URLs of your own cycled by the windmill button.',
      },
      {
        title: 'Configurable shortcuts',
        body: 'Maintain bookmarks as JSON in the popup: remote URL, local-only, or paste mode. Live-syncs across tabs without broadcast.',
      },
      {
        title: 'Privacy by default',
        body: 'No tabs permission. No content script. No telemetry. Config lives in localStorage; third-party requests go straight from your browser.',
      },
    ],
  },
  faq: {
    heading: 'Frequently asked',
    items: [
      {
        q: 'Does it collect my search history?',
        a: 'No. History stays in your browser’s localStorage. The author runs no server that receives it. Uninstall the extension or clear browser data to remove it completely.',
      },
      {
        q: 'Can I add my own AI service?',
        a: 'Yes — open the popup → Search providers → Add, paste a URL like https://example.com/search?q={query}, pick an icon. The {query} placeholder is replaced with your query at search time.',
      },
      {
        q: 'Why no “tabs” permission?',
        a: 'To keep the permission surface minimal. The extension only owns the new tab page itself — it never reads your other tabs, so it doesn’t request the permission that would let it.',
      },
      {
        q: 'Where do the backgrounds come from?',
        a: 'Default backgrounds come from Unsplash and Picsum’s public endpoints, rotated daily and cached locally. You can also configure your own animated URLs, cycled by the windmill button.',
      },
      {
        q: 'Which browsers are supported?',
        a: 'Chromium-based browsers (Chrome / Edge / Arc / Brave) via the Chrome Web Store; Firefox via add-ons store or sideloaded zip.',
      },
    ],
  },
  privacy: {
    heading: 'Privacy at a glance',
    intro:
      'Privacy should be the default, not the upsell. The condensed summary below mirrors PRIVACY.md in the repo.',
    points: [
      {
        title: 'Stored locally',
        body: 'Search history, cached bookmarks, provider settings, animated background list, and language preference all live in your browser’s localStorage.',
      },
      {
        title: 'No data to the author',
        body: 'The extension itself never contacts an author-owned server. Background images are fetched directly from Unsplash / Picsum to sidestep CORS.',
      },
      {
        title: 'Queries go only to the provider you picked',
        body: 'Pressing Enter opens the selected provider’s URL in a new tab. The extension does not log, forward, or proxy your query.',
      },
      {
        title: 'No remote code',
        body: 'Remote bookmark JSON and background URLs are treated as data only. They are never executed as scripts.',
      },
    ],
    fullLink: 'Read the full privacy policy →',
  },
  footer: {
    license: 'Open source, MIT licensed',
    builtWith: 'Built with Astro · deployed on GitHub Pages',
  },
};
