import { Page, Locator } from '@playwright/test';

export abstract class BaseNoteModal {
  readonly page: Page;
  
  // Common form fields
  readonly writtenByInput: Locator;
  readonly dateTimeInput: Locator;
  readonly noteContentTextarea: Locator;
  
  // Common action buttons
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Common form fields
    this.writtenByInput = page.getByTestId('field-ar9q-input').locator('input');
    this.dateTimeInput = page.getByTestId('field-nwwl-input').locator('input');
    this.noteContentTextarea = page.getByTestId('field-wxzr').locator('textarea').nth(0);
    
    // Common action buttons
    this.confirmButton = page.getByTestId('formsubmitcancelrow-confirmButton');
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
