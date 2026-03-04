import { Page, Locator } from '@playwright/test';
import { STYLED_TABLE_CELL_PREFIX } from '@utils/testHelper';
import { VITALS_FIELD_KEYS } from '../types';

export class VitalsPage {
  readonly page: Page;

  readonly table!: Locator;
  readonly tableBody!: Locator;
  readonly tableRows!: Locator;

  constructor(page: Page) {
    this.page = page;

    this.table = page.getByTestId('styledtable-1dlu');
    this.tableBody = page.getByTestId('styledtablebody-a0jz');
    this.tableRows = this.tableBody.locator('tr');
  }

  async waitForSectionToLoad() {
    await this.table.waitFor({ state: 'visible' });
  }

  /**
   * Get the values of the latest vital record
   * @returns A record of the vital values
   */
  async getLatestVitalValues(): Promise<Record<typeof VITALS_FIELD_KEYS[number], string>> {
    const vitalValues: any = {};
    for (let i = 0; i < VITALS_FIELD_KEYS.length; i++) {    
      const regex = new RegExp(`^${STYLED_TABLE_CELL_PREFIX}${i}-`);
      // Get the second cell (index 1) - first is measure label, second is the value
      const cell = this.page.getByTestId(regex).nth(1);
      const text = await cell.textContent();
      // Strip common units and normalize empty values
      let normalizedValue = text?.trim() || '';
      normalizedValue = normalizedValue
        .replace(/cm$|kg$|°C$|%$/g, '')  // Remove common units
        .replace(/^—$/, '')               // Replace em-dash with empty string
        .trim();
      vitalValues[VITALS_FIELD_KEYS[i]] = normalizedValue;
    }
    return vitalValues as Record<typeof VITALS_FIELD_KEYS[number], string>;
  }
}

