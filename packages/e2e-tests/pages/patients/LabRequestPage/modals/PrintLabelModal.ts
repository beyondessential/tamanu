import { Locator, Page } from '@playwright/test';

export class PrintLabelModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly labelPrintFrame: Locator;
  readonly printLabelsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog').filter({ hasText: 'Print label' });
    this.labelPrintFrame = page.getByTestId('lab-request-label-print-frame');
    this.printLabelsButton = this.dialog.getByRole('button', { name: 'Print labels' });
  }

  async waitForModalToLoad(): Promise<void> {
    await this.printLabelsButton.waitFor({ state: 'visible' });
  }
}
