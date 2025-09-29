import { Page, Locator } from '@playwright/test';

export abstract class BaseNoteModal {
  readonly page: Page;
  
  // Common form fields
  readonly writtenByInput!: Locator;
  readonly dateTimeInput!: Locator;
  readonly noteContentTextarea!: Locator;
  
  // Common action buttons
  readonly confirmButton!: Locator;
  readonly cancelButton!: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // TestId mapping for BaseNoteModal elements
    const testIds = {
      confirmButton: 'formsubmitcancelrow-confirmButton',
    } as const;

    // Create locators using the testId mapping
    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }
    
    // Special cases that need additional processing
    this.writtenByInput = page.getByTestId('field-ar9q-input').locator('input');
    this.dateTimeInput = page.getByTestId('field-nwwl-input').locator('input');
    this.noteContentTextarea = page.getByTestId('field-wxzr').locator('textarea').nth(0);
    this.cancelButton = page.getByRole('dialog').getByTestId('outlinedbutton-8rnr');
  }

  // Common methods
  async waitForModalToLoad() {
    await this.confirmButton.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async waitForModalToClose() {
    await this.confirmButton.waitFor({ state: 'detached' });
  }

}
