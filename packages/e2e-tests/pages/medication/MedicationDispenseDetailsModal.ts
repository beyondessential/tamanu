import { Locator, Page } from '@playwright/test';

type DetailsModalTitle = 'Dispensed medication' | 'Not dispensed medication';

// The read-only details window for a dispensed medication, or for a medication request marked not
// dispensed. Both lay their fields out as label-over-value pairs, with no per-field test ids.
export class MedicationDispenseDetailsModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly title: Locator;

  constructor(page: Page, title: DetailsModalTitle) {
    this.page = page;
    this.dialog = page.getByRole('dialog');
    this.title = this.dialog.getByText(title, { exact: true });
  }

  async waitForModalToLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // A field's label and value share a parent, so the parent holds the whole field.
  field(label: string): Locator {
    return this.dialog.getByText(label, { exact: true }).locator('..');
  }
}
