import { Page, Locator } from '@playwright/test';

export class ChangePriorityModal {
  readonly page: Page;
  readonly form!: Locator;
  
  // Form fields
  readonly prioritySelect!: Locator;
  
  // Action buttons
  readonly confirmButton!: Locator;
  readonly cancelButton!: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // TestId mapping for ChangePriorityModal elements
    const testIds = {
      form: 'formgrid-3btd',
      prioritySelect: 'autocompleteinput-lob3-input',
      confirmButton: 'confirmbutton-tok1',
      cancelButton: 'outlinedbutton-95wy',
    } as const;

    // Create locators using the testId mapping
    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }
    
    // Special cases that need additional processing
    this.prioritySelect = page.getByTestId('autocompleteinput-lob3-input').locator('input');
  }

  async waitForModalToLoad() {
    await this.form.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

}
