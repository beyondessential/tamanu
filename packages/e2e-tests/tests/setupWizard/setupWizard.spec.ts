import { expect } from '@playwright/test';

import { test } from '../../fixtures/baseFixture';
import { SetupWizardPage } from '../../pages';

/**
 * The facility setup wizard only appears on an *unconfigured* server
 * (public/ping → setupRequired). The e2e stack only has a configured facility,
 * so we stub the status + setup endpoints at the browser boundary to render the
 * first-run screen and exercise its client-side behaviour — the parts the
 * server-side unit/integration tests can't see: facility-id de-duplication and
 * trimming of the submitted payload, the in-flight submit state, and error
 * handling that keeps the banner and the entered values.
 *
 * A clean (unauthenticated) storage state is used so the app boots to the
 * wizard rather than a stored dashboard session.
 */
test.describe('facility setup wizard', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    // Force the wizard regardless of the real server's configured state.
    await page.route('**/api/public/ping', route =>
      route.fulfill({ json: { setupRequired: true } }),
    );
  });

  test('trims and de-duplicates facility ids, and disables submit in flight', async ({ page }) => {
    const wizard = new SetupWizardPage(page);

    let submitted: Record<string, unknown> | undefined;
    await page.route('**/api/public/setup/sync', async route => {
      submitted = route.request().postDataJSON();
      // Hold the response so the in-flight disabled state is observable.
      await new Promise(resolve => {
        setTimeout(resolve, 500);
      });
      await route.fulfill({ json: { success: true } });
    });

    await wizard.goto();
    await expect(wizard.heading).toBeVisible();

    await wizard.host.fill('  https://central.example  ');
    await wizard.email.fill('  admin@tamanu.io  ');
    await wizard.password.fill('secret');
    await wizard.fillFacilityId(0, ' facility-a ');
    await wizard.fillFacilityId(1, 'facility-a'); // duplicate of row 0 once trimmed
    await wizard.fillFacilityId(2, ' facility-b');

    await wizard.submit.click();

    // Connect button is disabled while the request is in flight (no double submit).
    await expect(wizard.submit).toBeDisabled();

    await expect.poll(() => submitted).toBeTruthy();
    // Payload is trimmed and de-duplicated by the client before it hits the wire.
    expect(submitted).toMatchObject({
      host: 'https://central.example',
      email: 'admin@tamanu.io',
      facilityIds: ['facility-a', 'facility-b'],
    });
  });

  test('keeps the error banner and entered values after a failed submit', async ({ page }) => {
    const wizard = new SetupWizardPage(page);

    await page.route('**/api/public/setup/sync', route =>
      route.fulfill({
        status: 403,
        json: { error: { message: 'Setup is only available from the local network' } },
      }),
    );

    await wizard.goto();
    await expect(wizard.heading).toBeVisible();

    await wizard.host.fill('https://central.example');
    await wizard.email.fill('admin@tamanu.io');
    await wizard.password.fill('secret');
    await wizard.fillFacilityId(0, 'facility-a');

    await wizard.submit.click();

    // Error banner stays visible; the form keeps everything the user typed so
    // they can fix the problem and retry without re-entering it.
    await expect(wizard.errorBanner).toBeVisible();
    await expect(wizard.host).toHaveValue('https://central.example');
    await expect(wizard.email).toHaveValue('admin@tamanu.io');
    await expect(wizard.facilityId(0)).toHaveValue('facility-a');
    await expect(wizard.submit).toBeEnabled();
  });
});
