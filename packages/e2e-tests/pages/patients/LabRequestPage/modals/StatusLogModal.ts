import { Page, Locator } from '@playwright/test';
import { getTableItems } from '@utils/testHelper';

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

  async getDateTime(rowCount: number, rowIndex: number): Promise<string> {
    const tableItems = await getTableItems(this.page, rowCount, 'createdAt');
    return tableItems[rowIndex] || '';
  }

  async getStatus(rowCount: number, rowIndex: number): Promise<string> {
    const tableItems = await getTableItems(this.page, rowCount, 'status');
    return tableItems[rowIndex] || '';
  }

  async getRecordedBy(rowCount: number, rowIndex: number): Promise<string> {
    const tableItems = await getTableItems(this.page, rowCount, 'updatedByDisplayName');
    return tableItems[rowIndex] || '';
  } 

  async getRowCount(): Promise<number> {
    return await this.tableRows.count();
  }

}
