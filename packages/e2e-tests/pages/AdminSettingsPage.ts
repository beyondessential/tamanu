import { Locator, Page, expect } from '@playwright/test';
import { format } from 'date-fns';

import { fillMuiDateTimeField } from '../utils/dateTimeHelpers';

const adminFrontend = process.env.ADMIN_FRONTEND_URL ?? 'http://localhost:5174';

/**
 * Page object for the admin settings editor. Used by the system banner tests
 * to drive both the new DATETIME setting editor and the banner setting itself.
 *
 * The admin frontend (port 5174 by default) talks to the central server and is
 * served by a separate Vite build from the facility frontend. Login is
 * handled separately by AdminLoginPage — pass an already-authenticated page
 * to this constructor.
 */
export class AdminSettingsPage {
  readonly page: Page;

  readonly bannerEnabledSwitch: Locator;
  readonly bannerMessageInput: Locator;
  readonly bannerSeverityInput: Locator;
  readonly bannerExpiresAtInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // banner.* settings are emitted by Category.jsx with a deterministic data-testid
    // derived from the dotted setting path (dots replaced with dashes).
    this.bannerEnabledSwitch = page
      .getByTestId('settinginput-2wuw-banner-enabled')
      .locator('input[type="checkbox"]');
    this.bannerMessageInput = page
      .getByTestId('settinginput-2wuw-banner-message')
      .locator('input, textarea')
      .first();
    this.bannerSeverityInput = page
      .getByTestId('settinginput-2wuw-banner-severity')
      .locator('input')
      .first();
    this.bannerExpiresAtInput = page
      .getByTestId('settinginput-2wuw-banner-expiresAt')
      .locator('input')
      .first();
    this.saveButton = page.getByRole('button', { name: /^Save$/ });
  }

  async open() {
    await this.page.goto(`${adminFrontend}/#/admin/settings`);
    await expect(this.bannerEnabledSwitch).toBeVisible({ timeout: 30_000 });
  }

  /**
   * Fills the datetime picker with a local-time value via the shared MUI
   * date-time helper. The picker is the new SETTING_EDITORS.DATETIME editor;
   * it emits UTC ISO 8601 via `Date.prototype.toISOString()` regardless of the
   * displayed format, so this exercise covers the round-trip.
   */
  async setExpiresAt(date: Date) {
    await fillMuiDateTimeField(this.bannerExpiresAtInput, format(date, "yyyy-MM-dd'T'HH:mm"));
  }

  /**
   * Saves and returns the request body that was sent to the central
   * `/admin/settings` endpoint. Caller can assert on the persisted shape
   * — particularly that expiresAt is a UTC ISO 8601 string.
   */
  async saveAndCaptureRequest(): Promise<{ settings: { banner?: Record<string, unknown> } }> {
    const requestPromise = this.page.waitForRequest(
      req => req.method() === 'PUT' && req.url().includes('/admin/settings'),
    );
    await this.saveButton.click();
    const request = await requestPromise;
    return request.postDataJSON();
  }

  async setBanner(opts: {
    message: string;
    severity?: 'info' | 'warning' | 'error';
    expiresAt?: Date | null;
  }) {
    if (!(await this.bannerEnabledSwitch.isChecked())) {
      await this.bannerEnabledSwitch.click();
    }
    await this.bannerMessageInput.fill(opts.message);
    if (opts.severity) {
      await this.bannerSeverityInput.fill(opts.severity);
    }
    if (opts.expiresAt) {
      await this.setExpiresAt(opts.expiresAt);
    }
    await this.saveButton.click();
    // Wait for the success toast to appear so we know the round-trip is done.
    await expect(this.page.getByText('Settings saved')).toBeVisible({ timeout: 15_000 });
  }

  async clearBanner() {
    if (await this.bannerEnabledSwitch.isChecked()) {
      await this.bannerEnabledSwitch.click();
    }
    await this.bannerMessageInput.fill('');
    await this.saveButton.click();
    await expect(this.page.getByText('Settings saved')).toBeVisible({ timeout: 15_000 });
  }
}
