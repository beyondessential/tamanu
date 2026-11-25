import { Locator, Page } from '@playwright/test';

import { PatientPortalBasePage } from './PatientPortalBasePage';
import { routes } from '../../config/routes';
import { constructPatientPortalUrl } from '../../utils/navigation';

/** Log in, where the patient asks for a code by email, then enters it. */
export class PortalLoginPage extends PatientPortalBasePage {
  readonly title: Locator;
  readonly emailInput: Locator;
  readonly sendCodeButton: Locator;
  readonly emailSentText: Locator;
  readonly codeInput: Locator;
  readonly logInButton: Locator;
  readonly invalidCodeText: Locator;

  constructor(page: Page) {
    super(page, routes.patientPortal.login);
    this.title = page.getByRole('heading', { name: 'Log in' });
    this.emailInput = page.getByLabel('Email');
    this.sendCodeButton = page.getByRole('button', { name: 'Send code' });
    this.emailSentText = page.getByText(/^Email sent to /);
    this.codeInput = page.locator('input[name="verificationCode"]');
    this.logInButton = page.getByRole('button', { name: 'Log in', exact: true });
    this.invalidCodeText = page.getByText('Invalid verification code');
  }

  async requestCode(email: string) {
    await this.emailInput.fill(email);
    await this.sendCodeButton.click();
    await this.page.waitForURL(constructPatientPortalUrl(routes.patientPortal.loginSubmit));
  }

  async enterCode(code: string) {
    await this.codeInput.fill(code);
    await this.logInButton.click();
  }
}
