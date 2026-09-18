import { Page, Locator } from '@playwright/test';
import { selectFirstFromDropdown } from '@utils/testHelper';

export class RecordSampleModal {
  readonly page: Page;
  readonly form!: Locator;

  // Form fields (B4: grouped-by-category sample details — all autocompletes)
  readonly dateTimeCollectedInput!: Locator;
  readonly collectedByInput!: Locator;
  readonly specimenTypeInput!: Locator;
  readonly siteInput!: Locator;

  // Action buttons
  readonly recordSampleConfirmButton!: Locator;
  readonly closeButton!: Locator;
  readonly cancelButton!: Locator;

  constructor(page: Page) {
    this.page = page;

    const testIds = {
      form: 'container-recordsample',
      dateTimeCollectedInput: 'styledfield-sampletime-input',
      collectedByInput: 'styledfield-collectedby-input',
      specimenTypeInput: 'styledfield-specimentype-input',
      siteInput: 'styledfield-site-input',
      recordSampleConfirmButton: 'row-vpng-confirmButton',
      closeButton: 'close-button',
      cancelButton: 'cancel-button',
    } as const;

    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }
  }

  async waitForModalToLoad() {
    await this.form.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  // Select the first option for each of the collected-by, specimen-type and site autocompletes.
  async selectFirstFromAllDropdowns() {
    const collectedByText = await selectFirstFromDropdown(this.page, this.collectedByInput);
    const specimenTypeText = await selectFirstFromDropdown(this.page, this.specimenTypeInput);
    await selectFirstFromDropdown(this.page, this.siteInput);

    return {
      collectedBy: collectedByText,
      specimenType: specimenTypeText,
    };
  }

  async waitForSampleCollectedModalToClose() {
    await this.form.waitFor({ state: 'detached' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }
}
