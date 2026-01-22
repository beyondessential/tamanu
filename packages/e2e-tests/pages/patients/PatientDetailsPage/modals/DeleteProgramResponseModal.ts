import { Locator, Page } from '@playwright/test';

export class DeleteProgramResponseModal {
  readonly page: Page;
  readonly modal!: Locator;
  readonly confirmButton!: Locator;
  readonly cancelButton!: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = this.page.getByTestId('confirmmodal-sg1c');
    this.confirmButton = this.modal.getByRole('button', { name: /delete form/i });
    this.cancelButton = this.modal.getByRole('button', { name: /cancel/i });
  }

  async waitForModalToLoad(): Promise<void> {
    await this.modal.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle');
  }
}
