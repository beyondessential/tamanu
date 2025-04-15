import { Locator, Page } from '@playwright/test';
import { routes } from '../../config/routes';
import { BasePage } from '../BasePage';
import { expect } from '../../fixtures/baseFixture';

//TODO: is expect(this.page.getByText(nhn)).toBeVisible(); in navigateToPatientDetailsPage scalable? is there a better way to do this?
//TODO: there are test ids in the constructor that don't seem to work yet, maybe will work after the test-id card is merged? both were added in the original setup E2E tests PR
export class AllPatientsPage extends BasePage {
  readonly allPatientsTable: Locator;
  readonly allPatientsTableLoadingCell: Locator;
  readonly addNewPatientBtn: Locator;
  readonly NewPatientFirstName: Locator;
  readonly NewPatientLastName: Locator;
  readonly NewPatientDOBtxt: Locator;
  readonly NewPatientMaleChk: Locator;
  readonly NewPatientFemaleChk: Locator;
  readonly NewPatientNHN: Locator;
  readonly NewPatientConfirmBtn: Locator;
  _patientData?: { firstName: string; lastName: string; gender: string; formattedDOB: string; nhn: string };
  readonly nhnSearchInput: Locator;
  readonly patientSearchButton: Locator;
  readonly patientListingsHeader: Locator;
  readonly searchResultsPagination: Locator;

  constructor(page: Page) {
    super(page, routes.patients.all);
    // Test ID currently not working
    // this.allPatientsTable = page.getByTestId('patienttable-l8c2');
    this.allPatientsTable = page.getByRole('table');
    //this test ID doesn't seem to work either alhtough it wasn't commented out in the original code I branched from
    // this.allPatientsTableLoadingCell = this.allPatientsTable.getByTestId('translatedtext-yvlt');
    this.allPatientsTableLoadingCell = page.getByRole('cell', { name: 'Loading...' });
    this.addNewPatientBtn = page.getByRole('button', { name: '+ Add new patient' });
    this.NewPatientFirstName = page
    .getByRole("dialog")
    .locator('input[name="firstName"]');
  this.NewPatientLastName = page
    .getByRole("dialog")
    .locator('input[name="lastName"]');
  this.NewPatientDOBtxt = page
    .getByRole("dialog")
    .locator('input[type="date"]');
  this.NewPatientMaleChk = page
    .getByLabel("sex")
    .getByText("Male", { exact: true });
  this.NewPatientFemaleChk = page
    .getByLabel("sex")
    .getByText("Female", { exact: true });
  this.NewPatientNHN = page.locator('[data-test-class="id-field-div"]');
  this.NewPatientConfirmBtn = page.getByText("Confirm");
  this.nhnSearchInput = page.getByRole('textbox', { name: 'NHN' });
  this.patientSearchButton = page.getByRole('button', { name: 'Search', exact: true });
  this.patientListingsHeader = page.getByRole('heading', { name: 'Patient listing' });
  this.searchResultsPagination = page.getByTestId('pagerecordcount-m8ne');
}
  setPatientData(data: { firstName: string; lastName: string; gender: string; formattedDOB: string; nhn: string }) {
    this._patientData = data;
  }

  getPatientData() {
    if (!this._patientData) throw new Error('Patient data has not been set');
    return this._patientData;
  }

  async waitForTableToLoad() {
    await this.allPatientsTableLoadingCell.waitFor({ state: 'hidden' });
  }

  async clickOnFirstRow() {
    await this.waitForTableToLoad();
    await this.allPatientsTable.locator('tbody tr').first().click();
    await this.page.waitForURL('**/#/patients/all/*');
  }

  async clickOnSearchResult(nhn: string) {
    await this.waitForTableToLoad();
    await this.page.getByRole('cell', { name: nhn }).click();
    await this.page.waitForURL('**/#/patients/all/*');
  }

  async navigateToPatientDetailsPage(nhn: string) {
    await this.goto();
    await expect(this.patientListingsHeader).toBeVisible();
    await this.searchForPatientByNHN(nhn);
    await this.clickOnSearchResult(nhn);
  }

  async fillNewPatientDetails(
    firstName: string,
    lastName: string,
    dob: string,
    gender: string,
  ) {
    await this.NewPatientFirstName.fill(firstName);
    await this.NewPatientLastName.fill(lastName);

    await this.NewPatientDOBtxt.click();
    await this.NewPatientDOBtxt.fill(dob);
    
    if (gender === "female") {
      await this.NewPatientFemaleChk.check();
    } else {
      await this.NewPatientMaleChk.check();
    }
  }


  async searchForPatientByNHN(nhn: string) {
    await this.nhnSearchInput.fill(nhn);
    await this.patientSearchButton.click();
    await this.waitForTableToLoad();
 //the below if statement is to handle flakiness where sometimes a patient isn't immediately searchable after being created
    if (await this.page.getByRole('cell', { name: 'No patients found' }).isVisible()) {
      await this.patientSearchButton.click();
    }
    await expect(this.searchResultsPagination).toContainText('1–1 of 1');
  }
}
