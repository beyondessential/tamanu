import { test, expect } from '@playwright/test';
import { AdminLoginPage } from '../../pages/AdminLoginPage';
import { AdminSettingsPage } from '../../pages/AdminSettingsPage';
import { goToFacilityFrontend } from '../../utils/navigation';

const TEST_BANNER_MESSAGE = `e2e banner ${Date.now()}`;

/**
 * End-to-end coverage for the site-wide system banner. The banner is driven by
 * the global `banner` setting, written from the admin frontend (central) and
 * picked up live by the facility frontend through the existing settings cache
 * invalidation pipeline.
 *
 * The two contexts:
 *  - adminContext: a fresh login to the admin frontend so we can toggle the
 *    banner setting.
 *  - default `page`: facility frontend with storageState from auth.setup so we
 *    can observe the banner as a logged-in clinician would.
 */
test.describe('System banner', () => {
  test('[SB-0010] banner enabled on central displays on facility frontend and dismissal sticks', async ({
    browser,
    page,
  }) => {
    test.setTimeout(180_000);

    const email = process.env.TEST_EMAIL;
    const password = process.env.TEST_PASSWORD;
    if (!email || !password) {
      throw new Error('TEST_EMAIL and TEST_PASSWORD must be set');
    }

    // Admin context: fresh, no shared storageState since admin frontend is a
    // different origin from the one the facility auth setup populated.
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await new AdminLoginPage(adminPage).login(email, password);
    const adminSettings = new AdminSettingsPage(adminPage);
    await adminSettings.open();

    try {
      await adminSettings.setBanner({
        message: TEST_BANNER_MESSAGE,
        severity: 'warning',
      });

      // Facility context: use the storageState-authenticated page provided by
      // the project fixture and reload so the just-updated settings are picked
      // up. Settings push is debounced by ~1s in SettingsRefresher; reload is
      // the simplest deterministic wait.
      await goToFacilityFrontend(page);
      await page.reload();

      const banner = page.getByTestId('system-banner');
      await expect(banner).toBeVisible({ timeout: 30_000 });
      await expect(banner).toContainText(TEST_BANNER_MESSAGE);

      // Dismissal — banner should disappear immediately and stay gone on
      // reload because dismissal is persisted in localStorage.
      await page.getByTestId('system-banner-dismiss').click();
      await expect(banner).toBeHidden();
      await page.reload();
      await expect(page.getByTestId('system-banner')).toBeHidden();

      // Editing the banner content must reset dismissals for everyone (the
      // dismissal key is derived from message + expiresAt).
      await adminSettings.setBanner({
        message: `${TEST_BANNER_MESSAGE} v2`,
        severity: 'warning',
      });
      await page.reload();
      await expect(page.getByTestId('system-banner')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('system-banner')).toContainText(`${TEST_BANNER_MESSAGE} v2`);
    } finally {
      await adminSettings.clearBanner();
      await adminContext.close();
    }
  });

  test('[SB-0011] expired banner is not displayed', async ({ browser, page }) => {
    test.setTimeout(180_000);

    const email = process.env.TEST_EMAIL;
    const password = process.env.TEST_PASSWORD;
    if (!email || !password) {
      throw new Error('TEST_EMAIL and TEST_PASSWORD must be set');
    }

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await new AdminLoginPage(adminPage).login(email, password);
    const adminSettings = new AdminSettingsPage(adminPage);
    await adminSettings.open();

    try {
      // ExpiresAt in the past — banner must not appear even with enabled=true.
      const pastExpiry = new Date(Date.now() - 60 * 60 * 1000);
      await adminSettings.setBanner({
        message: `${TEST_BANNER_MESSAGE} expired`,
        severity: 'info',
        expiresAt: pastExpiry,
      });

      await goToFacilityFrontend(page);
      await page.reload();

      // Give the SettingsRefresher debounce window to settle and the component
      // to render; then assert the banner is not visible.
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('system-banner')).toBeHidden();
    } finally {
      await adminSettings.clearBanner();
      await adminContext.close();
    }
  });
});
