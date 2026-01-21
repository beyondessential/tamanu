import { Locator, Page, expect } from '@playwright/test';

export class PrintPrescriptionModal {
  readonly page: Page;
  readonly modalTitle!: Locator;
  readonly modalTitleText!: Locator;
  readonly closeButton!: Locator;

  constructor(page: Page) {
    this.page = page;

    const prescriptionModal = page.getByRole('dialog').filter({
      has: page.getByTestId('verticalcenteredtext-ni4s').filter({ hasText: 'Prescription' }),
    });

    this.modalTitle = prescriptionModal.getByTestId('modaltitle-ojhf');
    this.modalTitleText = prescriptionModal.getByTestId('verticalcenteredtext-ni4s');
    this.closeButton = prescriptionModal.getByTestId('iconbutton-eull');
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
