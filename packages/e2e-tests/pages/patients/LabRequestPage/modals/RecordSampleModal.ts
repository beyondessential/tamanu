import { Page, Locator } from '@playwright/test';
import { assignTestIdLocators } from '@utils/locatorFactory';
import { selectFirstFromDropdown } from '@utils/fieldHelpers';

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

    assignTestIdLocators(this, page, {
      form: 'formgrid-3btd',
      collectedByDropdown: 'styledfield-v88m-input-expandmoreicon',
      specimenTypeDropdown: 'styledfield-0950-input-expandmoreicon',
      recordSampleConfirmButton: 'row-vpng-confirmButton',
      closeButton: 'close-button',
      cancelButton: 'cancel-button',
    });

    this.dateTimeCollectedInput = page.getByTestId('styledfield-dmjl-input');
    this.collectedByInput = page.getByTestId('styledfield-v88m-input');
    this.specimenTypeInput = page.getByTestId('styledfield-0950-input');
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

