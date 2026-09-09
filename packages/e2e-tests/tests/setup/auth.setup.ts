import { test as setup } from '../../fixtures/baseFixture';

import { AUTH_STATE_PATH } from '../../config/auth';

setup('authenticate', async ({ loginPage }) => {
  await loginPage.goto();

  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;

  if (!email || !password) {
    throw new Error('TEST_EMAIL and TEST_PASSWORD environment variables must be set');
  }

  await loginPage.login(email, password);

  // Ensure state is persisted
  await loginPage.page.waitForTimeout(1000);

  await loginPage.page.context().storageState({ path: AUTH_STATE_PATH });
});
