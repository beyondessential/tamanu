import { Locator, Page } from '@playwright/test';

import { BasePage } from './BasePage';

// First-run setup wizard (shown when public/ping reports setupRequired). Fields
// are Formik-named inputs; the submit is a FormSubmitButton and errors render in
// a single Material Alert.
export class SetupWizardPage extends BasePage {
  readonly heading: Locator;
  readonly host: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly addFacility: Locator;
  readonly submit: Locator;
  readonly errorBanner: Locator;

  constructor(page: Page) {
    super(page, '/');
    this.heading = page.getByText('Set up this server');
    this.host = page.locator('input[name="host"]');
    this.email = page.locator('input[name="email"]');
    this.password = page.locator('input[name="password"]');
    this.addFacility = page.getByText('Add another facility');
    this.submit = page.getByRole('button', { name: 'Connect and continue' });
    this.errorBanner = page.getByRole('alert');
  }

  facilityId(index: number): Locator {
    return this.page.locator(`input[name="facilityIds.${index}"]`);
  }

  // Adds rows until `index` exists, then fills it — the wizard starts with one row.
  async fillFacilityId(index: number, value: string): Promise<void> {
    while ((await this.page.locator('input[name^="facilityIds."]').count()) <= index) {
      await this.addFacility.click();
    }
    await this.facilityId(index).fill(value);
  }
}
