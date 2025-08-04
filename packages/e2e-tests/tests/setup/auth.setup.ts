import { test as setup } from '../../fixtures/baseFixture';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

setup('authenticate', async ({ loginPage }) => {
  let authToken: string | null = null;

  // Listen for the login API response
  loginPage.page.on('response', async (response) => {
    if (response.url().includes('/login')) {
      const responseBody = await response.json();
      authToken = responseBody.token;
    }
  });

  await loginPage.goto();
  await loginPage.login(process.env.TEST_EMAIL!, process.env.TEST_PASSWORD!);

  // Wait for the response to be captured
  await loginPage.page.waitForTimeout(1000);

  if (authToken) {
    // Store the token in localStorage for future test runs
    await loginPage.page.evaluate((token) => {
      localStorage.setItem('apiToken', token);
    }, authToken);
  }

  // Save page context
  const authStatePath = path.join(__dirname, '../../.auth/user.json');
  await loginPage.page.context().storageState({ path: authStatePath });
});
