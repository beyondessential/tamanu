import { Page, Locator } from '@playwright/test';

export class DiscardNoteModal {
  readonly page: Page;
  readonly modalContainer: Locator;
  readonly closeButton: Locator;
  readonly cancelButton: Locator;
  readonly confirmButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modalContainer = page.getByTestId('modalcontainer-uc2n');
    this.closeButton = page.getByTestId('iconbutton-eull');
    this.cancelButton = page.getByTestId('outlinedbutton-p957');
    this.confirmButton = page.getByTestId('confirmbutton-y3tb');
  }

  async waitForModalToLoad() {
    await this.modalContainer.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  // Action methods
  async clickConfirm() {
    await this.confirmButton.click();
  }

  async clickCancel() {
    await this.cancelButton.click();
  }

  async clickClose() {
    await this.closeButton.click();
  }

  async waitForModalToClose() {
    await this.modalContainer.waitFor({ state: 'detached' });
  }
}


