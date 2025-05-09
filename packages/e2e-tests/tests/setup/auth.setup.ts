import { test as setup } from '../../fixtures/baseFixture';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

setup('authenticate', async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.login(process.env.TEST_EMAIL, process.env.TEST_PASSWORD);

  // Ensure state is persisted
  await loginPage.page.waitForTimeout(1000);

  // Save page context
  const authStatePath = path.join(__dirname, '../../.auth/user.json');
  await loginPage.page.context().storageState({ path: authStatePath });
});
