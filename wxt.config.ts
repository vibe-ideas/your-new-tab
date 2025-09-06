import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    chrome_url_overrides: {
      newtab: '/newtab/index.html'
    },
    permissions: ["tabs"],
    host_permissions: [
      "https://source.unsplash.com/*",
      "https://picsum.photos/*",
      "https://fastly.picsum.photos/*"
    ],
    // Firefox-specific configuration
    browser_specific_settings: {
      gecko: {
        id: "your-new-tab@yeshan333.com",
        strict_min_version: "109.0"
      }
    }
  },
  vite: () => ({
    server: {
      host: '0.0.0.0',
      port: 3000
    }
  })
});
