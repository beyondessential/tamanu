import { test, expect } from '@playwright/test';
import { AdminLoginPage } from '../../pages/AdminLoginPage';
import { AdminSettingsPage } from '../../pages/AdminSettingsPage';

/**
 * Verifies the DATETIME setting editor used by the new banner.expiresAt
 * setting. The picker displays in the operator's local timezone but must
 * serialise to UTC ISO 8601 — otherwise operators in different timezones
 * would disagree about when the banner expires.
 *
 * Runs against the admin frontend (port 5174) which connects to central.
 */
test.describe('Admin settings: banner DATETIME editor', () => {
  // Login flow is exercised inline rather than via storageState because the
  // shared auth setup logs into the facility frontend, which is a different
  // origin from the admin frontend.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('[SB-0001] saves banner.expiresAt as a UTC ISO 8601 string', async ({ page }) => {
    test.setTimeout(120_000);
    const email = process.env.TEST_EMAIL;
    const password = process.env.TEST_PASSWORD;
    if (!email || !password) {
      throw new Error('TEST_EMAIL and TEST_PASSWORD must be set');
    }

    await new AdminLoginPage(page).login(email, password);
    const settingsPage = new AdminSettingsPage(page);
    await settingsPage.open();

    // Pick a deterministic time in the local browser timezone, well in the future.
    const localExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    localExpiry.setSeconds(0, 0);

    // Enable banner so the save isn't a no-op, fill required message field.
    if (!(await settingsPage.bannerEnabledSwitch.isChecked())) {
      await settingsPage.bannerEnabledSwitch.click();
    }
    await settingsPage.bannerMessageInput.fill('e2e expiresAt test');
    await settingsPage.setExpiresAt(localExpiry);

    const body = await settingsPage.saveAndCaptureRequest();
    const expiresAt = body.settings?.banner?.expiresAt;

    expect(typeof expiresAt).toBe('string');
    // Must end with 'Z' (UTC) — the editor uses Date.prototype.toISOString().
    expect(expiresAt as string).toMatch(/Z$/);
    // The instant we sent must equal the instant we picked, regardless of TZ
    // representation.
    expect(new Date(expiresAt as string).getTime()).toBe(localExpiry.getTime());

    // Cleanup
    await settingsPage.clearBanner();
  });
});
