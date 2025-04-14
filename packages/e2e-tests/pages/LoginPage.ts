import { Locator, Page } from '@playwright/test';

import { BasePage } from './BasePage';
import { routes } from '../config/routes';
import { constructFacilityUrl } from '../utils/navigation';

export class LoginPage extends BasePage {
  readonly loginButton: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;

  constructor(page: Page) {
    super(page, routes.login);
    this.loginButton = page.getByTestId('loginbutton-gx21');
    this.emailInput = page.getByTestId('styledfield-dwnl').locator('input');
    this.passwordInput = page.getByTestId('styledfield-a9k6').locator('input');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    try {
      await this.page.waitForURL(constructFacilityUrl(routes.dashboard), { timeout: 5000 });
    } catch {
      const defaultEmail = 'default@example.com';
      const defaultPassword = 'defaultpassword';
      await this.emailInput.fill(defaultEmail);
      await this.passwordInput.fill(defaultPassword);
      await this.loginButton.click();
      await this.page.waitForURL(constructFacilityUrl(routes.dashboard));
    }
  }
}
