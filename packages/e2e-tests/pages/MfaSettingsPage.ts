import { expect, Locator, Page } from '@playwright/test';

/**
 * The self-service "Two-factor authentication" modal, reached from the
 * sidebar kebab menu. Locators key off the testids in MfaSettingsModal and
 * KebabMenu.
 */
export class MfaSettingsPage {
  readonly page: Page;
  readonly kebabButton: Locator;
  readonly menuItem: Locator;
  readonly modal: Locator;
  readonly addPasskeyButton: Locator;
  readonly passkeyRows: Locator;
  readonly totpCentralOnlyNote: Locator;

  constructor(page: Page) {
    this.page = page;
    this.kebabButton = page.getByTestId('stylediconbutton-5r5o');
    this.menuItem = page.getByTestId('kebabmenuitem-mfa');
    this.modal = page.getByTestId('mfa-settings-modal');
    this.addPasskeyButton = page.getByTestId('mfa-add-passkey');
    this.passkeyRows = page.getByTestId('mfa-passkey-row');
    this.totpCentralOnlyNote = page.getByTestId('mfa-totp-central-only');
  }

  async openFromKebab() {
    await this.kebabButton.click();
    await this.menuItem.click();
    await expect(this.modal).toBeVisible();
  }

  /** Run the add-passkey ceremony and wait for the new row to appear. */
  async addPasskey(expectedCount: number, name?: string) {
    if (name) {
      await this.page.getByTestId('mfa-passkey-name').locator('input').fill(name);
    }
    await this.addPasskeyButton.click();
    await expect(this.passkeyRows).toHaveCount(expectedCount);
  }

  /** Remove the first listed passkey, confirming the prompt. */
  async removeFirstPasskey(remainingCount: number) {
    await this.passkeyRows.first().getByTestId('mfa-passkey-remove').click();
    await this.page
      .getByTestId('mfa-remove-confirm')
      .getByRole('button', { name: 'Confirm' })
      .click();
    await expect(this.passkeyRows).toHaveCount(remainingCount);
  }
}
