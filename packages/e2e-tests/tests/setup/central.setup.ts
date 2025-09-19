
import { test as setup } from '../../fixtures/baseFixture';
import { goToAdminFrontend } from '../../utils/navigation';
import { enableEditVitals } from '../../utils/apiHelpers';

// Only run this setup on CI 
if (process.env.CI) {
  setup('Setup central server config', async ({ loginPage, page }) => {
    await goToAdminFrontend(loginPage.page);

    const email = process.env.TEST_EMAIL;
    const password = process.env.TEST_PASSWORD;
  
    if (!email || !password) {
      throw new Error('TEST_EMAIL and TEST_PASSWORD environment variables must be set');
    }
  
    await loginPage.login(email, password, 'admin');

    // Configures edit vitals setting to true
    await enableEditVitals(page);
  });
} else {
  console.log('Skipping setting up central server - not running on CI');
}
