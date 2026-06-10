import { test as setup } from '../../fixtures/baseFixture';
import path from 'path';
import { writeFile } from 'fs/promises';

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
  // dashboard loads; wait for it before capturing (specs read it from there)
  await page.waitForFunction(() => window.localStorage.getItem('facilityId') !== null);
  const facilityState = await page.context().storageState();

  // admin / central frontend — same context. The URL isn't an auth signal here
  // (the admin app routes to /admin even while showing the login screen), so we
  // wait for the authenticated shell's log-out button instead.
  await page.goto(adminFrontend);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByTestId('loginbutton-gx21').click();
  await page.getByTestId('logoutbutton-4zn4').waitFor({ state: 'visible', timeout: 60_000 });
  const adminState = await page.context().storageState();

  // storageState() only retains localStorage for the currently-loaded origin,
  // so capturing after navigating to admin drops the facility session. Merge
  // each frontend's origins into one combined state (facility entry wins for
  // its own origin, since it was captured while facilityId was present).
  const originsByUrl = new Map(adminState.origins.map(origin => [origin.origin, origin]));
  for (const origin of facilityState.origins) originsByUrl.set(origin.origin, origin);
  const combined = { cookies: adminState.cookies, origins: [...originsByUrl.values()] };

  await writeFile(path.join(__dirname, '../../.auth/user.json'), JSON.stringify(combined));
});
