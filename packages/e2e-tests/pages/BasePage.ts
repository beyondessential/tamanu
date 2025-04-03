import { Page } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page) {
    this.page = page;
  }

  async navigateTo(url) {
    await this.page.goto(url);
  }
}
