import { Locator, Page } from '@playwright/test';
import { BasePatientPane } from './BasePatientPane';

export class ProgramPane extends BasePatientPane {
  readonly newFormButton!: Locator;

  constructor(page: Page) {
    super(page);
    this.newFormButton = this.page.getByTestId('button-i54d');
  }

  async waitForPageToLoad(): Promise<void> {
    await this.newFormButton.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle');
  }
}
