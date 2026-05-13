import { test as setup } from '../../fixtures/baseFixture';
import path from 'path';

setup('authenticate admin', async ({ adminLoginPage }) => {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;

  if (!email || !password) {
    throw new Error('TEST_EMAIL and TEST_PASSWORD environment variables must be set');
  }

  await adminLoginPage.goto();
  await adminLoginPage.login(email, password);

  const authStatePath = path.join(__dirname, '../../.auth/admin.json');
  await adminLoginPage.page.context().storageState({ path: authStatePath });
});
