import { Locator, Page } from '@playwright/test';
import { facilityUrl, routes } from '@helpers/navigation';
import { ids } from '@ids';

export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(readonly page: Page) {
    this.emailInput = page.getByTestId(ids.login.emailInput).locator('input');
    this.passwordInput = page.getByTestId(ids.login.passwordInput).locator('input');
    this.loginButton = page.getByTestId(ids.login.button);
  }

  async goto(): Promise<void> {
    await this.page.goto(facilityUrl(routes.login));
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForURL(`**${routes.dashboard}`);
  }
}
