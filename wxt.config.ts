import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: '__MSG_extensionName__',
    description: '__MSG_extensionDescription__',
    default_locale: 'en',
    chrome_url_overrides: {
      newtab: '/newtab/index.html',
    },
    host_permissions: [
      'https://images.unsplash.com/*',
      'https://source.unsplash.com/*',
      'https://picsum.photos/*',
      'https://fastly.picsum.photos/*',
    ],
    action: {
      default_title: '__MSG_actionTitle__',
      default_popup: '/popup/index.html',
    },
    browser_specific_settings: {
      gecko: {
        id: 'your-new-tab@yeshan333.com',
        strict_min_version: '109.0',
        data_collection_permissions: {
          required: ['none'],
        },
      },
    },
  },
  vite: () => ({
    server: {
      host: '0.0.0.0',
      port: 3000,
    },
  }),
});
