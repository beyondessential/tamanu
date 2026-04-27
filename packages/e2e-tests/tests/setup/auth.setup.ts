import { test as setup } from '../../fixtures/baseFixture';
import { expect } from '@playwright/test';
import path from 'path';

setup('authenticate', async ({ loginPage }) => {
  await loginPage.goto();

  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;

  if (!email || !password) {
    throw new Error('TEST_EMAIL and TEST_PASSWORD environment variables must be set');
  }

  await loginPage.login(email, password);

  // Ensure the logged-in landing page has rendered before snapshotting auth state.
  await expect(loginPage.page.getByText('Search All Patients')).toBeVisible();

  // Save page context
  const authStatePath = path.join(__dirname, '../../.auth/user.json');
  await loginPage.page.context().storageState({ path: authStatePath });
});
