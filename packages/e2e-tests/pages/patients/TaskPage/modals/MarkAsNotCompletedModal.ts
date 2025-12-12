import { Locator, Page } from '@playwright/test';
import { selectAutocompleteFieldOption } from '@utils/fieldHelpers';

export class MarkAsNotCompletedModal {
  readonly page: Page;

  readonly recordedByInput!: Locator;
  readonly recordDateTimeField!: Locator;
  readonly recordDateTimeInput!: Locator;
  readonly reasonNotCompletedInput!: Locator;
  readonly confirmButton!: Locator;
  readonly cancelButton!: Locator;

  constructor(page: Page) {
    this.page = page;

    const testIds = {
      recordedByInput: 'field-maud-input',
      recordDateTimeField: 'field-sgto-input',
      reasonNotCompletedInput: 'field-r3a1-input',
      confirmButton: 'formsubmitcancelrow-y08n-confirmButton',
      cancelButton: 'outlinedbutton-8rnr',
    } as const;

    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }
  }

  async waitForModalToLoad(): Promise<void> {
    await this.recordedByInput.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async fillForm(values: {
    reasonNotCompleted?: string;
  }): Promise<void> {
    if (values.reasonNotCompleted) {
      await selectAutocompleteFieldOption(this.page, this.reasonNotCompletedInput, {
        optionToSelect: values.reasonNotCompleted,
        returnOptionText: true,
      });
    }
  }
}

