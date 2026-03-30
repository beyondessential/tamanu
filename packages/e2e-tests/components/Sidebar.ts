import { Locator, Page } from '@playwright/test';
import { ids } from '@ids';

export class Sidebar {
  readonly userAndFacilityName: Locator;
  readonly logoutButton: Locator;

  constructor(readonly page: Page) {
    this.userAndFacilityName = page.getByTestId(ids.sidebar.userAndFacilityName);
    this.logoutButton = page.getByTestId(ids.sidebar.logoutButton);
  }

  /** Get the facility display name from the sidebar. */
  async getFacilityName(): Promise<string> {
    return this.userAndFacilityName.evaluate((node) => {
      const parts = node.innerHTML
        .split(/<br\s*\/?>/i)
        .map((p) => p.trim())
        .filter(Boolean);
      return parts.at(-1) ?? '';
    });
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }
}
