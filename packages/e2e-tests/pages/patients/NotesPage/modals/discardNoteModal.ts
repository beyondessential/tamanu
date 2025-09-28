import { Page, Locator } from '@playwright/test';

export class DiscardNoteModal {
  readonly page: Page;
  readonly cancelButton!: Locator;
  readonly confirmButton!: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // TestId mapping for DiscardNoteModal elements
    const testIds = {
      cancelButton: 'outlinedbutton-p957',
      confirmButton: 'confirmbutton-y3tb',
    } as const;

    // Create locators using the testId mapping
    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }
  }

  async waitForModalToLoad() {
    await this.confirmButton.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async waitForModalToClose() {
    await this.confirmButton.waitFor({ state: 'detached' });
  }
}


