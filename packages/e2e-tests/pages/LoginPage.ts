import { Locator, Page } from '@playwright/test';

import { BasePage } from './BasePage';
import { routes } from '../config/routes';
import { constructFacilityUrl, constructAdminUrl } from '../utils/navigation';

export class LoginPage extends BasePage {
  readonly loginButton: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;

  constructor(page: Page) {
    super(page, routes.login);
    this.loginButton = page.getByTestId('loginbutton-gx21');
    this.emailInput = page.getByTestId('styledfield-dwnl-input');
    this.passwordInput = page.getByTestId('styledfield-a9k6-input');
  }

  async login(email: string, password: string, url?: 'admin' | 'facility') {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForURL(url === 'admin' ? constructAdminUrl(routes.referenceData) : constructFacilityUrl(routes.dashboard));
  }
}
