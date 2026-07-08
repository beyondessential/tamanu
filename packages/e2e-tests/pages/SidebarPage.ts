import { Locator, Page } from '@playwright/test';

import { routes } from '../config/routes';
import { BasePage } from './BasePage';

export class SidebarPage extends BasePage {
  readonly userAndFacilityName: Locator;
  readonly logOutButton: Locator;
  /** Top-level facility nav item for {@link routes.dashboard} (see TopLevelSidebarItem test id suffix). */
  readonly dashboardTopLevelItem: Locator;

  constructor(page: Page) {
    super(page);

    this.userAndFacilityName = page.getByTestId('connectedto-6awb');
    this.logOutButton = page.getByTestId('logoutbutton-4zn4');
    const dashboardPathKey = routes.dashboard.split('/').filter(Boolean).pop() ?? 'dashboard';
    this.dashboardTopLevelItem = page.getByTestId(`toplevellistitem-a957-${dashboardPathKey}`);
  }

  async goToDashboard(): Promise<void> {
    await this.dashboardTopLevelItem.click();
  }

  async getFacilityName(): Promise<string> {
    return this.userAndFacilityName.evaluate(node => {
      const parts = node.innerHTML
        .split(/<br\s*\/?>/i)
        .map(part => part.trim())
        .filter(Boolean);
      return parts.at(-1) ?? '';
    });
  }
}
