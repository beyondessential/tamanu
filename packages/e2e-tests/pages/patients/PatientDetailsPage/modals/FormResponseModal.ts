import { Locator, Page } from '@playwright/test';

export class FormResponseModal {
  readonly page: Page;
  readonly modal!: Locator;
  readonly table!: Locator;
  readonly tableRows!: Locator;
  readonly closeButton!: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = this.page.getByRole('dialog').getByTestId('modaltitle-ojhf');
    this.table = this.page.getByRole('dialog').getByTestId('styledtable-1dlu');
    this.tableRows = this.table.locator('tbody tr');
    this.closeButton = this.page.getByRole('dialog').getByTestId('confirmbutton-tok1');
  }

  async waitForModalToLoad(): Promise<void> {
    await this.modal.waitFor({ state: 'visible' });
    await this.table.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle');
  }
  /**
   * Get the form response values from the modal
   * @returns An array of objects with the indicator and value of the form response
   */
  async getFormResponseValues(): Promise<Array<{ indicator: string; value: string }>> {
    await this.waitForModalToLoad();
    const rows = await this.tableRows.all();
    return Promise.all(
      rows.map(async row => {
        const indicator = (await row.locator('td').nth(0).textContent()) || '';
        const value = (await row.locator('td').nth(1).textContent()) || '';
        return { indicator: indicator.trim(), value: value.trim() };
      }),
    );
  }

  async close(): Promise<void> {
    await this.closeButton.click();
    await this.modal.waitFor({ state: 'hidden' });
  }
}
