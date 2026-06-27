import { Locator, Page } from '@playwright/test';
import { MedicationDiscontinueModal } from './MedicationDiscontinueModal';

export class MedicationDetailsModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly discontinueButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog').first();
    this.discontinueButton = this.dialog.getByRole('button', { name: 'Discontinue' });
  }

  async waitForModalToLoad(): Promise<void> {
    await this.dialog.waitFor({ state: 'visible' });
  }

  async clickDiscontinue(): Promise<MedicationDiscontinueModal> {
    await this.discontinueButton.click();
    const discontinueModal = new MedicationDiscontinueModal(this.page);
    await discontinueModal.waitForModalToLoad();
    return discontinueModal;
  }
}
