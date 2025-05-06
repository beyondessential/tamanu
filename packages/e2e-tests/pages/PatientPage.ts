import { BasePage } from "./basePages/BasePage";
import { Locator, Page, expect } from "@playwright/test";

export class PatientPage extends BasePage {

  // Login page specific selectors
  readonly patientFirstNameLbl: Locator;
  readonly patientLastNameLbl: Locator;
  readonly NHNlbl: Locator;
  readonly emailErrorMessage: Locator;    
  readonly passwordErrorMessage: Locator;
  readonly patientDOBLbl: Locator;
  readonly patientSexLbl: Locator;
  readonly patientNHNLbl: Locator;

  constructor(page: Page) {
      super(page);
      this.patientFirstNameLbl = this.page.locator('[data-test-id="core-info-patient-first-name"]');
      this.patientLastNameLbl = this.page.locator('[data-test-id="core-info-patient-last-name"]');
    
      this.NHNlbl = this.page.locator('[data-test-class="display-id-label"]');
      this.patientDOBLbl = this.page.locator('[data-test-id="core-info-patient-dob"]');
      this.patientSexLbl = this.page.locator('[data-test-id="core-info-patient-sex"]').locator('p').nth(1);
      this.patientNHNLbl = this.page.locator('[data-test-class="display-id-label"]');
  }
  

  async verifyPatientDetails(patientData: any) {
    await expect(this.patientFirstNameLbl).toHaveText(patientData.firstName);
    await expect(this.patientLastNameLbl).toHaveText(patientData.lastName);
    //await expect(this.patientDOBLbl).toHaveText(patientData.formattedDOB);
    await expect(this.patientSexLbl).toHaveText(new RegExp(patientData.gender, 'i'));
    await expect(this.patientNHNLbl).toHaveText(new RegExp(patientData.nhn, 'i'));
  }
}
