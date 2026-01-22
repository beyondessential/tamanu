import { Page, Locator } from '@playwright/test';

export class ChangeLaboratoryModal {
  readonly page: Page;
  readonly form: Locator;
  
  // Form fields
  readonly laboratorySelect: Locator;
  
  // Action buttons
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Main form container
    this.form = page.getByTestId('formgrid-3btd');
    
    // Form fields
    this.laboratorySelect = page.getByTestId('field-36s0-input').locator('input');
    
    // Action buttons (these would need to be updated with actual test IDs from the modal)
    this.confirmButton = page.getByTestId('row-vpng-confirmButton');
    this.cancelButton = page.getByTestId('outlinedbutton-8rnr');
  }

  async waitForModalToLoad() {
    await this.form.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

}
