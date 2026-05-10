export default {
  testDir: './e2e',
  timeout: 60000,
  workers: 1,
  use: {
    headless: true,
    viewport: { width: 1440, height: 960 },
  },
  webServer: {
    command: 'python3 -m http.server 4174 --directory .',
    url: 'http://127.0.0.1:4174/demo.gif',
    reuseExistingServer: true,
    timeout: 30000,
  },
};
