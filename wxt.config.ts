import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    chrome_url_overrides: {
      newtab: '/newtab/index.html'
    },
    permissions: []
  },
  vite: () => ({
    server: {
      host: '0.0.0.0',
      port: 3000
    }
  })
});
