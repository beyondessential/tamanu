import { Page } from '@playwright/test';

export class BasePatientPane {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }
}
