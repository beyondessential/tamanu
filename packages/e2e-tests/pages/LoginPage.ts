import { Locator, Page } from '@playwright/test';

import { BasePage } from './BasePage';
import { routes } from '../config/routes';

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
    await this.page.waitForURL(routes.dashboard);
  }
}
