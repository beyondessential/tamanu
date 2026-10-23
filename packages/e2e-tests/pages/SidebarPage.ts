import { Locator, Page } from '@playwright/test';

import { expect } from '../fixtures/baseFixture';
import { BasePage } from './BasePage';

export class SidebarPage extends BasePage {
  readonly userAndFacilityName: Locator;
  readonly logOutButton: Locator;
  readonly allPatientsItem: Locator;
  readonly emergencyPatientsItem: Locator;
  readonly facilityAdminSection: Locator;
  readonly recentlyDischargedPatientsItem: Locator;

  constructor(page: Page) {
    super(page);

    this.userAndFacilityName = page.getByTestId('connectedto-6awb');
    this.logOutButton = page.getByTestId('logoutbutton-4zn4');
    this.allPatientsItem = page.getByTestId('secondarylistitem-patients-all');
    this.emergencyPatientsItem = page.getByTestId('secondarylistitem-patients-emergency');
    this.facilityAdminSection = page.getByTestId('primarylistitem-facility-admin');
    this.recentlyDischargedPatientsItem = page.getByTestId(
      'secondarylistitem-facility-admin-recently-discharged-patients',
    );
  }

  // In-app (SPA) navigation, as opposed to BasePage.goto() which reloads the page
  async clickAllPatients() {
    await this.allPatientsItem.click();
    await this.page.waitForURL('**/patients/all');
  }

  async clickEmergencyPatients() {
    await this.emergencyPatientsItem.click();
    await this.page.waitForURL('**/patients/emergency');
  }

  async clickRecentlyDischargedPatients() {
    await this.openFacilityAdminSection();
    await this.recentlyDischargedPatientsItem.click();
    await this.page.waitForURL('**/facility-admin/recently-discharged-patients');
  }

  // The sidebar opens whichever section matches the current route and collapses the rest,
  // unmounting their items when the collapse finishes. A navigation that is still settling
  // therefore still shows the previous route's items, so decide from the route rather than
  // from what happens to be on screen, or the item detaches mid-click.
  private async openFacilityAdminSection() {
    if (this.page.url().includes('/facility-admin')) {
      await expect(this.recentlyDischargedPatientsItem).toBeVisible();
      return;
    }
    await expect(this.recentlyDischargedPatientsItem).toBeHidden();
    // Clicking a section header toggles it
    await this.facilityAdminSection.click();
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
