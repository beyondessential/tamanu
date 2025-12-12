import { Locator, Page } from '@playwright/test';
import { selectAutocompleteFieldOption } from '@utils/fieldHelpers';

export class DeleteTaskModal {
  readonly page: Page;

  readonly recordedByInput!: Locator;
  readonly recordDateTimeField!: Locator;
  readonly recordDateTimeInput!: Locator;
  readonly reasonForDeletionInput!: Locator;
  readonly confirmButton!: Locator;
  readonly cancelButton!: Locator;

  constructor(page: Page) {
    this.page = page;

    const testIds = {
      recordedByInput: 'field-2l6f-input',
      recordDateTimeField: 'field-bnve-input',
      reasonForDeletionInput: 'field-4x58-input',
      confirmButton: 'formsubmitcancelrow-0v1x-confirmButton',
      cancelButton: 'outlinedbutton-8rnr',
    } as const;

    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }

    // Field that needs nested locator
    this.recordDateTimeInput = this.recordDateTimeField.locator('input');
  }

  async waitForModalToLoad(): Promise<void> {
    await this.recordedByInput.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async fillForm(values: {
    recordedBy?: string;
    recordDateTime?: string;
    reasonForDeletion?: string;
  }): Promise<void> {
    if (values.recordedBy) {
      await selectAutocompleteFieldOption(this.page, this.recordedByInput, {
        optionToSelect: values.recordedBy,
        returnOptionText: true,
      });
    }

    if (values.recordDateTime) {
      await this.recordDateTimeInput.fill(values.recordDateTime);
    }

    if (values.reasonForDeletion) {
      await selectAutocompleteFieldOption(this.page, this.reasonForDeletionInput, {
        optionToSelect: values.reasonForDeletion,
        returnOptionText: true,
      });
    }
  }
}

