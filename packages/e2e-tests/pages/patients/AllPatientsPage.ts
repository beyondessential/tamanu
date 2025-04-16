import { Locator, Page } from '@playwright/test';
import { routes } from '../../config/routes';
import { BasePage } from '../BasePage';

export class AllPatientsPage extends BasePage {
  readonly allPatientsTable: Locator;
  readonly allPatientsTableLoadingCell: Locator;

  constructor(page: Page) {
    super(page, routes.patients.all);
    // Test ID currently not working
    // this.allPatientsTable = page.getByTestId('patienttable-l8c2');
    this.allPatientsTable = page.getByRole('table');
    this.allPatientsTableLoadingCell = this.allPatientsTable.getByTestId('translatedtext-yvlt');
  }

  async waitForTableToLoad() {
    await this.allPatientsTable.waitFor();
    await this.allPatientsTableLoadingCell.waitFor({ state: 'detached' });
  }

  async clickOnFirstRow() {
    await this.waitForTableToLoad();

    await this.allPatientsTable.locator('tbody tr').first().click();
    await this.page.waitForURL('**/#/patients/all/*');
  }
}
