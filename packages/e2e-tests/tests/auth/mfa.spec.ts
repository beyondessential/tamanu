import { URI } from 'otpauth';
import type { Page } from '@playwright/test';

import { test, expect } from '../../fixtures/virtualAuthenticator';
import { LoginPage, MfaLoginPage, SidebarPage } from '../../pages';
import { MfaSettingsPage } from '../../pages/MfaSettingsPage';
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
 *   MFA_SELFSERVICE_EMAIL/PASSWORD  a user with `write Mfa` but NOT
 *                                `require Mfa`, no factor enrolled — for the
 *                                voluntary enrol-then-challenged journey
 *   MFA_INVITE_EMAIL/PASSWORD    a user with NO MFA permissions and no factor
 *                                — the enrolment-invite journey target
 *   MFA_CENTRAL_URL              central server base URL (invite generation
 *                                and cleanup go through its admin API)
 *   MFA_ADMIN_EMAIL/PASSWORD     central admin with write UserMfa
 *
 * Run against an isolated stack with MFA enabled and the rpid set to the
 * frontend's domain stem (e.g. `localhost` for local dev — WebAuthn permits
 * localhost without HTTPS).
 *
 * Not covered here: the self-service TOTP (authenticator app) modal journey.
 * This suite drives the facility frontend, where authenticator apps are
 * deliberately managed centrally; the TOTP enrol/challenge UI itself is
 * covered by the forced-enrolment journey ([MFA-0002]). Driving the central
 * webapp's modal needs a central-frontend harness this suite doesn't have.
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
const selfServiceEmail = process.env.MFA_SELFSERVICE_EMAIL ?? '';
const selfServicePassword = process.env.MFA_SELFSERVICE_PASSWORD ?? '';
const inviteEmail = process.env.MFA_INVITE_EMAIL ?? '';
const invitePassword = process.env.MFA_INVITE_PASSWORD ?? '';
const centralUrl = process.env.MFA_CENTRAL_URL ?? '';
const adminEmail = process.env.MFA_ADMIN_EMAIL ?? '';
const adminPassword = process.env.MFA_ADMIN_PASSWORD ?? '';

// enter credentials and wait for the paused-login interstitial (MFA holds the
// login rather than reaching the dashboard)
const startPausedLogin = async (
  page: Page,
  mfaLoginPage: MfaLoginPage,
  email: string,
  password: string,
) => {
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

  test('[MFA-0003] self-service passkey enrolment, then a non-forced challenge', async ({
    page,
  }) => {
    test.skip(
      !selfServiceEmail,
      'set MFA_SELFSERVICE_EMAIL/PASSWORD (write Mfa, not require Mfa, no factor) to run',
    );
    const settingsPage = new MfaSettingsPage(page);

    // a non-required user with no factor logs straight in — no interstitial
    await new LoginPage(page).goto();
    await page.locator('input[name="email"]').fill(selfServiceEmail);
    await page.locator('input[name="password"]').fill(selfServicePassword);
    await page.getByTestId('loginbutton-gx21').click();
    await expect(page).toHaveURL(constructFacilityUrl(routes.dashboard));

    // voluntarily enrol a passkey via the kebab modal; this exercises the
    // facility's local registration ceremony
    await settingsPage.openFromKebab();
    // on a facility frontend, authenticator apps are managed centrally
    await expect(settingsPage.totpCentralOnlyNote).toBeVisible();
    await settingsPage.addPasskey(1, 'E2E test key');
    await expect(settingsPage.passkeyRows.first()).toContainText('E2E test key');
    await page.keyboard.press('Escape');

    // having a factor now means the next login is challenged, even though the
    // role doesn't require MFA — enrolment without enforcement would be a
    // silent downgrade
    await new SidebarPage(page).logOutButton.click();
    const loginPage = new MfaLoginPage(page);
    await startPausedLogin(page, loginPage, selfServiceEmail, selfServicePassword);
    await loginPage.usePasskey();
    await expect(page).toHaveURL(constructFacilityUrl(routes.dashboard));

    // remove the passkey again so the user is back to password-only and the
    // test is re-runnable; the login after that must NOT pause
    await settingsPage.openFromKebab();
    await settingsPage.removeFirstPasskey(0);
    await page.keyboard.press('Escape');
    await new SidebarPage(page).logOutButton.click();
    await new LoginPage(page).goto();
    await page.locator('input[name="email"]').fill(selfServiceEmail);
    await page.locator('input[name="password"]').fill(selfServicePassword);
    await page.getByTestId('loginbutton-gx21').click();
    await expect(page).toHaveURL(constructFacilityUrl(routes.dashboard));
  });

  test('[MFA-0004] enrolment invite: admin issues, user redeems at the login screen', async ({
    page,
  }) => {
    test.skip(
      !inviteEmail || !centralUrl || !adminEmail,
      'set MFA_INVITE_EMAIL/PASSWORD, MFA_CENTRAL_URL and MFA_ADMIN_EMAIL/PASSWORD to run',
    );

    // arrange via the central admin API: find the target user and mint an
    // invite, exactly as the admin panel's button would
    const loginResponse = await page.request.post(`${centralUrl}/api/login`, {
      data: { email: adminEmail, password: adminPassword, deviceId: 'e2e-mfa-admin' },
    });
    expect(loginResponse.ok()).toBeTruthy();
    const { token: adminToken } = await loginResponse.json();
    const authHeaders = { authorization: `Bearer ${adminToken}` };

    const usersResponse = await page.request.get(
      `${centralUrl}/api/admin/users?email=${encodeURIComponent(inviteEmail)}`,
      { headers: authHeaders },
    );
    const { data: userRows } = await usersResponse.json();
    const targetUser = userRows.find((row: { email: string }) => row.email === inviteEmail);
    expect(targetUser).toBeTruthy();

    const inviteResponse = await page.request.post(
      `${centralUrl}/api/admin/users/${targetUser.id}/mfa/enrolInvite`,
      { headers: authHeaders },
    );
    expect(inviteResponse.ok()).toBeTruthy();
    const { token: inviteToken } = await inviteResponse.json();

    try {
      // redeem from the login screen and enrol a passkey
      await new LoginPage(page).goto();
      await page.getByTestId('mfa-invite-link').click();
      await expect(page.getByTestId('mfa-invite-form')).toBeVisible();
      await page.getByTestId('mfa-invite-email').locator('input').fill(inviteEmail);
      await page.getByTestId('mfa-invite-password').locator('input').fill(invitePassword);
      await page.getByTestId('mfa-invite-token').locator('input').fill(inviteToken);
      await page.getByTestId('mfa-invite-redeem').click();

      await expect(page.getByTestId('mfa-invite-passkey')).toBeVisible();
      await page.getByTestId('mfa-invite-passkey').click();
      await expect(page.getByTestId('mfa-invite-done')).toBeVisible();
      await page.getByTestId('mfa-invite-done').click();

      // the freshly-enrolled factor now challenges the login
      const loginPage = new MfaLoginPage(page);
      await startPausedLogin(page, loginPage, inviteEmail, invitePassword);
      await loginPage.usePasskey();
      await expect(page).toHaveURL(constructFacilityUrl(routes.dashboard));
    } finally {
      // reset the user's factors so the journey is re-runnable
      await page.request.delete(`${centralUrl}/api/admin/users/${targetUser.id}/mfa`, {
        headers: authHeaders,
      });
    }
  });
});
