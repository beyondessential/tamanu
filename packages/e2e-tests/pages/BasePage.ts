import { Page } from '@playwright/test';
import { constructFacilityUrl } from '../utils/navigation';

export class BasePage {
  readonly page: Page;
  readonly url?: string;

  constructor(page: Page, url?: string) {
    this.page = page;
    this.url = url;
  }

  async goto() {
    if (!this.url) {
      throw new Error('Base URL is not defined');
    }

    await this.page.goto(constructFacilityUrl(this.url));
  }

  async navigateTo(url) {
    await this.page.goto(constructFacilityUrl(url));
  }
}
