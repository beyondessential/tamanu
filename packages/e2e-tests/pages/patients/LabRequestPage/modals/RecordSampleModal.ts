import { Page, Locator } from '@playwright/test';
import { selectFirstFromDropdown } from '@utils/testHelper';

export class RecordSampleModal {
  readonly page: Page;
  readonly form: Locator;
  
  // Form fields
  readonly dateTimeCollectedInput: Locator;
  readonly collectedByInput: Locator;
  readonly collectedByDropdown: Locator;
  readonly specimenTypeInput: Locator;
  readonly specimenTypeDropdown: Locator;
  readonly siteInputDropdownIcon: Locator;
  
  // Action buttons
  readonly recordSampleConfirmButton: Locator;
  readonly closeButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Main form container
    this.form = page.getByTestId('formgrid-3btd');
    
    // Form fields
    this.dateTimeCollectedInput = page.getByTestId('styledfield-dmjl-input').locator('input');
    this.collectedByInput = page.getByTestId('styledfield-v88m-input').locator('input');
    this.collectedByDropdown = page.getByTestId('styledfield-v88m-input-expandmoreicon');
    this.specimenTypeInput = page.getByTestId('styledfield-0950-input').locator('input');
    this.specimenTypeDropdown = page.getByTestId('styledfield-0950-input-expandmoreicon');
    this.siteInputDropdownIcon = page.getByTestId('selectinput-phtg-expandmoreicon-h115');
    
    // Action buttons (these would need to be updated with actual test IDs from the modal)
    this.recordSampleConfirmButton = page.getByTestId('row-vpng-confirmButton');
    this.closeButton = page.getByTestId('close-button');
    this.cancelButton = page.getByTestId('cancel-button');
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
}

