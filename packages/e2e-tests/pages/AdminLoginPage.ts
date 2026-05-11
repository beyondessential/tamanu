import { Locator, Page } from '@playwright/test';

import { BasePage } from './BasePage';
import { constructAdminUrl } from '../utils/navigation';

export class AdminLoginPage extends BasePage {
  readonly loginButton: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;

  constructor(page: Page) {
    super(page);
    this.loginButton = page.getByTestId('loginbutton-gx21');
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
  }

  async goto() {
    await this.page.goto(constructAdminUrl('/'));
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForURL(/\/admin\//, { timeout: 30000 });
  }
}
