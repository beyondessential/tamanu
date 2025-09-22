import { Page, Locator } from '@playwright/test';

export class ChangePriorityModal {
  readonly page: Page;
  readonly form: Locator;
  
  // Form fields
  readonly prioritySelect: Locator;
  
  // Action buttons
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Main form container
    this.form = page.getByTestId('formgrid-3btd');
    
    // Form fields
    this.prioritySelect = page.getByTestId('autocompleteinput-lob3-input').locator('input');
    
    // Action buttons (these would need to be updated with actual test IDs from the modal)
    this.confirmButton = page.getByTestId('confirmbutton-tok1');
    this.cancelButton = page.getByTestId('outlinedbutton-95wy');
  }

  async waitForModalToLoad() {
    await this.form.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

}
