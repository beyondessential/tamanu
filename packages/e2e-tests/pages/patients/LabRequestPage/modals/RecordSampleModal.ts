import { Page, Locator } from '@playwright/test';
import { selectFirstFromDropdown } from '@utils/testHelper';

export class RecordSampleModal {
  readonly page: Page;
  readonly form!: Locator;
  
  // Form fields
  readonly dateTimeCollectedInput!: Locator;
  readonly collectedByInput!: Locator;
  readonly collectedByDropdown!: Locator;
  readonly specimenTypeInput!: Locator;
  readonly specimenTypeDropdown!: Locator;
  readonly siteInputDropdownIcon!: Locator;
  
  // Action buttons
  readonly recordSampleConfirmButton!: Locator;
  readonly closeButton!: Locator;
  readonly cancelButton!: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // TestId mapping for RecordSampleModal elements
    const testIds = {
      form: 'formgrid-3btd',
      dateTimeCollectedInput: 'styledfield-dmjl-input',
      collectedByInput: 'styledfield-v88m-input',
      collectedByDropdown: 'styledfield-v88m-input-expandmoreicon',
      specimenTypeInput: 'styledfield-0950-input',
      specimenTypeDropdown: 'styledfield-0950-input-expandmoreicon',
      siteInputDropdownIcon: 'selectinput-phtg-expandmoreicon-h115',
      recordSampleConfirmButton: 'row-vpng-confirmButton',
      closeButton: 'close-button',
      cancelButton: 'cancel-button',
    } as const;

    // Create locators using the testId mapping
    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }

    // Special cases that need additional processing
    this.dateTimeCollectedInput = page.getByTestId('styledfield-dmjl-input').locator('input');
    this.collectedByInput = page.getByTestId('styledfield-v88m-input').locator('input');
    this.specimenTypeInput = page.getByTestId('styledfield-0950-input').locator('input');
    // Scope siteInputDropdownIcon to the record sample form to avoid matching elements in other forms
    this.siteInputDropdownIcon = page.getByTestId('formgrid-3btd').getByTestId('selectinput-phtg-expandmoreicon-h115');
  }

  async waitForModalToLoad() {
    await this.form.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }


  // Helper function to select first option from all dropdowns
  async selectFirstFromAllDropdowns() {
    const collectedByText = await selectFirstFromDropdown(this.page, this.collectedByInput);   
    const specimenTypeText = await selectFirstFromDropdown(this.page, this.specimenTypeInput);
    await this.siteInputDropdownIcon.click();
    await this.page.keyboard.press('Enter');

    return {
    collectedBy: collectedByText,
    specimenType: specimenTypeText,
    }
  
}
async waitForSampleCollectedModalToClose() {
  await this.form.waitFor({ state: 'detached' });
  await this.page.waitForLoadState('networkidle', { timeout: 10000 });
}
}

