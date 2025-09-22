import { Page, Locator } from '@playwright/test';

export class DiscardNoteModal {
  readonly page: Page;
  readonly cancelButton: Locator;
  readonly confirmButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cancelButton = page.getByTestId('outlinedbutton-p957');
    this.confirmButton = page.getByTestId('confirmbutton-y3tb');
  }

  async waitForModalToLoad() {
    await this.confirmButton.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async waitForModalToClose() {
    await this.confirmButton.waitFor({ state: 'detached' });
  }
}


