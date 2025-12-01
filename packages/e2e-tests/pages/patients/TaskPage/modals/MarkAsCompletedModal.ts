import { Locator, Page } from '@playwright/test';

export class MarkAsCompletedModal {
  readonly page: Page;

  readonly completedByInput!: Locator;
  readonly completedDateTimeField!: Locator;
  readonly completedDateTimeInput!: Locator;
  readonly notesInput!: Locator;
  readonly confirmButton!: Locator;
  readonly cancelButton!: Locator;

  constructor(page: Page) {
    this.page = page;

    const testIds = {
      completedByInput: 'field-4r4u-input',
      completedDateTimeField: 'field-el3t-input',
      notesInput: 'field-kvze-input',
      confirmButton: 'formsubmitcancelrow-v41o-confirmButton',
      cancelButton: 'outlinedbutton-8rnr',
    } as const;

    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }

    // Field that needs nested locator
    this.completedDateTimeInput = this.completedDateTimeField.locator('input');
  }

  async waitForModalToLoad(): Promise<void> {
    await this.completedByInput.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async fillForm(values: {
    notes?: string;
  }): Promise<void> { 
    const notes = values.notes || '';
    if (notes) {
      await this.notesInput.fill(notes);
    }
  }
}

