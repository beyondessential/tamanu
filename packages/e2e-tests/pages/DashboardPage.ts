import { Page } from '@playwright/test';
import { facilityUrl, routes } from '@helpers/navigation';

export class DashboardPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto(facilityUrl(routes.dashboard));
  }
}
