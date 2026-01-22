import { Page, Locator } from '@playwright/test';

export class EnterResultsModal {
  readonly page: Page;
  readonly form!: Locator;

  // Action buttons
  readonly confirmButton!: Locator;
  
  // Table constants
  readonly STYLED_TABLE_CELL_PREFIX: string;
  readonly resultsFirstRowIcon!: Locator;        
  readonly resultsFirstRow!: Locator;
  readonly labTestMethodFirstRow!: Locator;
  readonly labTestMethodFirstRowIcon!: Locator;
  readonly verificationFirstRow!: Locator;
  readonly completedDateFirstRow!: Locator;
  readonly labTestTypeTitle!: Locator;
  
  // Dropdown option locators
  readonly resultOptions!: Locator;
  readonly labTestMethodOptions!: Locator;
 

  constructor(page: Page) {
    this.page = page;
    
    // TestId mapping for EnterResultsModal elements
    const testIds = {
      form: 'modalcontainer-uc2n',
      styledForm: 'styledform-5o5i',
      confirmButton: 'confirmbutton-tok1',
      labTestTypeTitle: 'styledtableheadercell-wvus-labTestType',
    } as const;

    // Create locators using the testId mapping
    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }
    
    // Special cases that need additional processing
    this.STYLED_TABLE_CELL_PREFIX = 'styledtabledatacell-bsji';
    this.form = page.getByTestId('modalcontainer-uc2n').getByTestId('styledform-5o5i');
    this.resultsFirstRow = page.getByTestId(`${this.STYLED_TABLE_CELL_PREFIX}-0-result`).locator('input').locator('..').locator('div');
    this.resultsFirstRowIcon = this.page.getByTestId(`${this.STYLED_TABLE_CELL_PREFIX}-0-result`).getByTestId('styledfield-h653-expandmoreicon-h115');  
    this.labTestMethodFirstRow = page.getByTestId(`${this.STYLED_TABLE_CELL_PREFIX}-0-labTestMethodId`).locator('input').locator('..').locator('div');
    this.labTestMethodFirstRowIcon = this.page.getByTestId(`${this.STYLED_TABLE_CELL_PREFIX}-0-labTestMethodId`).getByTestId('selectinput-phtg-expandmoreicon-h115');
    this.verificationFirstRow = page.getByTestId(`${this.STYLED_TABLE_CELL_PREFIX}-0-verification`).locator('input');
    this.completedDateFirstRow = page.getByTestId(`${this.STYLED_TABLE_CELL_PREFIX}-0-completedDate`).locator('input');
    
    // Dropdown option locators
    this.resultOptions = page.getByTestId('styledfield-h653-option');
    this.labTestMethodOptions = page.getByTestId('selectinput-phtg-option');
  }

  async waitForModalToLoad() {
    await this.labTestTypeTitle.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async waitForModalToClose() {
    await this.form.waitFor({ state: 'detached' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async selectResult(result: string) {
    await this.resultsFirstRowIcon.click();
    await this.resultOptions.getByText(result).click();
  }

  async selectLabTestMethod(method: string) {
    await this.labTestMethodFirstRowIcon.click();
    await this.labTestMethodOptions.getByText(method).click();
  }

}
