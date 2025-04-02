import { faker } from "@faker-js/faker";
import { AllPatientPage } from "../pages/AllPatientPage";
import { expect, Locator, Page } from "@playwright/test";

export class TestHelper {
  static generatePatientData() {
    const gender = faker.helpers.arrayElement(["male", "female"]);
    const firstName = faker.person.firstName(gender);
    const lastName = faker.person.lastName();
    const dob = faker.date.birthdate({ min: 18, max: 80, mode: "age" });
    const formattedDOB = dob.toISOString().split("T")[0]; // Convert to YYYY-MM-DD format

    return { firstName, lastName, gender, formattedDOB, nhn: '' };
  }

  static async addNewPatientWithRequiredFields(page: Page) {
    const allPatientPage = new AllPatientPage(page);
    allPatientPage.addNewPatientbtn.click();

    const patientData = this.generatePatientData();
    console.log(
      `✅ Generated Patient: ${patientData.firstName} ${patientData.lastName}`,
    );

    await allPatientPage.fillNewPatientDetails(
      patientData.firstName,
      patientData.lastName,
      patientData.formattedDOB,
      patientData.gender,
    );

    patientData.nhn = await allPatientPage.NewPatientNHN.textContent() || '';
    await allPatientPage.NewPatientConirmBtn.click();

    console.log(`✅ Assigned NHN: ${patientData.nhn}`);
    return patientData;
  }

  //the summary tab is awaited first to ensure everything is loaded otherwise tests can be flaky
  async fillComboBox(fieldLocator: Locator, fieldValue: string, page: Page) {
    await expect(page.getByRole('tab', { name: ' Summary' })).toBeVisible();
    await fieldLocator.click();
    await fieldLocator.fill(fieldValue);
    await page.getByText(fieldValue).click();
  }
}