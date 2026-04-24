import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'path';
import dotenv from 'dotenv';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config({ path: resolve(__dirname, '.env') });

const isCI = !!process.env.CI;
const keepDebugArtifactsInCI = process.env.PLAYWRIGHT_DEBUG_ARTIFACTS === 'true';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
module.exports = defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: isCI,
  /* Retry on CI only */
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? 'blob' : 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    // Keep heavy debug artifacts by default locally, and optionally in CI via PLAYWRIGHT_DEBUG_ARTIFACTS.
    trace: isCI ? (keepDebugArtifactsInCI ? 'retain-on-failure' : 'on-first-retry') : 'retain-on-failure',
    video: isCI ? (keepDebugArtifactsInCI ? 'retain-on-failure' : 'off') : 'retain-on-failure',
    screenshot: isCI ? (keepDebugArtifactsInCI ? 'only-on-failure' : 'off') : 'only-on-failure',
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
          {
            command: 'npm run client-start-dev --workspace=@tamanu/web-frontend',
            port: 5173,
            reuseExistingServer: true,
            timeout: 240 * 1000,
            stdout: 'pipe',
          },
          {
            command: 'npm run admin-start-dev --workspace @tamanu/web-frontend',
            port: 5174,
            reuseExistingServer: true,
            timeout: 240 * 1000,
            stdout: 'pipe',
          },
        ],
      }
    : {}),
});
