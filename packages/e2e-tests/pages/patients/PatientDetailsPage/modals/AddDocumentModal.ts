import { Locator, Page } from '@playwright/test';
import { selectAutocompleteFieldOption } from '@utils/fieldHelpers';

export class AddDocumentModal {
  readonly page: Page;

  
  readonly fileInput!: Locator;
  readonly fileNameInput!: Locator;
  readonly documentOwnerInput!: Locator;
  readonly noteInput!: Locator;
  readonly departmentInput!: Locator;
  readonly confirmButton!: Locator;

  constructor(page: Page) {
    this.page = page;

    const testIds = {
      modalTitle: 'verticalcenteredtext-ni4s',
      fileInput: 'input-q5no',
      fileNameInput: 'field-b9rq-input',
      documentOwnerInput: 'field-yn8l-input',
      noteInput: 'field-sy66-input',
      departmentInput: 'field-ynp5-input',
      confirmButton: 'formsubmitcancelrow-me5l-confirmButton',
    } as const;

    for (const [key, testId] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(testId);
    }
  }

  async waitForModalToLoad(): Promise<void> {
    await this.fileNameInput.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async fillForm(values: { fileName: string; documentOwner?: string; note?: string; filePath: string }): Promise<{ department: string }> {
    await this.fileInput.setInputFiles(values.filePath);
    await this.fileNameInput.fill(values.fileName);
    const documentOwner = values.documentOwner || '';
    if (documentOwner) {
      await this.documentOwnerInput.fill(documentOwner);
    }
    const note = values.note || '';
    if (note) {
      await this.noteInput.fill(note);
    }
    const department = await selectAutocompleteFieldOption(this.page, this.departmentInput, {
      selectFirst: true,
      returnOptionText: true,
    });

    return {
      department: department || '',
    };
  }
}

