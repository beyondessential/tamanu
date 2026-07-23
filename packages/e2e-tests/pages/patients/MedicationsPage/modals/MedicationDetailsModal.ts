import { Locator, Page } from '@playwright/test';
import { MedicationDiscontinueModal } from './MedicationDiscontinueModal';

export class MedicationDetailsModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly discontinueButton: Locator;
  readonly discontinuedStatus: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByTestId('dialog-g9qi');
    this.discontinueButton = page.getByTestId('medicationdetails-discontinue-button');
    // Once discontinued, the still-open details modal re-renders with this status header
    // (MedicationDetails.jsx).
    this.discontinuedStatus = page.getByTestId('medicationdetails-discontinued-status');
  }

  async waitForModalToLoad(): Promise<void> {
    await this.dialog.waitFor({ state: 'visible' });
    await this.discontinueButton.waitFor({ state: 'visible' });
  }

  async clickDiscontinue(): Promise<MedicationDiscontinueModal> {
    await this.discontinueButton.click();
    const discontinueModal = new MedicationDiscontinueModal(this.page);
    await discontinueModal.waitForModalToLoad();
    return discontinueModal;
  }

  async waitForDiscontinuedStatus(): Promise<void> {
    await this.discontinuedStatus.waitFor({ state: 'visible' });
  }
}
