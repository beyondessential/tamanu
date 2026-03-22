import { Locator, Page } from '@playwright/test';

import { BasePage } from './BasePage';

export class SidebarPage extends BasePage {
  readonly userAndFacilityName: Locator;
  readonly logOutButton: Locator;

  constructor(page: Page) {
    super(page);

    this.userAndFacilityName = page.getByTestId('connectedto-6awb');
    this.logOutButton = page.getByTestId('logoutbutton-4zn4');
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
