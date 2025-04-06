import { test as setup } from '../../fixtures/baseFixture';

setup('authenticate', async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.login(process.env.TEST_EMAIL, process.env.TEST_PASSWORD);
});
