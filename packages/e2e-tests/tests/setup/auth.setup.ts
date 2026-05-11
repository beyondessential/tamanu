import { test as setup } from '../../fixtures/baseFixture';
import path from 'path';

setup('authenticate', async ({ loginPage, adminLoginPage }) => {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;

  if (!email || !password) {
    throw new Error('TEST_EMAIL and TEST_PASSWORD environment variables must be set');
  }

  // Authenticate with the facility frontend
  await loginPage.goto();
  await loginPage.login(email, password);

  // Authenticate with the admin panel — both origins captured in the same storageState
  await adminLoginPage.goto();
  await adminLoginPage.login(email, password);

  // Ensure state is persisted
  await loginPage.page.waitForTimeout(1000);

  // Save page context (includes auth for both facility and admin panel origins)
  const authStatePath = path.join(__dirname, '../../.auth/user.json');
  await loginPage.page.context().storageState({ path: authStatePath });
});
