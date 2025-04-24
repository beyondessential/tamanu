import { Page } from '@playwright/test';

export class BasePatientModal {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }
}
