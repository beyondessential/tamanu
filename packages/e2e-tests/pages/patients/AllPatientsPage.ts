import { Locator, Page } from '@playwright/test';
import { routes } from '../../config/routes';
import { BasePage } from '../BasePage';
import { expect } from '../../fixtures/baseFixture';

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
  readonly searchResultsPaginationOneOfOne: Locator;
  readonly nhnResultCell: Locator;
  readonly secondNHNResultCell: Locator;

  constructor(page: Page) {
    super(page, routes.patients.all);

    this.allPatientsTable = page.getByRole('table');
    this.allPatientsTableLoadingCell = page.getByTestId('statustablecell-rwkq').filter( { hasText: 'Loading' });
    this.addNewPatientBtn = page.getByTestId('component-enxe');
    this.NewPatientFirstName = page.getByTestId('localisedfield-cqua-input');
    this.NewPatientLastName = page.getByTestId('localisedfield-41un-input');
    this.NewPatientDOBtxt = page.getByTestId('localisedfield-oafl-input').getByRole('textbox');
    this.NewPatientMaleChk = page.getByTestId('controllabel-kkx2-male');
    this.NewPatientFemaleChk = page.getByTestId('controllabel-kkx2-female');
    this.NewPatientNHN = page.getByTestId('id-8niy');
    this.NewPatientConfirmBtn = page.getByTestId('formsubmitbutton-ygc6');
    this.nhnSearchInput = page.getByRole('textbox', { name: 'NHN' });
    this.patientSearchButton = page.getByRole('button', { name: 'Search', exact: true });
    this.patientListingsHeader = page.getByRole('heading', { name: 'Patient listing' });
    this.searchResultsPagination = page.getByTestId('pagerecordcount-m8ne');
    this.searchResultsPaginationOneOfOne = page.getByTestId('pagerecordcount-m8ne').filter({ hasText: "1–1 of 1" });
    this.nhnResultCell = page.getByTestId('styledtablecell-2gyy-0-displayId');
    this.secondNHNResultCell = page.getByTestId('styledtablecell-2gyy-1-displayId');
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
    //this has a short timeout to account for flakiness, in searchForAndSelectPatientByNHN it will try again if it timesout
    await this.nhnResultCell.filter({ hasText: nhn }).click({ timeout: 5000 });
    await this.page.waitForURL('**/#/patients/all/*');
  }

  async navigateToPatientDetailsPage(nhn: string) {
    await this.goto();
    await expect(this.patientListingsHeader).toBeVisible();
    await this.searchForAndSelectPatientByNHN(nhn);
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

  async searchForAndSelectPatientByNHN(nhn: string, maxAttempts = 10) {
    let attempts = 0;
    while (attempts < maxAttempts) {
      try {
        await this.nhnSearchInput.fill(nhn);
        await this.patientSearchButton.click();
        await this.waitForTableToLoad();
        
        //the below if statement is to handle flakiness where sometimes a patient isn't immediately searchable after being created
        if (await this.page.getByRole('cell', { name: 'No patients found' }).isVisible()) {
          return this.searchForAndSelectPatientByNHN(nhn);
        }
        
        //the below if statement is required because sometimes the search results load all results instead of the specific result
        if (await this.secondNHNResultCell.isVisible()) {
          await this.page.reload();
          await this.page.waitForTimeout(3000);
          return this.searchForAndSelectPatientByNHN(nhn);
        }

        await this.clickOnSearchResult(nhn);
        return;
      } catch (error) {
        attempts++;
        if (attempts === maxAttempts) {
          throw error;
        }
        await this.page.waitForTimeout(1000);
      }
    }
  }
}
