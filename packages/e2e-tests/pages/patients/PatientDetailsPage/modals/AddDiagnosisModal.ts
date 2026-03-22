import { Locator, Page } from '@playwright/test';
import { selectAutocompleteFieldOption, selectFieldOption } from '@utils/fieldHelpers';

export class AddDiagnosisModal {
  readonly page: Page;

  
  readonly closeIcon!: Locator;
 
  readonly diagnosisInput!: Locator;
  readonly isPrimaryCheckbox!: Locator;
  readonly certaintySelect!: Locator;
  readonly dateField!: Locator;
  readonly dateInput!: Locator;
  readonly clinicianInput!: Locator;
  readonly cancelButton!: Locator;
  readonly confirmButton!: Locator;

  constructor(page: Page) {
    this.page = page;

    const testIds = {   
      closeIcon: 'closeicon-z1u6',
      diagnosisInput: 'field-f5vm-input',
      isPrimaryCheckbox: 'field-52wo-controlcheck',
      certaintySelect: 'field-a9rl-select',
      dateField: 'field-fszu',
      cancelButton: 'outlinedbutton-8rnr',
      confirmButton: 'formsubmitcancelrow-jfcw-confirmButton',
    } as const;

    for (const [key, testId] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(testId);
    }
    this.dateInput= page.getByTestId('field-fszu-input').locator('input');
    this.clinicianInput= page.getByTestId('field-af83-input').locator('input');
  }

  async waitForModalToLoad(): Promise<void> {
    await this.diagnosisInput.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async fillForm(primary: boolean): Promise<{ diagnosis: string, certainty: string }> {
    const diagnosis = await selectAutocompleteFieldOption(this.page, this.diagnosisInput, {
      selectFirst: true,
      returnOptionText: true,
    });
    if (!primary) {
        await this.isPrimaryCheckbox.uncheck();
      }
   const certainty = await selectFieldOption(this.page, this.certaintySelect, {
      selectFirst: true,
      returnOptionText: true,
    });
    return { diagnosis: diagnosis || '', certainty: certainty || '' };
  }
}

