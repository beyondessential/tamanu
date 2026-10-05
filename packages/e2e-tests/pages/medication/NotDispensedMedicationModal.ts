import { Locator, Page } from '@playwright/test';
import { selectAutocompleteFieldOption } from '@utils/fieldHelpers';

export class NotDispensedMedicationModal {
  readonly page: Page;
  readonly reasonField: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.reasonField = page.getByTestId('not-dispensed-reason-input');
    this.confirmButton = page.getByTestId('confirmbutton-tok1');
    this.cancelButton = page.getByTestId('outlinedbutton-95wy');
  }

  async waitForModalToLoad(): Promise<void> {
    await this.reasonField.waitFor({ state: 'visible' });
  }

  // The reason is mandatory and has no default, so it must be selected before confirming.
  async selectReason(): Promise<void> {
    await selectAutocompleteFieldOption(this.page, this.reasonField, { selectFirst: true });
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
    await this.confirmButton.waitFor({ state: 'hidden' });
  }
}
