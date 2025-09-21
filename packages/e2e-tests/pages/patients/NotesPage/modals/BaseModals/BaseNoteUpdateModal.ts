import { Page, Locator } from '@playwright/test';

export abstract class BaseNoteUpdateModal {
  readonly page: Page;
  readonly form: Locator;
  
  // Common form fields
  readonly typeInput: Locator;
  readonly templateInput: Locator;
  readonly writtenByInput: Locator;
  readonly dateTimeInput: Locator;
  readonly noteContentTextarea: Locator;
  
  // Common action buttons
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Main form container
    this.form = page.getByRole('dialog').getByTestId('styledform-5o5i');
    
    // Common form fields
    this.typeInput = page.getByTestId('field-a0mv-input');
    this.templateInput = page.getByTestId('field-ej08-input');
    this.writtenByInput = page.getByTestId('field-ar9q-input');
    this.dateTimeInput = page.getByTestId('field-nwwl-input').locator('input');
    this.noteContentTextarea = page.getByTestId('field-wxzr').locator('textarea').nth(0);
    
    // Common action buttons
    this.confirmButton = page.getByTestId('formsubmitcancelrow-confirmButton');
    this.cancelButton = page.getByRole('dialog').getByTestId('outlinedbutton-8rnr');
  }

  // Common methods
  async waitForModalToLoad() {
    await this.form.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async waitForModalToClose() {
    await this.form.waitFor({ state: 'detached' });
  }
}
