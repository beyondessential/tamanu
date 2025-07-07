import { Locator, Page } from '@playwright/test';
import { routes } from '../../config/routes';
import { BasePage } from '../BasePage';
import { expect } from '../../fixtures/baseFixture';
import { PatientTable } from './PatientTable';

export class AllPatientsPage extends BasePage {
  readonly patientTable: PatientTable;
  readonly addNewPatientBtn: Locator;
  readonly NewPatientFirstName: Locator;
  readonly NewPatientLastName: Locator;
  readonly NewPatientDOBtxt: Locator;
  readonly NewPatientMaleChk: Locator;
  readonly NewPatientFemaleChk: Locator;
  readonly NewPatientNHN: Locator;
  readonly NewPatientConfirmBtn: Locator;
  readonly nhnSearchInput: Locator;
  readonly patientSearchButton: Locator;
  readonly patientListingsHeader: Locator;
  readonly searchResultsPagination: Locator;
  readonly searchResultsPaginationOneOfOne: Locator;
  readonly newPatientVillageSearchBox: Locator;
  _patientData?: {
    id: string;
    firstName: string;
    lastName: string;
    gender: string;
    formattedDOB: string;
    nhn: string;
    village: string,
    culturalName: string
  };

  constructor(page: Page) {
    super(page, routes.patients.all);
    this.patientTable = new PatientTable(page);
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
    this.searchResultsPaginationOneOfOne = page
      .getByTestId('pagerecordcount-m8ne')
      .filter({ hasText: '1–1 of 1' });
    this.newPatientVillageSearchBox = page.getByTestId('localisedfield-rpma-input').locator('input');
  }

  setPatientData(data: {
    id: string;
    firstName: string;
    lastName: string;
    gender: string;
    formattedDOB: string;
    nhn: string;
    culturalName: string;
    village: string;
  }) {
    this._patientData = data;
  }

  getPatientData() {
    if (!this._patientData) throw new Error('Patient data has not been set');
    return this._patientData;
  }

  async navigateToPatientDetailsPage(nhn: string) {
    await this.goto();
    await expect(this.patientListingsHeader).toBeVisible();
    await this.searchForAndSelectPatientByNHN(nhn);
  }

  async fillNewPatientDetails(firstName: string, lastName: string, dob: string, gender: string) {
    await this.NewPatientFirstName.fill(firstName);
    await this.NewPatientLastName.fill(lastName);

    await this.NewPatientDOBtxt.click();
    await this.NewPatientDOBtxt.fill(dob);

    if (gender === 'female') {
      await this.NewPatientFemaleChk.check();
    } else {
      await this.NewPatientMaleChk.check();
    }
  }

  async searchForAndSelectPatientByNHN(nhn: string, maxAttempts = 100) {
    let attempts = 0;
    while (attempts < maxAttempts) {
      try {
        await this.nhnSearchInput.fill(nhn);
        await this.patientSearchButton.click();
        await this.patientTable.waitForTableToLoad();

        //the below if statement is to handle flakiness where sometimes a patient isn't immediately searchable after being created
        if (await this.page.getByRole('cell', { name: 'No patients found' }).isVisible()) {
          attempts++;
          continue;
        }

        //the below if statement is required because sometimes the search results load all results instead of the specific result
        if (await this.patientTable.secondNHNResultCell.isVisible()) {
          await this.page.reload();
          await this.page.waitForTimeout(3000);
          attempts++;
          continue;
        }

        await this.patientTable.clickOnSearchResult(nhn);
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