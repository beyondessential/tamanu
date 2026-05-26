import { Locator, Page } from '@playwright/test';

export class DispenseMedicationModal {
  readonly page: Page;
  readonly dispenseWithoutLabelsButton: Locator;
  readonly reviewAndPrintButton: Locator;
  readonly backButton: Locator;
  readonly cancelButton: Locator;
  readonly dispenseAndPrintButton: Locator;
  readonly dispensedByInput: Locator;
  readonly selectAllCheckbox: Locator;
  readonly patientSummaryPanel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dispenseWithoutLabelsButton = page.getByTestId('dispense-without-labels-button');
    this.reviewAndPrintButton = page.getByTestId('dispense-review-button');
    this.backButton = page.getByTestId('dispense-review-back-button');
    this.cancelButton = page.getByTestId('dispense-cancel-button');
    this.dispenseAndPrintButton = page.getByTestId('dispense-and-print-button');
    this.dispensedByInput = page.getByTestId('dispense-dispensed-by-input');
    this.selectAllCheckbox = page.getByTestId('dispense-select-all-checkbox');
    this.patientSummaryPanel = page.getByTestId('dispense-modal-patient-context');
  }

  getRowCheckbox(rowIndex: number): Locator {
    return this.page.getByTestId(`dispense-row-checkbox-${rowIndex}`);
  }

  async waitForModalToLoad(): Promise<void> {
    await this.dispenseWithoutLabelsButton.waitFor({ state: 'visible' });
  }
}
