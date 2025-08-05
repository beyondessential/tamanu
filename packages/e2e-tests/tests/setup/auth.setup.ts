import { test as setup } from '../../fixtures/baseFixture';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

setup('authenticate', async ({ loginPage }) => {
  // Start waiting for the login response before triggering the action.
  const loginResponsePromise = loginPage.page.waitForResponse(
    response => response.url().includes('/login') && response.status() === 200,
  );

  await loginPage.goto();
  await loginPage.login(process.env.TEST_EMAIL!, process.env.TEST_PASSWORD!);

  const loginResponse = await loginResponsePromise;
  const responseBody = await loginResponse.json();
  const authToken = responseBody.token;

  if (authToken) {
    // Store the token in localStorage for future test runs
    await loginPage.page.evaluate(token => {
      localStorage.setItem('apiToken', token);
    }, authToken);
  }

  // Save page context
  const authStatePath = path.join(__dirname, '../../.auth/user.json');
  await loginPage.page.context().storageState({ path: authStatePath });
});
