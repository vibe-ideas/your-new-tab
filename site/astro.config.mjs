import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://vibe-ideas.github.io',
  base: '/your-new-tab/',
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  build: { format: 'directory' },
});
