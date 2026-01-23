import { Locator, Page } from '@playwright/test';
import { BasePatientPane } from './BasePatientPane';

export class FormPane extends BasePatientPane {
  readonly newFormButton!: Locator;
  readonly formsList!: Locator;
  readonly tableRows!: Locator;
  constructor(page: Page) {
    super(page);
    this.newFormButton = this.page.getByTestId('button-i54d');
    // Forms list table body
    this.formsList = this.page.getByTestId('styledtablebody-a0jz');
    this.tableRows = this.formsList.locator('tr');
  }


  async waitForPageToLoad(): Promise<void> {
    await this.newFormButton.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle'); 
  }

}
