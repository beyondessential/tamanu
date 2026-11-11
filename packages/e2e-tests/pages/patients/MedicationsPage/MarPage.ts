import { Locator, Page } from '@playwright/test';

export class MarPage {
  readonly page: Page;
  readonly scheduledMedicationRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.scheduledMedicationRows = page
      .getByRole('rowgroup')
      .filter({ hasText: 'Scheduled medication' })
      .getByRole('rowheader')
      .filter({ has: page.getByTestId('mar-dosage') });
  }

  statLabel(row: Locator): Locator {
    return row.getByTestId('mar-stat');
  }

  async waitForPageToLoad(): Promise<void> {
    await this.scheduledMedicationRows.first().waitFor({ state: 'visible' });
  }
}
