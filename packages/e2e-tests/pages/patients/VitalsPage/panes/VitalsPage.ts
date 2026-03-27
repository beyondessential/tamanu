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
    const firstRowRegex = new RegExp(`^${STYLED_TABLE_CELL_PREFIX}0-`);
    const dataCellLocator = this.page.getByTestId(firstRowRegex).nth(1);

    // The vitals query can resolve before the server finishes processing
    // triage-submitted vitals, leaving the table with no date columns.
    // If data cells don't appear promptly, reload to force a fresh query.
    try {
      await dataCellLocator.waitFor({ state: 'visible', timeout: 10_000 });
    } catch {
      await this.page.reload();
      await this.table.waitFor({ state: 'visible' });
      await dataCellLocator.waitFor({ state: 'visible', timeout: 30_000 });
    }

    const vitalValues: any = {};
    for (let i = 0; i < VITALS_FIELD_KEYS.length; i++) {    
      const regex = new RegExp(`^${STYLED_TABLE_CELL_PREFIX}${i}-`);
      const cell = this.page.getByTestId(regex).nth(1);
      const text = await cell.textContent();
      let normalizedValue = text?.trim() || '';
      normalizedValue = normalizedValue
        .replace(/cm$|kg$|°C$|%$/g, '')
        .replace(/^—$/, '')
        .trim();
      vitalValues[VITALS_FIELD_KEYS[i]] = normalizedValue;
    }
    return vitalValues as Record<typeof VITALS_FIELD_KEYS[number], string>;
  }
}

