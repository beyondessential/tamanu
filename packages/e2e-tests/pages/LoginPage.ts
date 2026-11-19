import { Locator, Page } from '@playwright/test';

import { BasePage } from './BasePage';
import { routes } from '../config/routes';
import { constructFacilityUrl } from '../utils/navigation';

export class LoginPage extends BasePage {
  readonly loginButton: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly dashboardTopBar: Locator;

  constructor(page: Page) {
    super(page, routes.login);
    this.loginButton = page.getByTestId('loginbutton-gx21');
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.dashboardTopBar = page.getByTestId('topbarcontainer-v4hx');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForURL(constructFacilityUrl(routes.dashboard));
    // The URL changes before the dashboard renders, and the sidebar then shuts any open section
    await this.dashboardTopBar.waitFor();
  }
}
