export default {
  testDir: './tests',
  testMatch: /.*\.spec\.js/,
  timeout: 60000,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4191', headless: true, viewport: { width: 1280, height: 800 } },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'tablet', use: { viewport: { width: 820, height: 1180 }, hasTouch: true } },
    { name: 'phone', use: { viewport: { width: 390, height: 844 }, hasTouch: true } },
  ],
  webServer: { command: 'node scripts/serve.mjs', url: 'http://127.0.0.1:4191', reuseExistingServer: false },
};
