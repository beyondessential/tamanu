import { Locator, Page } from "@playwright/test";

export class BasePage {
  protected page: Page;
  readonly tamanuArrow: Locator;
  readonly dashboard: Locator;
  readonly patients: Locator;
  readonly allPatients: Locator;
  readonly Inpatients: Locator;
  readonly emergencyPatients: Locator;
  readonly outPatients: Locator;
  //readonly scheduling: Locator;
  //readonly medication: Locator;
  //readonly imaging: Locator;
  //readonly labs: Locator;
  //readonly immunisation: Locator;
  //readonly programRegisrty: Locator;
  //readonly facilityAdmin: Locator;
  //readonly facilityName : Locator;
  readonly logoutBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tamanuArrow = page.locator('svg[hidden="true"]');
    this.dashboard = page.getByText("Dashboard");
    this.patients = page
      .locator('[data-test-class="primary-sidebar-item"]')
      .getByText("Patients");
    this.allPatients = page.getByText("All patients").nth(0);
    this.Inpatients = page.getByText("inpatients");
    this.emergencyPatients = page.getByText("Emegerncy patients");
    this.outPatients = page.getByText("Outpatients");
    this.logoutBtn = page.getByText("Log out");
  }

  protected async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }
  async navigateToDashboard() {
    await this.dashboard.click();
  }
  async navigateToAllPatients() {
    if (await this.elementExists(this.allPatients)) {
      await this.allPatients.click();
    } else {
      await this.patients.click();
      await this.allPatients.click();
    }
  }
  async navigateToInpatients() {
    await this.patients.click();
    await this.Inpatients.click();
  }
  async navigateToEmergencyPatients() {
    await this.patients.click();
    await this.emergencyPatients.click();
  }

  async navigateToOutPatient() {
    await this.patients.click();
    await this.outPatients.click();
  }
  async logout() {
    await this.logoutBtn.click();
  }
   // Method to check if an element exists
   async elementExists(locator: Locator): Promise<boolean> {
    const count = await locator.count();
    return count > 0;
  }
  async goto() {
    await this.page.goto('/');
    await this.waitForPageLoad();
}
}
