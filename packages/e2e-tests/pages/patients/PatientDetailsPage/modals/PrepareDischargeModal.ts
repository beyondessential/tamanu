import { Page, Locator } from '@playwright/test';

export class PrepareDischargeModal {
  readonly page: Page;
  readonly form: Locator;
  
  // Form fields
  readonly dischargeNoteTextarea: Locator;
  
  // Action buttons
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Main form container
    this.form = page.getByTestId('field-0uma-input').locator('..');
    
    // Form fields
    this.dischargeNoteTextarea = page.getByTestId('field-0uma-input');
    
    // Action buttons (these would need to be updated with actual test IDs from the modal)
    this.confirmButton = page.getByTestId('box-p5wr');
    this.cancelButton = page.getByRole('dialog').getByTestId('outlinedbutton-8rnr');
  }

  async waitForModalToLoad() {
    await this.dischargeNoteTextarea.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }


  async waitForModalToClose() {
    await this.dischargeNoteTextarea.waitFor({ state: 'detached' });
  }
}
