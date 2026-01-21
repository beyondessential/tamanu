import { Locator, Page, expect } from '@playwright/test';

export class PrintPrescriptionModal {
  readonly page: Page;
  readonly prescriptionModal!: Locator;
  readonly modalTitle!: Locator;
  readonly modalTitleText!: Locator;
  readonly closeButton!: Locator;

  constructor(page: Page) {
    this.page = page;

    const prescriptionTextElement = page
      .getByTestId('verticalcenteredtext-ni4s')
      .filter({ hasText: 'Prescription' });

    this.prescriptionModal = page
      .getByRole('dialog')
      .filter({ has: prescriptionTextElement });

    this.modalTitle = this.prescriptionModal.getByTestId('modaltitle-ojhf');
    this.modalTitleText = prescriptionTextElement;
    this.closeButton = this.prescriptionModal.getByTestId('iconbutton-eull');
  }

  async waitForModalToLoad(): Promise<void> {
    await this.modalTitleText.waitFor({ state: 'visible', timeout: 15000 });
    await expect(this.modalTitleText).toContainText('Prescription');
  }

  async close(): Promise<void> {
    await this.closeButton.click();
    await this.modalTitle.waitFor({ state: 'hidden', timeout: 10000 });
  }
}
