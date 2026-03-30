import { Locator, Page, expect } from '@playwright/test';
import { ids, TABLE_CELL_PREFIX } from '@ids';

// ---------------------------------------------------------------------------
// Vitals Pane
// ---------------------------------------------------------------------------

export class VitalsPane {
  readonly tableBody: Locator;

  constructor(readonly page: Page) {
    this.tableBody = page.getByTestId(ids.table.body);
  }

  async waitForPaneToLoad(): Promise<void> {
    await this.tableBody.waitFor({ state: 'visible' });
  }

  /** Get the latest vital value for a given measure name. */
  async getLatestValue(measureName: string): Promise<string> {
    const rows = this.tableBody.locator('tr');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const firstCell = this.page.getByTestId(new RegExp(`^${TABLE_CELL_PREFIX}${i}-`)).first();
      const text = await firstCell.textContent();
      if (text?.includes(measureName)) {
        const valueCell = this.page.getByTestId(new RegExp(`^${TABLE_CELL_PREFIX}${i}-`)).last();
        return (await valueCell.textContent()) || '';
      }
    }
    return '';
  }
}

// ---------------------------------------------------------------------------
// Record Vitals Modal
// ---------------------------------------------------------------------------

export class RecordVitalsModal {
  readonly header: Locator;
  readonly closeButton: Locator;
  readonly confirmButton: Locator;

  constructor(readonly page: Page) {
    this.header = page.getByTestId(ids.vitalsModal.header);
    this.closeButton = page.getByTestId(ids.vitalsModal.closeButton);
    this.confirmButton = page.getByTestId(ids.vitalsModal.confirmButton);
  }

  async waitForOpen(): Promise<void> {
    await this.header.waitFor({ state: 'visible' });
  }

  /** Fill a vital sign by its input name attribute. */
  async fillVital(name: string, value: string): Promise<void> {
    const input = this.page.locator(`input[name="${name}"]`);
    await input.fill(value);
  }

  async submit(): Promise<void> {
    await this.confirmButton.click();
  }
}
