import { URI } from 'otpauth';

import { test, expect } from '../../fixtures/virtualAuthenticator';
import { LoginPage, MfaLoginPage, SidebarPage } from '../../pages';
import { routes } from '../../config/routes';
import { constructFacilityUrl } from '../../utils/navigation';

/**
 * MFA login journeys, driven through the real UI with a WebAuthn virtual
 * authenticator (passkeys) and computed TOTP codes.
 *
 * These need a deployment seeded for MFA, which the shared E2E env is not by
 * default: `auth.mfa.enabled` is global, so turning it on would force MFA on
 * every other spec's user, and a `require Mfa` test user needs a permission
 * that can only be provisioned out of band (not via the admin API). So the
 * suite is opt-in via env and skipped otherwise:
 *
 *   RUN_MFA_E2E=true             enable the suite
 *   MFA_REQUIRED_EMAIL/PASSWORD  a user whose role carries `require Mfa`
 *                                (so login forces enrolment), with no factor
 *                                enrolled yet
 *
 * Run against an isolated stack with MFA enabled and the rpid set to the
 * frontend's domain stem (e.g. `localhost` for local dev — WebAuthn permits
 * localhost without HTTPS).
 */

const shouldRun = process.env.RUN_MFA_E2E === 'true';
// the passkey journey and the TOTP journey each need their OWN require-Mfa
// user that starts with no factor — they can't share one, because once the
// first test enrols a factor that user is challenged (not force-enrolled) on
// subsequent logins
const passkeyEmail = process.env.MFA_REQUIRED_EMAIL ?? '';
const passkeyPassword = process.env.MFA_REQUIRED_PASSWORD ?? '';
const totpEmail = process.env.MFA_TOTP_EMAIL ?? '';
const totpPassword = process.env.MFA_TOTP_PASSWORD ?? '';

// enter credentials and wait for the paused-login interstitial (MFA holds the
// login rather than reaching the dashboard)
const startPausedLogin = async (page, mfaLoginPage, email: string, password: string) => {
  await new LoginPage(page).goto();
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByTestId('loginbutton-gx21').click();
  await expect(mfaLoginPage.form).toBeVisible();
};

test.describe('MFA login', () => {
  test.skip(!shouldRun, 'set RUN_MFA_E2E=true and seed an MFA deployment to run');
  // not the shared logged-in user: these start from the login screen
  test.use({ storageState: { cookies: [], origins: [] } });

  test('[MFA-0001] forced enrolment of a passkey, then passkey login', async ({
    page,
    virtualAuthenticator,
  }) => {
    const loginPage = new MfaLoginPage(page);
    await startPausedLogin(page, loginPage, passkeyEmail, passkeyPassword);

    // first login: forced to enrol — the interstitial leads with the passkey
    await expect(loginPage.passkeyButton).toBeVisible();
    await loginPage.usePasskey();
    await expect(page).toHaveURL(constructFacilityUrl(routes.dashboard));

    // a credential now exists on the virtual authenticator
    const { credentials } = await virtualAuthenticator.client.send('WebAuthn.getCredentials', {
      authenticatorId: virtualAuthenticator.authenticatorId,
    });
    expect(credentials.length).toBe(1);

    // log out and back in: now a challenge, not enrolment, completed by the
    // same passkey
    await new SidebarPage(page).logOutButton.click();
    await startPausedLogin(page, loginPage, passkeyEmail, passkeyPassword);
    await loginPage.usePasskey();
    await expect(page).toHaveURL(constructFacilityUrl(routes.dashboard));
  });

  test('[MFA-0002] forced enrolment of an authenticator app (TOTP)', async ({ page }) => {
    test.skip(!totpEmail, 'set MFA_TOTP_EMAIL/PASSWORD (a separate no-factor user) to run');
    const loginPage = new MfaLoginPage(page);
    await startPausedLogin(page, loginPage, totpEmail, totpPassword);

    // capture the otpauth URI from the enrol response so we can compute a code
    const otpauthUrl = await loginPage.startTotpEnrolment();
    await expect(loginPage.totpQr).toBeVisible();

    const totp = URI.parse(otpauthUrl);
    // a wrong code is rejected inline, the interstitial stays
    await loginPage.submitTotpCode('000000');
    await expect(loginPage.form).toBeVisible();

    await loginPage.submitTotpCode(totp.generate());
    await expect(page).toHaveURL(constructFacilityUrl(routes.dashboard));
  });
});
