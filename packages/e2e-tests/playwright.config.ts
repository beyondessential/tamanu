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
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    timezoneId: process.env.TZ,
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
