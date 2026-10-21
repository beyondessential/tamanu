import { Locator, Page } from '@playwright/test';

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
    // Clicking a section header toggles it, so only open Facility admin when it's collapsed
    await this.facilityAdminSection.waitFor();
    if (!(await this.recentlyDischargedPatientsItem.isVisible())) {
      await this.facilityAdminSection.click();
    }
    await this.recentlyDischargedPatientsItem.click();
    await this.page.waitForURL('**/facility-admin/recently-discharged-patients');
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
