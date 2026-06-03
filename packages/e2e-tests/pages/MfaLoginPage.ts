import { Locator, Page } from '@playwright/test';

import { BasePage } from './BasePage';
import { routes } from '../config/routes';
import { constructFacilityUrl } from '../utils/navigation';

/**
 * The MFA interstitial shown by LoginView when a login is paused for a second
 * factor (challenge) or forced enrolment. Locators key off the testids set in
 * MfaLoginForm.
 */
export class MfaLoginPage extends BasePage {
  readonly form: Locator;
  readonly passkeyButton: Locator;
  readonly useAuthenticatorAppLink: Locator;
  readonly totpQr: Locator;
  readonly totpCodeInput: Locator;
  readonly totpSubmit: Locator;

  constructor(page: Page) {
    super(page, routes.login);
    this.form = page.getByTestId('mfa-loginform');
    this.passkeyButton = page.getByTestId('mfa-passkey-button');
    this.useAuthenticatorAppLink = page.getByTestId('mfa-use-totp');
    this.totpQr = page.getByTestId('mfa-totp-qr');
    this.totpCodeInput = page.getByTestId('mfa-totp-code').locator('input');
    this.totpSubmit = page.getByTestId('mfa-totp-submit');
  }

  async usePasskey() {
    await this.passkeyButton.click();
    await this.page.waitForURL(constructFacilityUrl(routes.dashboard));
  }

  async chooseAuthenticatorApp() {
    await this.useAuthenticatorAppLink.click();
  }

  async submitTotpCode(code: string) {
    await this.totpCodeInput.fill(code);
    await this.totpSubmit.click();
  }

  /**
   * Choose the authenticator app and capture the otpauth:// URI from the
   * enrolment response, so the test can compute valid codes (the URI is
   * rendered only as a QR in the UI). Returns the URI.
   */
  async startTotpEnrolment(): Promise<string> {
    const [response] = await Promise.all([
      this.page.waitForResponse(res => res.url().includes('/mfa/login/totp/enrol')),
      this.useAuthenticatorAppLink.click(),
    ]);
    const { otpauthUrl } = await response.json();
    return otpauthUrl;
  }
}
