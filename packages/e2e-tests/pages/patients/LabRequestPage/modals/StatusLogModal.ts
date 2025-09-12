import { Page, Locator } from '@playwright/test';

export class StatusLogModal {
  readonly page: Page;
  
  // Modal and table elements
  readonly modalContent: Locator;
  readonly tableRows: Locator;

  constructor(page: Page) {
    this.page = page;
    
    this.modalContent = page.getByTestId('modalcontent-bk4w');
    this.tableRows = this.modalContent.getByTestId('styledtablebody-a0jz').locator('tr');
  }

  async waitForModalToLoad() {
    await this.modalContent.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async getDateTime(rowIndex: number): Promise<string> {
    const itemLocator = this.tableRows.nth(rowIndex).locator('[data-testid*="-createdAt"]');
    return (await itemLocator.textContent()) || '';
  }
  async getStatus(rowIndex: number): Promise<string> {
    const itemLocator = this.tableRows.nth(rowIndex).locator('[data-testid*="-status"]');
    return (await itemLocator.textContent()) || '';
  }
  async getRecordedBy(rowIndex: number): Promise<string> {
    const itemLocator = this.tableRows.nth(rowIndex).locator('[data-testid*="-updatedByDisplayName"]');
    return (await itemLocator.textContent()) || '';
  } 

  async getRowCount(): Promise<number> {
    return await this.tableRows.count();
  }

}
