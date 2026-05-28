import { Locator, Page } from '@playwright/test';

const adminFrontend = process.env.ADMIN_FRONTEND_URL ?? 'http://localhost:5174';

/**
 * Login page object for the admin frontend (central). The shared
 * `tests/setup/auth.setup.ts` only authenticates against the facility
 * frontend, so tests that need admin-side state do their own inline login
 * via this page object.
 */
export class AdminLoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.getByTestId('loginbutton-gx21');
  }

  async login(email: string, password: string) {
    await this.page.goto(adminFrontend);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForLoadState('networkidle');
  }
}
