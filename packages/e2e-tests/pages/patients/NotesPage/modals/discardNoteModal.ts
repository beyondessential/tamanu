import { Page, Locator } from '@playwright/test';
import { assignTestIdLocators } from '@utils/locatorFactory';
import { waitForModalOpen, waitForModalClose } from '@utils/dialogHelpers';

export class DiscardNoteModal {
  readonly page: Page;
  readonly cancelButton!: Locator;
  readonly confirmButton!: Locator;

  constructor(page: Page) {
    this.page = page;

    assignTestIdLocators(this, page, {
      cancelButton: 'outlinedbutton-p957',
      confirmButton: 'confirmbutton-y3tb',
    });
  }

  async waitForModalToLoad() {
    await waitForModalOpen(this.confirmButton, this.page);
  }

  async waitForModalToClose() {
    await waitForModalClose(this.confirmButton);
  }
}


