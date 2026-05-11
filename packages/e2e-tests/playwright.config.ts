import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'path';
import dotenv from 'dotenv';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config({ path: resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
module.exports = defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'blob' : 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    // Keep failure media in CI so merge queue reports contain useful debugging context.
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    video: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Slow down each browser action to make local debugging easier.
    launchOptions: process.env.CI ? undefined : { slowMo: 200 },
    timezoneId: process.env.TZ,
    // Pin browser locale so navigator.language-driven date formatting is deterministic across
    // runners (CI Ubuntu defaults to en-US which yields MM/DD/YYYY; tests expect DD/MM/YYYY).
    locale: 'en-AU',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: /setup\.ts/,
      // Auth setup hits a cold Vite + app bundle on CI; default 30s is often too tight.
      timeout: 120 * 1000,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: resolve(__dirname, '.auth/user.json') },
      dependencies: ['setup'],
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Automatically run your local servers and frontends before starting the tests if running tests against local environment */
  ...(process.env.LAUNCH_LOCAL_SERVERS_WHEN_RUNNING_TESTS === 'true'
    ? {
        webServer: [
          {
            command: 'npm run start-dev --workspace=@tamanu/central-server',
            port: 3000,
            reuseExistingServer: true,
            timeout: 240 * 1000,
            stdout: 'pipe',
          },
          {
            command: 'npm run start-dev --workspace=@tamanu/facility-server',
            port: 4000,
            reuseExistingServer: true,
            timeout: 240 * 1000,
            stdout: 'pipe',
          },
          // Run the web frontends from the production build via `vite preview`
          // rather than the dev server. The dev server's on-demand transform +
          // optimizeDeps crawl is the largest source of cold-start variance on
          // CI runners (and the cause of intermittent login-page timeouts after
          // the Vite 6 upgrade). The build is produced once by the e2e_prepare
          // job and downloaded into packages/web/dist before tests run.
          {
            command: 'npm run e2e-client-preview --workspace=@tamanu/web-frontend',
            port: 5173,
            reuseExistingServer: true,
            timeout: 120 * 1000,
            stdout: 'pipe',
          },
          {
            command: 'npm run e2e-admin-preview --workspace=@tamanu/web-frontend',
            port: 5174,
            reuseExistingServer: true,
            timeout: 120 * 1000,
            stdout: 'pipe',
          },
        ],
      }
    : {}),
});
