import { test as setup } from '../../fixtures/baseFixture';

setup('authenticate', async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.login(process.env.TEST_EMAIL, process.env.TEST_PASSWORD);

  // Ensure state is persisted
  await loginPage.page.waitForTimeout(1000);

  // Save page context
  await loginPage.page.context().storageState({ path: '.auth/user.json' });
});
