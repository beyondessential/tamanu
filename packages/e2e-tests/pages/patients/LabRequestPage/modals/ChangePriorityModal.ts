import { Page, Locator } from '@playwright/test';
import { assignTestIdLocators } from '@utils/locatorFactory';
import { waitForModalOpen } from '@utils/dialogHelpers';

export class ChangePriorityModal {
  readonly page: Page;
  readonly form!: Locator;
  
  readonly prioritySelect!: Locator;
  
  readonly confirmButton!: Locator;
  readonly cancelButton!: Locator;

  constructor(page: Page) {
    this.page = page;

    assignTestIdLocators(this, page, {
      form: 'formgrid-3btd',
      confirmButton: 'confirmbutton-tok1',
      cancelButton: 'outlinedbutton-95wy',
    });

    this.prioritySelect = page.getByTestId('autocompleteinput-lob3-input').locator('input');
  }

  async waitForModalToLoad() {
    await waitForModalOpen(this.form, this.page);
  }
}
