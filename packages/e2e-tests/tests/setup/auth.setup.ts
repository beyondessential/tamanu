import { test as setup } from '../../fixtures/baseFixture';
import path from 'path';

import { adminFrontend } from '../../utils/navigation';

// Authenticate against BOTH frontends in one browser context and save a single
// storageState. localStorage is per-origin, so the saved state carries both
// the facility and the admin (central) sessions — letting every spec drive
// either frontend authenticated, with no need for a second Playwright project.
setup('authenticate', async ({ loginPage, page }) => {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;

  if (!email || !password) {
    throw new Error('TEST_EMAIL and TEST_PASSWORD environment variables must be set');
  }

  // facility frontend (LoginPage waits for the facility dashboard)
  await loginPage.goto();
  await loginPage.login(email, password);
  // the facility session writes facilityId to localStorage shortly after the
  // dashboard loads; wait for it before navigating away so the saved state
  // carries it (specs read facilityId from localStorage)
  await page.waitForFunction(() => window.localStorage.getItem('facilityId') !== null);

  // admin / central frontend — same context. The URL isn't an auth signal here
  // (the admin app routes to /admin even while showing the login screen), so we
  // wait for the authenticated shell's log-out button instead.
  await page.goto(adminFrontend);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByTestId('loginbutton-gx21').click();
  await page.getByTestId('logoutbutton-4zn4').waitFor({ state: 'visible', timeout: 60_000 });

  await page.context().storageState({ path: path.join(__dirname, '../../.auth/user.json') });
});
