import { Locator, Page } from '@playwright/test';

export class EditEncounterModal {
  readonly page: Page;
  readonly modal: Locator;

  // Action buttons
  readonly saveChangesButton: Locator;
  readonly cancelButton: Locator;

  // Diet field locators
  readonly dietControl: Locator;
  readonly dietInput: Locator;
  readonly dietOptions: Locator;

  constructor(page: Page) {
    this.page = page;
    // The FormModal testId doesn't reach the DOM due to prop overrides in the component chain.
    // Use role-based selector scoped by the modal title text instead.
    this.modal = page.getByRole('dialog').filter({ hasText: 'Edit encounter details' });

    this.saveChangesButton = this.modal.getByRole('button', { name: 'Save changes' });
    this.cancelButton = this.modal.getByRole('button', { name: 'Cancel' });

    // Diet field (react-select)
    this.dietControl = this.modal.locator('.react-select__control');
    this.dietInput = this.modal.locator('.react-select__input input');
    this.dietOptions = this.modal.locator('.react-select__option');
  }

  async waitForModalToLoad(): Promise<void> {
    await this.modal.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  /**
   * Select a diet option from the multi-select field.
   * The diet field uses react-select, so we interact via its CSS class selectors.
   */
  async selectDiet(diet: string): Promise<void> {
    await this.dietControl.click();
    await this.dietInput.fill(diet);
    await this.dietOptions.filter({ hasText: diet }).first().click();
  }

  async saveChanges(): Promise<void> {
    await this.saveChangesButton.click();
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }
}
