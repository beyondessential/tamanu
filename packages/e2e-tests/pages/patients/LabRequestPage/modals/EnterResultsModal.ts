import { Page, Locator } from '@playwright/test';
import { selectFirstFromDropdown } from '@utils/testHelper';
import { format } from 'date-fns';

export class EnterResultsModal {
  readonly page: Page;
  readonly form: Locator;

  // Action buttons
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;
  
  // Table constants
  readonly STYLED_TABLE_CELL_PREFIX: string;
  readonly resultsFirstRowIcon: Locator;        
  readonly resultsFirstRow: Locator;
  readonly labTestMethodFirstRow: Locator;
  readonly labTestMethodFirstRowIcon: Locator;
  readonly verificationFirstRow: Locator;
  readonly completedDateFirstRow: Locator;
  readonly labTestTypeTitle: Locator;
 

  constructor(page: Page) {
    this.page = page;
    
    // Main form container
    this.form = page.getByTestId('modalcontainer-uc2n').getByTestId('styledform-5o5i');
    this.STYLED_TABLE_CELL_PREFIX = 'styledtabledatacell-bsji';
    // Action buttons
    this.confirmButton = page.getByTestId('confirmbutton-tok1');
    this.cancelButton = page.getByTestId('outlinedbutton-95wy');
    this.resultsFirstRow = page.getByTestId(`${this.STYLED_TABLE_CELL_PREFIX}-0-result`).locator('input').locator('..').locator('div');
    this.resultsFirstRowIcon = this.page.getByTestId(`${this.STYLED_TABLE_CELL_PREFIX}-0-result`).getByTestId('styledfield-h653-expandmoreicon-h115');  
    this.labTestMethodFirstRow = page.getByTestId(`${this.STYLED_TABLE_CELL_PREFIX}-0-labTestMethodId`).locator('input').locator('..').locator('div');
    this.labTestMethodFirstRowIcon = this.page.getByTestId(`${this.STYLED_TABLE_CELL_PREFIX}-0-labTestMethodId`).getByTestId('selectinput-phtg-expandmoreicon-h115');
    this.verificationFirstRow = page.getByTestId(`${this.STYLED_TABLE_CELL_PREFIX}-0-verification`).locator('input');
    this.completedDateFirstRow = page.getByTestId(`${this.STYLED_TABLE_CELL_PREFIX}-0-completedDate`).locator('input');
    this.labTestTypeTitle = page.getByTestId('styledtableheadercell-wvus-labTestType');

  }

  async waitForModalToLoad() {
    await this.labTestTypeTitle.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async getEnterResultsTableItems(tableRowCount: number, columnName: string) {
    const items: string[] = [];
    for (let i = 0; i < tableRowCount; i++) {
      const itemLocator = this.page.getByTestId(`${this.STYLED_TABLE_CELL_PREFIX}${i}-${columnName}`);
      const itemText = await itemLocator.textContent();
      if (itemText) {
        items.push(itemText);
      }
    }
    return items;
  }

  async getTableRowCount() {
    return await this.page.getByTestId('styledfixedtable-ab5k').locator('tr').count();
  }
  async waitForModalToClose() {
    await this.form.waitFor({ state: 'detached' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

}
